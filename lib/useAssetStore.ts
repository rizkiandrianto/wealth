'use client'

import { useCallback, useEffect, useState } from 'react'
import { Account, AppState, DailyBalance, Transaction } from './types'

const STORAGE_KEY = 'asset-tracker-app'

const defaultState: AppState = {
  accounts: [],
  transactions: [],
  dailyBalances: [],
  lastUpdated: Date.now(),
}

export function useAssetStore() {
  const [state, setState] = useState<AppState>(defaultState)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setState(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored state:', e)
      }
    }
    setMounted(true)
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, mounted])

  const addAccount = useCallback((account: Omit<Account, 'id' | 'createdAt'>) => {
    setState((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        {
          ...account,
          id: Date.now().toString(),
          createdAt: Date.now(),
        },
      ],
      lastUpdated: Date.now(),
    }))
  }, [])

  const updateAccount = useCallback((id: string, updates: Partial<Omit<Account, 'id' | 'createdAt'>>) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc)),
      lastUpdated: Date.now(),
    }))
  }, [])

  const deleteAccount = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((acc) => acc.id !== id),
      transactions: prev.transactions.filter(
        (tx) => tx.fromAccountId !== id && tx.toAccountId !== id
      ),
      lastUpdated: Date.now(),
    }))
  }, [])

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: Date.now(),
    }

    setState((prev) => {
      const updated = {
        ...prev,
        transactions: [...prev.transactions, newTransaction],
        lastUpdated: Date.now(),
      }

      // Update daily balances
      updated.dailyBalances = calculateDailyBalances(updated.accounts, updated.transactions)

      return updated
    })
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setState((prev) => {
      const updated = {
        ...prev,
        transactions: prev.transactions.filter((tx) => tx.id !== id),
        lastUpdated: Date.now(),
      }

      // Recalculate daily balances
      updated.dailyBalances = calculateDailyBalances(updated.accounts, updated.transactions)

      return updated
    })
  }, [])

  const getAccountBalance = useCallback(
    (accountId: string): number => {
      const account = state.accounts.find((a) => a.id === accountId)
      if (!account) return 0

      const outgoing = state.transactions
        .filter((tx) => tx.fromAccountId === accountId)
        .reduce((sum, tx) => sum + tx.amount, 0)

      const incoming = state.transactions
        .filter((tx) => tx.toAccountId === accountId)
        .reduce((sum, tx) => sum + tx.amount, 0)

      return incoming - outgoing
    },
    [state.accounts, state.transactions]
  )

  const getTotalBalance = useCallback((): number => {
    return state.accounts.reduce((sum, account) => sum + getAccountBalance(account.id), 0)
  }, [state.accounts, getAccountBalance])

  const getAccountTransactions = useCallback(
    (accountId: string): Transaction[] => {
      return state.transactions.filter(
        (tx) => tx.fromAccountId === accountId || tx.toAccountId === accountId
      )
    },
    [state.transactions]
  )

  return {
    // State
    accounts: state.accounts,
    transactions: state.transactions,
    dailyBalances: state.dailyBalances,
    mounted,

    // Account operations
    addAccount,
    updateAccount,
    deleteAccount,

    // Transaction operations
    addTransaction,
    deleteTransaction,

    // Queries
    getAccountBalance,
    getTotalBalance,
    getAccountTransactions,
  }
}

function calculateDailyBalances(accounts: Account[], transactions: Transaction[]): DailyBalance[] {
  const balancesByDate: Map<string, Map<string, number>> = new Map()

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => a.date - b.date)

  // Initialize accounts with 0 balance
  for (const account of accounts) {
    balancesByDate.set(account.id, new Map())
  }

  // Process each transaction
  for (const tx of sortedTransactions) {
    const dateStr = new Date(tx.date).toISOString().split('T')[0]

    // Update balances for each account on this date and forward
    const fromMap = balancesByDate.get(tx.fromAccountId) || new Map()
    const toMap = balancesByDate.get(tx.toAccountId) || new Map()

    const fromCurrentBalance = fromMap.get(dateStr) ?? 0
    const toCurrentBalance = toMap.get(dateStr) ?? 0

    fromMap.set(dateStr, fromCurrentBalance - tx.amount)
    toMap.set(dateStr, toCurrentBalance + tx.amount)

    balancesByDate.set(tx.fromAccountId, fromMap)
    balancesByDate.set(tx.toAccountId, toMap)
  }

  // Convert to array format
  const allDates = new Set<string>()
  for (const dateMap of balancesByDate.values()) {
    for (const date of dateMap.keys()) {
      allDates.add(date)
    }
  }

  return Array.from(allDates)
    .sort()
    .map((date) => ({
      date,
      balances: Object.fromEntries(
        accounts.map((account) => [
          account.id,
          balancesByDate.get(account.id)?.get(date) ?? 0,
        ])
      ),
    }))
}
