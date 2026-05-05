'use client'

import { useCallback, useEffect, useState } from 'react'
import { Account, AppState, DailyBalance, StockHolding, Transaction } from './types'

const STORAGE_KEY = 'asset-tracker-app'

const defaultState: AppState = {
  accounts: [],
  transactions: [],
  dailyBalances: [],
  stocks: [],
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

  const addStock = useCallback((stock: Omit<StockHolding, 'id' | 'createdAt'>) => {
    setState((prev) => ({
      ...prev,
      stocks: [
        ...prev.stocks,
        {
          ...stock,
          id: Date.now().toString(),
          createdAt: Date.now(),
        },
      ],
      lastUpdated: Date.now(),
    }))
  }, [])

  const updateStock = useCallback((id: string, updates: Partial<Omit<StockHolding, 'id' | 'createdAt'>>) => {
    setState((prev) => ({
      ...prev,
      stocks: prev.stocks.map((stock) => (stock.id === id ? { ...stock, ...updates } : stock)),
      lastUpdated: Date.now(),
    }))
  }, [])

  const deleteStock = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      stocks: prev.stocks.filter((stock) => stock.id !== id),
      lastUpdated: Date.now(),
    }))
  }, [])

  const getStockValue = useCallback(
    (stockId: string): number => {
      const stock = state.stocks.find((s) => s.id === stockId)
      if (!stock) return 0
      return stock.quantity * stock.currentPrice
    },
    [state.stocks]
  )

  const getStockProfitLoss = useCallback(
    (stockId: string): { amount: number; percentage: number } => {
      const stock = state.stocks.find((s) => s.id === stockId)
      if (!stock) return { amount: 0, percentage: 0 }
      
      const totalCost = stock.quantity * stock.averagePrice
      const currentValue = stock.quantity * stock.currentPrice
      const amount = currentValue - totalCost
      const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0
      
      return { amount, percentage }
    },
    [state.stocks]
  )

  const getTotalStockValue = useCallback((): number => {
    return state.stocks.reduce((sum, stock) => sum + getStockValue(stock.id), 0)
  }, [state.stocks, getStockValue])

  return {
    // State
    accounts: state.accounts,
    transactions: state.transactions,
    dailyBalances: state.dailyBalances,
    stocks: state.stocks,
    mounted,

    // Account operations
    addAccount,
    updateAccount,
    deleteAccount,

    // Transaction operations
    addTransaction,
    deleteTransaction,

    // Stock operations
    addStock,
    updateStock,
    deleteStock,

    // Queries
    getAccountBalance,
    getTotalBalance,
    getAccountTransactions,
    getStockValue,
    getStockProfitLoss,
    getTotalStockValue,
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
