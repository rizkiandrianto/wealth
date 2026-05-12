import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { cryptoHoldings, goldHoldings, stockHoldings, wealthAccounts } from '@/db/schema'
import { appDateStr } from '@/lib/snapshot'
import { upsertPortfolioSnapshot } from '@/lib/portfolioSnapshot'

function checkApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  return key !== null && key === process.env.INTERNAL_API_KEY
}

export async function POST(req: NextRequest) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dateStr = appDateStr(new Date())

  const [accountUsers, stockUsers, cryptoUsers, goldUsers] = await Promise.all([
    db.selectDistinct({ id: wealthAccounts.userId }).from(wealthAccounts),
    db.selectDistinct({ id: stockHoldings.userId }).from(stockHoldings),
    db.selectDistinct({ id: cryptoHoldings.userId }).from(cryptoHoldings),
    db.selectDistinct({ id: goldHoldings.userId }).from(goldHoldings),
  ])

  const userIds = Array.from(
    new Set([
      ...accountUsers.map((r) => r.id),
      ...stockUsers.map((r) => r.id),
      ...cryptoUsers.map((r) => r.id),
      ...goldUsers.map((r) => r.id),
    ]),
  )

  let snapshotsTouched = 0
  await db.transaction(async (tx) => {
    for (const userId of userIds) {
      await upsertPortfolioSnapshot(tx, userId, dateStr)
      snapshotsTouched++
    }
  })

  return NextResponse.json({ snapshotsTouched, date: dateStr })
}
