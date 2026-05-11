import { and, eq, gte, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { accountBalanceSnapshots, transactions } from '@/db/schema'

// db.transaction callback receives a different type than db, but both share
// the same query-builder surface. Use a structural type that accepts either.
type DbOrTx = Pick<typeof db, 'select' | 'selectDistinct' | 'insert' | 'update' | 'delete'>

/**
 * Compute running balance for an account as of end-of-day on `date` (inclusive).
 * = SUM(incoming) - SUM(outgoing) over all transactions for that account with tx.date <= date.
 */
async function runningBalance(
  tx: DbOrTx,
  userId: string,
  accountId: string,
  date: string
): Promise<string> {
  const endOfDay = new Date(`${date}T23:59:59.999Z`)
  const [row] = await tx
    .select({
      balance: sql<string>`COALESCE(SUM(
        CASE
          WHEN ${transactions.toAccountId} = ${accountId} THEN ${transactions.amount}
          WHEN ${transactions.fromAccountId} = ${accountId} THEN -${transactions.amount}
          ELSE 0
        END
      ), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        or(eq(transactions.fromAccountId, accountId), eq(transactions.toAccountId, accountId)),
        sql`${transactions.date} <= ${endOfDay}`
      )
    )
  return row?.balance ?? '0'
}

/**
 * Upsert a snapshot for (userId, accountId, date) using the computed running balance.
 */
export async function recomputeSnapshot(
  tx: DbOrTx,
  userId: string,
  accountId: string,
  date: string
): Promise<void> {
  const balance = await runningBalance(tx, userId, accountId, date)
  await tx
    .insert(accountBalanceSnapshots)
    .values({ userId, accountId, date, balance })
    .onConflictDoUpdate({
      target: [
        accountBalanceSnapshots.userId,
        accountBalanceSnapshots.accountId,
        accountBalanceSnapshots.date,
      ],
      set: { balance, updatedAt: new Date() },
    })
}

/**
 * Recompute snapshots for `accountId` at `fromDate` plus every existing snapshot date >= fromDate.
 * Use this when a transaction is inserted/deleted at `fromDate`: every subsequent snapshot's
 * running balance shifts by the transaction's delta, so each must be recomputed.
 */
export async function recomputeSnapshotsForward(
  tx: DbOrTx,
  userId: string,
  accountId: string,
  fromDate: string
): Promise<{ rowsTouched: number }> {
  const existing = await tx
    .selectDistinct({ date: accountBalanceSnapshots.date })
    .from(accountBalanceSnapshots)
    .where(
      and(
        eq(accountBalanceSnapshots.userId, userId),
        eq(accountBalanceSnapshots.accountId, accountId),
        gte(accountBalanceSnapshots.date, fromDate)
      )
    )

  const dates = new Set<string>([fromDate, ...existing.map((r) => r.date)])
  for (const date of dates) {
    await recomputeSnapshot(tx, userId, accountId, date)
  }
  return { rowsTouched: dates.size }
}
