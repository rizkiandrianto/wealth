import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Account,
  AppState,
  CryptoHolding,
  CryptoLocation,
  DailyBalance,
  StockHolding,
  StockLocation,
  Transaction,
} from '@/lib/types'

interface AssetStore extends AppState {
  mounted: boolean

  // Account operations
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'createdAt'>>) => void
  deleteAccount: (id: string) => void

  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void
  deleteTransaction: (id: string) => void

  // Stock Location operations
  addStockLocation: (location: Omit<StockLocation, 'id' | 'createdAt'>) => void
  updateStockLocation: (id: string, updates: Partial<Omit<StockLocation, 'id' | 'createdAt'>>) => void
  deleteStockLocation: (id: string) => void

  // Stock operations
  addStock: (stock: Omit<StockHolding, 'id' | 'createdAt'>) => void
  updateStock: (id: string, updates: Partial<Omit<StockHolding, 'id' | 'createdAt'>>) => void
  deleteStock: (id: string) => void
  sellStock: (stockId: string, quantity: number, salePrice: number) => void

  // Crypto Location operations
  addCryptoLocation: (location: Omit<CryptoLocation, 'id' | 'createdAt'>) => void
  updateCryptoLocation: (id: string, updates: Partial<Omit<CryptoLocation, 'id' | 'createdAt'>>) => void
  deleteCryptoLocation: (id: string) => void

  // Crypto operations
  addCrypto: (crypto: Omit<CryptoHolding, 'id' | 'createdAt'>) => void
  updateCrypto: (id: string, updates: Partial<Omit<CryptoHolding, 'id' | 'createdAt'>>) => void
  deleteCrypto: (id: string) => void
  sellCrypto: (cryptoId: string, quantity: number, salePrice: number) => void

  // Queries
  getAccountBalance: (accountId: string) => number
  getTotalBalance: () => number
  getAccountTransactions: (accountId: string) => Transaction[]
  getStockValue: (stockId: string) => number
  getStockProfitLoss: (stockId: string) => { amount: number; percentage: number }
  getTotalStockValue: () => number
  getCryptoValue: (cryptoId: string) => number
  getCryptoProfitLoss: (cryptoId: string) => { amount: number; percentage: number }
  getTotalCryptoValue: () => number
  getTotalRealizedPnL: () => { stocks: number; cryptos: number; total: number }
}

function calculateDailyBalances(accounts: Account[], transactions: Transaction[]): DailyBalance[] {
  const balancesByDate: Map<string, Map<string, number>> = new Map()
  const sortedTransactions = [...transactions].sort((a, b) => a.date - b.date)

  for (const account of accounts) {
    balancesByDate.set(account.id, new Map())
  }

  for (const tx of sortedTransactions) {
    const dateStr = new Date(tx.date).toISOString().split('T')[0]
    const fromMap = (tx.fromAccountId ? balancesByDate.get(tx.fromAccountId) : undefined) || new Map()
    const toMap = (tx.toAccountId ? balancesByDate.get(tx.toAccountId) : undefined) || new Map()

    fromMap.set(dateStr, (fromMap.get(dateStr) ?? 0) - tx.amount)
    toMap.set(dateStr, (toMap.get(dateStr) ?? 0) + tx.amount)

    if (tx.fromAccountId) balancesByDate.set(tx.fromAccountId, fromMap)
    if (tx.toAccountId) balancesByDate.set(tx.toAccountId, toMap)
  }

  const allDates = new Set<string>()
  for (const dateMap of balancesByDate.values()) {
    for (const date of dateMap.keys()) allDates.add(date)
  }

  return Array.from(allDates)
    .sort()
    .map((date) => ({
      date,
      balances: Object.fromEntries(
        accounts.map((account) => [account.id, balancesByDate.get(account.id)?.get(date) ?? 0])
      ),
    }))
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      // Initial state
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
      mounted: false,

      // Account operations
      addAccount: (account) =>
        set((s) => ({
          accounts: [...s.accounts, { ...account, id: Date.now().toString(), createdAt: Date.now() }],
          lastUpdated: Date.now(),
        })),

      updateAccount: (id, updates) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
          lastUpdated: Date.now(),
        })),

      deleteAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          transactions: s.transactions.filter((tx) => tx.fromAccountId !== id && tx.toAccountId !== id),
          lastUpdated: Date.now(),
        })),

      // Transaction operations
      addTransaction: (transaction) =>
        set((s) => {
          const newTx: Transaction = { ...transaction, id: Date.now().toString(), createdAt: Date.now() }
          const transactions = [...s.transactions, newTx]
          return {
            transactions,
            dailyBalances: calculateDailyBalances(s.accounts, transactions),
            lastUpdated: Date.now(),
          }
        }),

      deleteTransaction: (id) =>
        set((s) => {
          const transactions = s.transactions.filter((tx) => tx.id !== id)
          return {
            transactions,
            dailyBalances: calculateDailyBalances(s.accounts, transactions),
            lastUpdated: Date.now(),
          }
        }),

      // Stock Location operations
      addStockLocation: (location) =>
        set((s) => ({
          stockLocations: [...s.stockLocations, { ...location, id: Date.now().toString(), createdAt: Date.now() }],
          lastUpdated: Date.now(),
        })),

      updateStockLocation: (id, updates) =>
        set((s) => ({
          stockLocations: s.stockLocations.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc)),
          lastUpdated: Date.now(),
        })),

      deleteStockLocation: (id) =>
        set((s) => ({
          stockLocations: s.stockLocations.filter((loc) => loc.id !== id),
          stocks: s.stocks.filter((stock) => stock.locationId !== id),
          lastUpdated: Date.now(),
        })),

      // Stock operations
      addStock: (stock) =>
        set((s) => ({
          stocks: [...s.stocks, { ...stock, id: Date.now().toString(), createdAt: Date.now() }],
          lastUpdated: Date.now(),
        })),

      updateStock: (id, updates) =>
        set((s) => ({
          stocks: s.stocks.map((stock) => (stock.id === id ? { ...stock, ...updates } : stock)),
          lastUpdated: Date.now(),
        })),

      deleteStock: (id) =>
        set((s) => ({
          stocks: s.stocks.filter((stock) => stock.id !== id),
          lastUpdated: Date.now(),
        })),

      sellStock: (stockId, quantity, salePrice) =>
        set((s) => {
          const stock = s.stocks.find((st) => st.id === stockId)
          if (!stock || quantity <= 0 || stock.quantity < quantity) return s

          const realizedPnL = quantity * salePrice - quantity * stock.averagePrice
          const realizedPnLPercent = (realizedPnL / (quantity * stock.averagePrice)) * 100

          return {
            stocks:
              stock.quantity === quantity
                ? s.stocks.filter((st) => st.id !== stockId)
                : s.stocks.map((st) => (st.id === stockId ? { ...st, quantity: st.quantity - quantity } : st)),
            stockSales: [
              ...s.stockSales,
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
        }),

      // Crypto Location operations
      addCryptoLocation: (location) =>
        set((s) => ({
          cryptoLocations: [...s.cryptoLocations, { ...location, id: Date.now().toString(), createdAt: Date.now() }],
          lastUpdated: Date.now(),
        })),

      updateCryptoLocation: (id, updates) =>
        set((s) => ({
          cryptoLocations: s.cryptoLocations.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc)),
          lastUpdated: Date.now(),
        })),

      deleteCryptoLocation: (id) =>
        set((s) => ({
          cryptoLocations: s.cryptoLocations.filter((loc) => loc.id !== id),
          cryptos: s.cryptos.filter((c) => c.locationId !== id),
          lastUpdated: Date.now(),
        })),

      // Crypto operations
      addCrypto: (crypto) =>
        set((s) => ({
          cryptos: [...s.cryptos, { ...crypto, id: Date.now().toString(), createdAt: Date.now() }],
          lastUpdated: Date.now(),
        })),

      updateCrypto: (id, updates) =>
        set((s) => ({
          cryptos: s.cryptos.map((c) => (c.id === id ? { ...c, ...updates } : c)),
          lastUpdated: Date.now(),
        })),

      deleteCrypto: (id) =>
        set((s) => ({
          cryptos: s.cryptos.filter((c) => c.id !== id),
          lastUpdated: Date.now(),
        })),

      sellCrypto: (cryptoId, quantity, salePrice) =>
        set((s) => {
          const crypto = s.cryptos.find((c) => c.id === cryptoId)
          if (!crypto || quantity <= 0 || crypto.quantity < quantity) return s

          const realizedPnL = quantity * salePrice - quantity * crypto.averagePrice
          const realizedPnLPercent = (realizedPnL / (quantity * crypto.averagePrice)) * 100

          return {
            cryptos:
              crypto.quantity === quantity
                ? s.cryptos.filter((c) => c.id !== cryptoId)
                : s.cryptos.map((c) => (c.id === cryptoId ? { ...c, quantity: c.quantity - quantity } : c)),
            cryptoSales: [
              ...s.cryptoSales,
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
        }),

      // Queries — read directly from current store state
      getAccountBalance: (accountId) => {
        const { accounts, transactions } = get()
        const account = accounts.find((a) => a.id === accountId)
        if (!account) return 0
        const incoming = transactions
          .filter((tx) => tx.toAccountId === accountId)
          .reduce((sum, tx) => sum + tx.amount, 0)
        const outgoing = transactions
          .filter((tx) => tx.fromAccountId === accountId)
          .reduce((sum, tx) => sum + tx.amount, 0)
        return incoming - outgoing
      },

      getTotalBalance: () => {
        const { accounts, getAccountBalance } = get()
        return accounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0)
      },

      getAccountTransactions: (accountId) => {
        const { transactions } = get()
        return transactions.filter((tx) => tx.fromAccountId === accountId || tx.toAccountId === accountId)
      },

      getStockValue: (stockId) => {
        const stock = get().stocks.find((s) => s.id === stockId)
        if (!stock) return 0
        return stock.quantity * stock.currentPrice
      },

      getStockProfitLoss: (stockId) => {
        const stock = get().stocks.find((s) => s.id === stockId)
        if (!stock) return { amount: 0, percentage: 0 }
        const totalCost = stock.quantity * stock.averagePrice
        const currentValue = stock.quantity * stock.currentPrice
        const amount = currentValue - totalCost
        return { amount, percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0 }
      },

      getTotalStockValue: () => {
        const { stocks, getStockValue } = get()
        return stocks.reduce((sum, s) => sum + getStockValue(s.id), 0)
      },

      getCryptoValue: (cryptoId) => {
        const crypto = get().cryptos.find((c) => c.id === cryptoId)
        if (!crypto) return 0
        return crypto.quantity * crypto.currentPrice
      },

      getCryptoProfitLoss: (cryptoId) => {
        const crypto = get().cryptos.find((c) => c.id === cryptoId)
        if (!crypto) return { amount: 0, percentage: 0 }
        const totalCost = crypto.quantity * crypto.averagePrice
        const currentValue = crypto.quantity * crypto.currentPrice
        const amount = currentValue - totalCost
        return { amount, percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0 }
      },

      getTotalCryptoValue: () => {
        const { cryptos, getCryptoValue } = get()
        return cryptos.reduce((sum, c) => sum + getCryptoValue(c.id), 0)
      },

      getTotalRealizedPnL: () => {
        const { stockSales, cryptoSales } = get()
        const stocks = stockSales.reduce((sum, s) => sum + s.realizedPnL, 0)
        const cryptos = cryptoSales.reduce((sum, s) => sum + s.realizedPnL, 0)
        return { stocks, cryptos, total: stocks + cryptos }
      },
    }),
    {
      name: 'asset-tracker-app',
      onRehydrateStorage: () => () => {
        useAssetStore.setState({ mounted: true })
      },
    }
  )
)
