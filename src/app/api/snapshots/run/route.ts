import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { and, eq, sql } from 'drizzle-orm'
import { transactions, users } from '@/db/schema'
import { appDateStr, recomputeSnapshotsForward } from '@/lib/snapshot'

type AuthResult =
  | { mode: 'session'; userIds: string[] }
  | { mode: 'apiKey'; userIds: string[] }
  | { mode: 'unauthorized' }

async function resolveAuth(req: NextRequest, bodyUserEmail?: string): Promise<AuthResult> {
  const apiKeyHeader = req.headers.get('x-api-key')
  const configured = process.env.WEALTH_INGEST_API_KEY

  if (apiKeyHeader && configured && apiKeyHeader === configured) {
    if (bodyUserEmail) {
      const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, bodyUserEmail))
      return u ? { mode: 'apiKey', userIds: [u.id] } : { mode: 'unauthorized' }
    }
    // No userEmail → run for every user in the DB.
    const rows = await db.select({ id: users.id }).from(users)
    return { mode: 'apiKey', userIds: rows.map((r) => r.id) }
  }

  const session = await auth()
  return session?.user?.id
    ? { mode: 'session', userIds: [session.user.id] }
    : { mode: 'unauthorized' }
}

async function runForUser(userId: string, dateStr: string) {
  const txRows = await db
    .select({
      fromAccountId: transactions.fromAccountId,
      toAccountId: transactions.toAccountId,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        sql`${transactions.date}::date = ${dateStr}::date`
      )
    )

  const affected = new Set<string>()
  for (const row of txRows) {
    if (row.fromAccountId) affected.add(row.fromAccountId)
    if (row.toAccountId) affected.add(row.toAccountId)
  }

  let snapshotsUpserted = 0
  await db.transaction(async (tx) => {
    for (const accountId of affected) {
      const { rowsTouched } = await recomputeSnapshotsForward(tx, userId, accountId, dateStr)
      snapshotsUpserted += rowsTouched
    }
  })

  return { userId, accountsAffected: affected.size, snapshotsUpserted }
}

export async function POST(req: NextRequest) {
  let body: { userEmail?: string; date?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body optional
  }

  const result = await resolveAuth(req, body.userEmail)
  if (result.mode === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dateStr = body.date ?? appDateStr(new Date())
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'Invalid date (expected YYYY-MM-DD)' }, { status: 400 })
  }

  const perUser = []
  for (const userId of result.userIds) {
    perUser.push(await runForUser(userId, dateStr))
  }

  return NextResponse.json({
    date: dateStr,
    usersProcessed: perUser.length,
    results: perUser,
  })
}
