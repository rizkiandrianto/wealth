import { Banknote, PiggyBank, Wallet, type LucideIcon } from 'lucide-react'
import type { AccountType } from '@/lib/types'

export const ACCOUNT_TYPE_ICONS: Record<AccountType, LucideIcon> = {
  bank: Banknote,
  deposit: PiggyBank,
  cash: Wallet,
}

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  bank: 'from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/40 dark:to-purple-900/20 dark:border-purple-900/70',
  deposit: 'from-green-50 to-green-100 border-green-200 dark:from-green-950/40 dark:to-green-900/20 dark:border-green-900/70',
  cash: 'from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950/40 dark:to-yellow-900/20 dark:border-yellow-900/70',
}
