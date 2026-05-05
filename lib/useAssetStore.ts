'use client'

import { useCallback, useEffect, useState } from 'react'
import { Account, AppState, CryptoHolding, CryptoLocation, CryptoSale, DailyBalance, StockHolding, StockLocation, StockSale, Transaction } from './types'

const STORAGE_KEY = 'asset-tracker-app'

const defaultState: AppState = {
  accounts: [],
  stockLocations: [
    { id: 'stock-loc-1', name: 'Nanovest', createdAt: Date.now() },
    { id: 'stock-loc-2', name: 'Ajaib', createdAt: Date.now() },
    { id: 'stock-loc-3', name: 'Crypto', createdAt: Date.now() },
  ],
  cryptoLocations: [
    { id: 'crypto-loc-1', name: 'Binance', createdAt: Date.now() },
    { id: 'crypto-loc-2', name: 'Coinbase', createdAt: Date.now() },
    { id: 'crypto-loc-3', name: 'Cold Wallet', createdAt: Date.now() },
  ],
  transactions: [],
  dailyBalances: [],
  stocks: [],
  cryptos: [],
  stockSales: [],
  cryptoSales: [],
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

      // Handle topup (no from account) and withdrawal (no to account)
      const topups = state.transactions
        .filter((tx) => !tx.fromAccountId && tx.toAccountId === accountId)
        .reduce((sum, tx) => sum + tx.amount, 0)

      const withdrawals = state.transactions
        .filter((tx) => !tx.toAccountId && tx.fromAccountId === accountId)
        .reduce((sum, tx) => sum + tx.amount, 0)

      return incoming + topups - outgoing - withdrawals
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

  const addStockLocation = useCallback((location: Omit<StockLocation, 'id' | 'createdAt'>) => {
    setState((prev) => ({
      ...prev,
      stockLocations: [
        ...prev.stockLocations,
        {
          ...location,
          id: Date.now().toString(),
          createdAt: Date.now(),
        },
      ],
      lastUpdated: Date.now(),
    }))
  }, [])

  const updateStockLocation = useCallback((id: string, updates: Partial<Omit<StockLocation, 'id' | 'createdAt'>>) => {
    setState((prev) => ({
      ...prev,
      stockLocations: prev.stockLocations.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc)),
      lastUpdated: Date.now(),
    }))
  }, [])

  const deleteStockLocation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      stockLocations: prev.stockLocations.filter((loc) => loc.id !== id),
      stocks: prev.stocks.filter((stock) => stock.locationId !== id),
      lastUpdated: Date.now(),
    }))
  }, [])

  const addCrypto = useCallback((crypto: Omit<CryptoHolding, 'id' | 'createdAt'>) => {
    setState((prev) => ({
      ...prev,
      cryptos: [
        ...prev.cryptos,
        {
          ...crypto,
          id: Date.now().toString(),
          createdAt: Date.now(),
        },
      ],
      lastUpdated: Date.now(),
    }))
  }, [])

  const updateCrypto = useCallback((id: string, updates: Partial<Omit<CryptoHolding, 'id' | 'createdAt'>>) => {
    setState((prev) => ({
      ...prev,
      cryptos: prev.cryptos.map((crypto) => (crypto.id === id ? { ...crypto, ...updates } : crypto)),
      lastUpdated: Date.now(),
    }))
  }, [])

  const deleteCrypto = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      cryptos: prev.cryptos.filter((crypto) => crypto.id !== id),
      lastUpdated: Date.now(),
    }))
  }, [])

  const getCryptoValue = useCallback(
    (cryptoId: string): number => {
      const crypto = state.cryptos.find((c) => c.id === cryptoId)
      if (!crypto) return 0
      return crypto.quantity * crypto.currentPrice
    },
    [state.cryptos]
  )

  const getCryptoProfitLoss = useCallback(
    (cryptoId: string): { amount: number; percentage: number } => {
      const crypto = state.cryptos.find((c) => c.id === cryptoId)
      if (!crypto) return { amount: 0, percentage: 0 }
      
      const totalCost = crypto.quantity * crypto.averagePrice
      const currentValue = crypto.quantity * crypto.currentPrice
      const amount = currentValue - totalCost
      const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0
      
      return { amount, percentage }
    },
    [state.cryptos]
  )

  const getTotalCryptoValue = useCallback((): number => {
    return state.cryptos.reduce((sum, crypto) => sum + getCryptoValue(crypto.id), 0)
  }, [state.cryptos, getCryptoValue])

  const addCryptoLocation = useCallback((location: Omit<CryptoLocation, 'id' | 'createdAt'>) => {
    setState((prev) => ({
      ...prev,
      cryptoLocations: [
        ...prev.cryptoLocations,
        {
          ...location,
          id: Date.now().toString(),
          createdAt: Date.now(),
        },
      ],
      lastUpdated: Date.now(),
    }))
  }, [])

  const updateCryptoLocation = useCallback((id: string, updates: Partial<Omit<CryptoLocation, 'id' | 'createdAt'>>) => {
    setState((prev) => ({
      ...prev,
      cryptoLocations: prev.cryptoLocations.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc)),
      lastUpdated: Date.now(),
    }))
  }, [])

  const deleteCryptoLocation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      cryptoLocations: prev.cryptoLocations.filter((loc) => loc.id !== id),
      cryptos: prev.cryptos.filter((crypto) => crypto.locationId !== id),
      lastUpdated: Date.now(),
    }))
  }, [])

  const sellStock = useCallback((stockId: string, quantity: number, salePrice: number) => {
    setState((prev) => {
      const stock = prev.stocks.find((s) => s.id === stockId)
      if (!stock || quantity <= 0 || stock.quantity < quantity) return prev

      const realizedPnL = quantity * salePrice - quantity * stock.averagePrice
      const realizedPnLPercent = (realizedPnL / (quantity * stock.averagePrice)) * 100

      const updatedStocks = stock.quantity === quantity
        ? prev.stocks.filter((s) => s.id !== stockId)
        : prev.stocks.map((s) =>
            s.id === stockId
              ? { ...s, quantity: s.quantity - quantity }
              : s
          )

      return {
        ...prev,
        stocks: updatedStocks,
        stockSales: [
          ...prev.stockSales,
          {
            id: Date.now().toString(),
            stockId,
            ticker: stock.ticker,
            quantity,
            salePrice,
            averageCostPrice: stock.averagePrice,
            realizedPnL,
            realizedPnLPercent,
            saleDate: Date.now(),
            createdAt: Date.now(),
          },
        ],
        lastUpdated: Date.now(),
      }
    })
  }, [])

  const sellCrypto = useCallback((cryptoId: string, quantity: number, salePrice: number) => {
    setState((prev) => {
      const crypto = prev.cryptos.find((c) => c.id === cryptoId)
      if (!crypto || quantity <= 0 || crypto.quantity < quantity) return prev

      const realizedPnL = quantity * salePrice - quantity * crypto.averagePrice
      const realizedPnLPercent = (realizedPnL / (quantity * crypto.averagePrice)) * 100

      const updatedCryptos = crypto.quantity === quantity
        ? prev.cryptos.filter((c) => c.id !== cryptoId)
        : prev.cryptos.map((c) =>
            c.id === cryptoId
              ? { ...c, quantity: c.quantity - quantity }
              : c
          )

      return {
        ...prev,
        cryptos: updatedCryptos,
        cryptoSales: [
          ...prev.cryptoSales,
          {
            id: Date.now().toString(),
            cryptoId,
            symbol: crypto.symbol,
            quantity,
            salePrice,
            averageCostPrice: crypto.averagePrice,
            realizedPnL,
            realizedPnLPercent,
            saleDate: Date.now(),
            createdAt: Date.now(),
          },
        ],
        lastUpdated: Date.now(),
      }
    })
  }, [])

  const getTotalRealizedPnL = useCallback((): { stocks: number; cryptos: number; total: number } => {
    const stockPnL = state.stockSales.reduce((sum, sale) => sum + sale.realizedPnL, 0)
    const cryptoPnL = state.cryptoSales.reduce((sum, sale) => sum + sale.realizedPnL, 0)
    return {
      stocks: stockPnL,
      cryptos: cryptoPnL,
      total: stockPnL + cryptoPnL,
    }
  }, [state.stockSales, state.cryptoSales])

  return {
    // State
    accounts: state.accounts,
    stockLocations: state.stockLocations,
    cryptoLocations: state.cryptoLocations,
    transactions: state.transactions,
    dailyBalances: state.dailyBalances,
    stocks: state.stocks,
    cryptos: state.cryptos,
    stockSales: state.stockSales,
    cryptoSales: state.cryptoSales,
    mounted,

    // Account operations
    addAccount,
    updateAccount,
    deleteAccount,

    // Stock Location operations
    addStockLocation,
    updateStockLocation,
    deleteStockLocation,

    // Crypto Location operations
    addCryptoLocation,
    updateCryptoLocation,
    deleteCryptoLocation,

    // Transaction operations
    addTransaction,
    deleteTransaction,

    // Stock operations
    addStock,
    updateStock,
    deleteStock,

    // Crypto operations
    addCrypto,
    updateCrypto,
    deleteCrypto,

    // Sale operations
    sellStock,
    sellCrypto,

    // Queries
    getAccountBalance,
    getTotalBalance,
    getAccountTransactions,
    getStockValue,
    getStockProfitLoss,
    getTotalStockValue,
    getCryptoValue,
    getCryptoProfitLoss,
    getTotalCryptoValue,
    getTotalRealizedPnL,
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
