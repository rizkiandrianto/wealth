import { useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { useGuardedMutation } from './useGuardedMutation'
import { queryKeys } from './keys'

export interface SyncBalanceDiff {
  accountId: string
  accountName: string
  dbBalance: number
  sheetBalance: number
  delta: number
  action: 'topup' | 'withdrawal' | 'no-op'
  sheetMonth: string
}

export interface SyncBalancePreview {
  year: number
  asOf: string
  diffs: SyncBalanceDiff[]
  warnings: string[]
}

export interface SyncPreviewError {
  status: number
  body: unknown
}

export class SyncRequestError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.name = 'SyncRequestError'
    this.status = status
    this.body = body
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { error: text }
    }
  }
  if (!res.ok) {
    const message =
      (parsed && typeof parsed === 'object' && 'error' in parsed && typeof (parsed as { error: unknown }).error === 'string'
        ? (parsed as { error: string }).error
        : `POST ${path} → ${res.status}`)
    throw new SyncRequestError(res.status, parsed, message)
  }
  return parsed as T
}

export function useSyncBalancePreview() {
  return useGuardedMutation({
    mutationFn: async (input: { year?: number }) =>
      postJson<SyncBalancePreview>('/api/sync-balance/preview', input),
  })
}

export interface SyncCommitInput {
  year: number
  adjustmentDate: string
  diffs: Array<{ accountId: string; expectedDbBalance: number; sheetBalance: number }>
}

export function useSyncBalanceCommit() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: async (input: SyncCommitInput) =>
      postJson<{ created: unknown[] }>('/api/sync-balance/commit', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts })
      qc.invalidateQueries({ queryKey: queryKeys.transactions })
      qc.invalidateQueries({ queryKey: queryKeys.accountSnapshots.all })
      qc.invalidateQueries({ queryKey: queryKeys.portfolioSnapshots.all })
    },
  })
}
