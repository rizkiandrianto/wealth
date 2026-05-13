import { Account, DailyBalance } from '@/lib/types'
import type { SnapshotRow } from '@/lib/normalizers'

// Reads sparse per-account snapshots and expands them into one row per snapshot date.
// Each row carries forward the most recent known balance for every account.
export function buildDailyBalancesFromSnapshots(
  accounts: Account[],
  snapshots: SnapshotRow[]
): DailyBalance[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  const lastKnown: Record<string, number> = {}
  for (const a of accounts) lastKnown[a.id] = 0

  const byDate = new Map<string, Record<string, number>>()
  for (const snap of sorted) {
    lastKnown[snap.accountId] = snap.balance
    byDate.set(snap.date, { ...lastKnown })
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, balances]) => ({ date, balances }))
}
