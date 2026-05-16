import { NextRequest, NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { requireOwner } from '@/lib/auth'
import { db } from '@/db'
import { transactions, wealthAccounts } from '@/db/schema'
import { appDateStr, recomputeSnapshotsForward } from '@/lib/snapshot'

interface DiffPayload {
  accountId: string
  expectedDbBalance: number
  sheetBalance: number
}

const EPSILON = 0.005

export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner()
    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const { year, adjustmentDate, diffs } = body as {
      year?: number
      adjustmentDate?: string
      diffs?: DiffPayload[]
    }

    if (typeof adjustmentDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(adjustmentDate)) {
      return NextResponse.json(
        { error: 'adjustmentDate must be YYYY-MM-DD' },
        { status: 400 },
      )
    }
    if (!Array.isArray(diffs) || diffs.length === 0) {
      return NextResponse.json({ error: 'diffs is required' }, { status: 400 })
    }

    const txDate = new Date(`${adjustmentDate}T00:00:00.000Z`)
    if (!Number.isFinite(txDate.getTime())) {
      return NextResponse.json({ error: 'Invalid adjustmentDate' }, { status: 400 })
    }
    const dateStr = appDateStr(txDate)

    const created = await db.transaction(async (tx) => {
      const out: typeof transactions.$inferSelect[] = []

      for (const diff of diffs) {
        if (
          !diff ||
          typeof diff.accountId !== 'string' ||
          !Number.isFinite(diff.expectedDbBalance) ||
          !Number.isFinite(diff.sheetBalance)
        ) {
          throw new Response('Malformed diff entry', { status: 400 })
        }

        const [account] = await tx
          .select({
            id: wealthAccounts.id,
            balance: wealthAccounts.balance,
            userId: wealthAccounts.userId,
          })
          .from(wealthAccounts)
          .where(eq(wealthAccounts.id, diff.accountId))
          .limit(1)

        if (!account || account.userId !== userId) {
          throw new Response(`Account ${diff.accountId} not accessible`, { status: 403 })
        }

        const currentBalance = Number(account.balance)
        if (Math.abs(currentBalance - diff.expectedDbBalance) > EPSILON) {
          throw new Response(
            JSON.stringify({
              error: 'Balance changed since preview, refetch and retry',
              accountId: diff.accountId,
              currentBalance,
              expectedDbBalance: diff.expectedDbBalance,
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const delta = diff.sheetBalance - currentBalance
        if (Math.abs(delta) < EPSILON) continue

        const amount = Math.abs(delta)
        const amountStr = String(amount)
        const isTopup = delta > 0

        const [row] = await tx
          .insert(transactions)
          .values({
            userId,
            fromAccountId: isTopup ? null : diff.accountId,
            toAccountId: isTopup ? diff.accountId : null,
            amount: amountStr,
            description: 'Balance adjustment',
            date: txDate,
          })
          .returning()

        if (isTopup) {
          await tx
            .update(wealthAccounts)
            .set({ balance: sql`${wealthAccounts.balance} + ${amountStr}::numeric` })
            .where(eq(wealthAccounts.id, diff.accountId))
        } else {
          await tx
            .update(wealthAccounts)
            .set({ balance: sql`${wealthAccounts.balance} - ${amountStr}::numeric` })
            .where(eq(wealthAccounts.id, diff.accountId))
        }
        await recomputeSnapshotsForward(tx, userId, diff.accountId, dateStr)

        out.push(row)
      }

      return out
    })

    return NextResponse.json({ year: year ?? null, adjustmentDate, created })
  } catch (err) {
    if (err instanceof Response) return err
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
