export type DiffAction = 'topup' | 'withdrawal' | 'no-op'

export interface DiffInput {
  accountId: string
  accountName: string
  dbBalance: number
  sheetBalance: number
}

export interface DiffResult extends DiffInput {
  delta: number
  action: DiffAction
}

// Tolerance for floating-point comparison. Balances are stored as numeric(20,4),
// so differences below half a rupiah cent are noise.
const EPSILON = 0.005

export function computeDiff(input: DiffInput): DiffResult {
  const delta = input.sheetBalance - input.dbBalance
  let action: DiffAction
  if (Math.abs(delta) < EPSILON) {
    action = 'no-op'
  } else if (delta > 0) {
    action = 'topup'
  } else {
    action = 'withdrawal'
  }
  return { ...input, delta, action }
}
