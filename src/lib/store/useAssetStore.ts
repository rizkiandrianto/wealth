import { create } from 'zustand'
import {
  Account,
  AccountType,
  AppState,
  AssetPrice,
  CryptoHolding,
  CryptoLocation,
  CryptoSale,
  DailyBalance,
  GoldHolding,
  GoldLocation,
  GoldSale,
  StockHolding,
  StockLocation,
  StockSale,
  Transaction,
} from '@/lib/types'

// ─── DB row → store type normalizers ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

const ts = (v: unknown) => new Date(v as string).getTime()
const num = (v: unknown) => parseFloat(v as string)

const toAccount = (r: Row): Account => ({
  id: r.id, name: r.name, type: r.type as AccountType,
  currency: r.currency, createdAt: ts(r.createdAt),
})

const toTransaction = (r: Row): Transaction => ({
  id: r.id,
  fromAccountId: r.fromAccountId ?? undefined,
  toAccountId: r.toAccountId ?? undefined,
  amount: num(r.amount),
  description: r.description ?? undefined,
  date: ts(r.date),
  createdAt: ts(r.createdAt),
})

const toLocation = (r: Row): StockLocation | CryptoLocation => ({
  id: r.id, name: r.name, createdAt: ts(r.createdAt),
})

const toStock = (r: Row): StockHolding => ({
  id: r.id, ticker: r.ticker, locationId: r.locationId,
  quantity: num(r.quantity), averagePrice: num(r.averagePrice),
  purchaseDate: ts(r.purchaseDate), createdAt: ts(r.createdAt),
})

const toCrypto = (r: Row): CryptoHolding => ({
  id: r.id, symbol: r.symbol, name: r.name, locationId: r.locationId,
  quantity: num(r.quantity), averagePrice: num(r.averagePrice),
  purchaseDate: ts(r.purchaseDate), createdAt: ts(r.createdAt),
})

const toStockSale = (r: Row): StockSale => ({
  id: r.id, stockId: r.stockId, ticker: r.ticker,
  quantity: num(r.quantity), salePrice: num(r.salePrice),
  averageCostPrice: num(r.averageCostPrice),
  realizedPnL: num(r.realizedPnl), realizedPnLPercent: num(r.realizedPnlPercent),
  saleDate: ts(r.saleDate), createdAt: ts(r.createdAt),
})

const toCryptoSale = (r: Row): CryptoSale => ({
  id: r.id, cryptoId: r.cryptoId, symbol: r.symbol,
  quantity: num(r.quantity), salePrice: num(r.salePrice),
  averageCostPrice: num(r.averageCostPrice),
  realizedPnL: num(r.realizedPnl), realizedPnLPercent: num(r.realizedPnlPercent),
  saleDate: ts(r.saleDate), createdAt: ts(r.createdAt),
})

const toAssetPrice = (r: Row): AssetPrice => ({
  ticker: r.ticker, assetType: r.assetType as 'stock' | 'crypto' | 'gold',
  name: r.name, price: num(r.price), currency: r.currency,
  updatedAt: ts(r.updatedAt),
})

const toGoldLocation = (r: Row): GoldLocation => ({
  id: r.id, name: r.name, createdAt: ts(r.createdAt),
})

const toGold = (r: Row): GoldHolding => ({
  id: r.id, locationId: r.locationId,
  weight: num(r.weight), purchasePrice: num(r.purchasePrice),
  purchaseDate: ts(r.purchaseDate), createdAt: ts(r.createdAt),
})

const toGoldSale = (r: Row): GoldSale => ({
  id: r.id, goldId: r.goldId,
  weight: num(r.weight), salePrice: num(r.salePrice),
  averageCostPrice: num(r.averageCostPrice),
  realizedPnL: num(r.realizedPnl), realizedPnLPercent: num(r.realizedPnlPercent),
  saleDate: ts(r.saleDate), createdAt: ts(r.createdAt),
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_STOCK_LOCATIONS = ['Nanovest', 'Ajaib', 'Pluang']
const DEFAULT_CRYPTO_LOCATIONS = ['Binance', 'Indodax', 'Cold Wallet']

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status}`)
  if (res.status === 204) return null
  return res.json()
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

// ─── Store interface ──────────────────────────────────────────────────────────

interface AssetStore extends AppState {
  isLoading: boolean
  error: string | null

  // Bootstrap
  fetchAll: () => Promise<void>

  // Account operations
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'createdAt'>>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>

  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>

  // Stock Location operations
  addStockLocation: (location: Omit<StockLocation, 'id' | 'createdAt'>) => Promise<string>
  updateStockLocation: (id: string, updates: Partial<Omit<StockLocation, 'id' | 'createdAt'>>) => Promise<void>
  deleteStockLocation: (id: string) => Promise<void>

  // Stock operations
  addStock: (stock: Omit<StockHolding, 'id' | 'createdAt'>) => Promise<void>
  updateStock: (id: string, updates: Partial<Omit<StockHolding, 'id' | 'createdAt'>>) => Promise<void>
  deleteStock: (id: string) => Promise<void>
  sellStock: (stockId: string, quantity: number, salePrice: number) => Promise<void>

  // Crypto Location operations
  addCryptoLocation: (location: Omit<CryptoLocation, 'id' | 'createdAt'>) => Promise<string>
  updateCryptoLocation: (id: string, updates: Partial<Omit<CryptoLocation, 'id' | 'createdAt'>>) => Promise<void>
  deleteCryptoLocation: (id: string) => Promise<void>

  // Crypto operations
  addCrypto: (crypto: Omit<CryptoHolding, 'id' | 'createdAt'>) => Promise<void>
  updateCrypto: (id: string, updates: Partial<Omit<CryptoHolding, 'id' | 'createdAt'>>) => Promise<void>
  deleteCrypto: (id: string) => Promise<void>
  sellCrypto: (cryptoId: string, quantity: number, salePrice: number) => Promise<void>

  // Gold Location operations
  addGoldLocation: (location: Omit<GoldLocation, 'id' | 'createdAt'>) => Promise<string>
  updateGoldLocation: (id: string, updates: Partial<Omit<GoldLocation, 'id' | 'createdAt'>>) => Promise<void>
  deleteGoldLocation: (id: string) => Promise<void>

  // Gold operations
  addGold: (gold: Omit<GoldHolding, 'id' | 'createdAt'>) => Promise<void>
  updateGold: (id: string, updates: Partial<Omit<GoldHolding, 'id' | 'createdAt'>>) => Promise<void>
  deleteGold: (id: string) => Promise<void>
  sellGold: (goldId: string, weight: number, salePrice: number) => Promise<void>

  // Asset price operations
  setAssetPrices: (prices: AssetPrice[]) => void

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

  // Gold queries
  getGoldValue: (goldId: string) => number
  getGoldProfitLoss: (goldId: string) => { amount: number; percentage: number }
  getTotalGoldValue: () => number
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useAssetStore = create<AssetStore>()(
  (set, get) => ({
    // Initial state
    accounts: [],
    stockLocations: [],
    cryptoLocations: [],
    goldLocations: [],
    transactions: [],
    dailyBalances: [],
    stocks: [],
    cryptos: [],
    golds: [],
    stockSales: [],
    cryptoSales: [],
    goldSales: [],
    assetPrices: [],
    lastUpdated: Date.now(),
    isLoading: false,
    error: null,

    // ── Bootstrap ───────────────────────────────────────────────────────────

    fetchAll: async () => {
      set({ isLoading: true, error: null })
      try {
        const [
          accountRows,
          txRows,
          stockLocRows,
          cryptoLocRows,
          goldLocRows,
          stockRows,
          cryptoRows,
          goldRows,
          stockSaleRows,
          cryptoSaleRows,
          goldSaleRows,
          priceRows,
        ] = await Promise.all([
          apiFetch('/api/accounts'),
          apiFetch('/api/transactions'),
          apiFetch('/api/stock-locations'),
          apiFetch('/api/crypto-locations'),
          apiFetch('/api/gold-locations'),
          apiFetch('/api/stocks'),
          apiFetch('/api/crypto'),
          apiFetch('/api/gold'),
          apiFetch('/api/stocks/sales'),
          apiFetch('/api/crypto/sales'),
          apiFetch('/api/gold/sales'),
          apiFetch('/api/market/prices'),
        ])

        const accounts: Account[] = accountRows.map(toAccount)
        const transactions: Transaction[] = txRows.map(toTransaction)

        // Seed default locations on first use
        let stockLocations: StockLocation[] = stockLocRows.map(toLocation)
        if (stockLocations.length === 0) {
          stockLocations = await Promise.all(
            DEFAULT_STOCK_LOCATIONS.map(async (name) => {
              const row = await apiFetch('/api/stock-locations', {
                method: 'POST',
                body: JSON.stringify({ name }),
              })
              return toLocation(row) as StockLocation
            })
          )
        }

        let cryptoLocations: CryptoLocation[] = cryptoLocRows.map(toLocation)
        if (cryptoLocations.length === 0) {
          cryptoLocations = await Promise.all(
            DEFAULT_CRYPTO_LOCATIONS.map(async (name) => {
              const row = await apiFetch('/api/crypto-locations', {
                method: 'POST',
                body: JSON.stringify({ name }),
              })
              return toLocation(row) as CryptoLocation
            })
          )
        }

        set({
          accounts,
          transactions,
          dailyBalances: calculateDailyBalances(accounts, transactions),
          stockLocations,
          cryptoLocations,
          goldLocations: goldLocRows.map(toGoldLocation),
          stocks: stockRows.map(toStock),
          cryptos: cryptoRows.map(toCrypto),
          golds: goldRows.map(toGold),
          stockSales: stockSaleRows.map(toStockSale),
          cryptoSales: cryptoSaleRows.map(toCryptoSale),
          goldSales: goldSaleRows.map(toGoldSale),
          assetPrices: priceRows.map(toAssetPrice),
          lastUpdated: Date.now(),
          isLoading: false,
        })
      } catch (err) {
        set({ isLoading: false, error: (err as Error).message })
      }
    },

    // ── Account operations ───────────────────────────────────────────────────

    addAccount: async (account) => {
      const row = await apiFetch('/api/accounts', {
        method: 'POST', body: JSON.stringify(account),
      })
      set((s) => ({ accounts: [...s.accounts, toAccount(row)], lastUpdated: Date.now() }))
    },

    updateAccount: async (id, updates) => {
      const row = await apiFetch(`/api/accounts/${id}`, {
        method: 'PATCH', body: JSON.stringify(updates),
      })
      set((s) => ({
        accounts: s.accounts.map((a) => (a.id === id ? toAccount(row) : a)),
        lastUpdated: Date.now(),
      }))
    },

    deleteAccount: async (id) => {
      await apiFetch(`/api/accounts/${id}`, { method: 'DELETE' })
      set((s) => {
        const accounts = s.accounts.filter((a) => a.id !== id)
        const transactions = s.transactions.filter((tx) => tx.fromAccountId !== id && tx.toAccountId !== id)
        return {
          accounts,
          transactions,
          dailyBalances: calculateDailyBalances(accounts, transactions),
          lastUpdated: Date.now(),
        }
      })
    },

    // ── Transaction operations ───────────────────────────────────────────────

    addTransaction: async (transaction) => {
      const row = await apiFetch('/api/transactions', {
        method: 'POST', body: JSON.stringify(transaction),
      })
      set((s) => {
        const transactions = [...s.transactions, toTransaction(row)]
        return {
          transactions,
          dailyBalances: calculateDailyBalances(s.accounts, transactions),
          lastUpdated: Date.now(),
        }
      })
    },

    deleteTransaction: async (id) => {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })
      set((s) => {
        const transactions = s.transactions.filter((tx) => tx.id !== id)
        return {
          transactions,
          dailyBalances: calculateDailyBalances(s.accounts, transactions),
          lastUpdated: Date.now(),
        }
      })
    },

    // ── Stock Location operations ────────────────────────────────────────────

    addStockLocation: async (location) => {
      const row = await apiFetch('/api/stock-locations', {
        method: 'POST', body: JSON.stringify(location),
      })
      const newLoc = toLocation(row) as StockLocation
      set((s) => ({ stockLocations: [...s.stockLocations, newLoc], lastUpdated: Date.now() }))
      return newLoc.id
    },

    updateStockLocation: async (id, updates) => {
      const row = await apiFetch(`/api/stock-locations/${id}`, {
        method: 'PATCH', body: JSON.stringify(updates),
      })
      set((s) => ({
        stockLocations: s.stockLocations.map((loc) => (loc.id === id ? toLocation(row) as StockLocation : loc)),
        lastUpdated: Date.now(),
      }))
    },

    deleteStockLocation: async (id) => {
      await apiFetch(`/api/stock-locations/${id}`, { method: 'DELETE' })
      set((s) => ({
        stockLocations: s.stockLocations.filter((loc) => loc.id !== id),
        stocks: s.stocks.filter((stock) => stock.locationId !== id),
        lastUpdated: Date.now(),
      }))
    },

    // ── Stock operations ─────────────────────────────────────────────────────

    addStock: async (stock) => {
      const row = await apiFetch('/api/stocks', {
        method: 'POST', body: JSON.stringify({
          ...stock,
          purchaseDate: stock.purchaseDate,
        }),
      })
      set((s) => ({ stocks: [...s.stocks, toStock(row)], lastUpdated: Date.now() }))
    },

    updateStock: async (id, updates) => {
      const row = await apiFetch(`/api/stocks/${id}`, {
        method: 'PATCH', body: JSON.stringify(updates),
      })
      set((s) => ({
        stocks: s.stocks.map((stock) => (stock.id === id ? toStock(row) : stock)),
        lastUpdated: Date.now(),
      }))
    },

    deleteStock: async (id) => {
      await apiFetch(`/api/stocks/${id}`, { method: 'DELETE' })
      set((s) => ({ stocks: s.stocks.filter((stock) => stock.id !== id), lastUpdated: Date.now() }))
    },

    sellStock: async (stockId, quantity, salePrice) => {
      const stock = get().stocks.find((s) => s.id === stockId)
      if (!stock || quantity <= 0 || stock.quantity < quantity) return

      const row = await apiFetch(`/api/stocks/${stockId}/sell`, {
        method: 'POST', body: JSON.stringify({ quantity, salePrice }),
      })

      set((s) => ({
        stocks: stock.quantity === quantity
          ? s.stocks.filter((st) => st.id !== stockId)
          : s.stocks.map((st) => st.id === stockId ? { ...st, quantity: st.quantity - quantity } : st),
        stockSales: [...s.stockSales, toStockSale(row)],
        lastUpdated: Date.now(),
      }))
    },

    // ── Crypto Location operations ───────────────────────────────────────────

    addCryptoLocation: async (location) => {
      const row = await apiFetch('/api/crypto-locations', {
        method: 'POST', body: JSON.stringify(location),
      })
      const newLoc = toLocation(row) as CryptoLocation
      set((s) => ({ cryptoLocations: [...s.cryptoLocations, newLoc], lastUpdated: Date.now() }))
      return newLoc.id
    },

    updateCryptoLocation: async (id, updates) => {
      const row = await apiFetch(`/api/crypto-locations/${id}`, {
        method: 'PATCH', body: JSON.stringify(updates),
      })
      set((s) => ({
        cryptoLocations: s.cryptoLocations.map((loc) => (loc.id === id ? toLocation(row) as CryptoLocation : loc)),
        lastUpdated: Date.now(),
      }))
    },

    deleteCryptoLocation: async (id) => {
      await apiFetch(`/api/crypto-locations/${id}`, { method: 'DELETE' })
      set((s) => ({
        cryptoLocations: s.cryptoLocations.filter((loc) => loc.id !== id),
        cryptos: s.cryptos.filter((c) => c.locationId !== id),
        lastUpdated: Date.now(),
      }))
    },

    // ── Crypto operations ────────────────────────────────────────────────────

    addCrypto: async (crypto) => {
      const row = await apiFetch('/api/crypto', {
        method: 'POST', body: JSON.stringify(crypto),
      })
      set((s) => ({ cryptos: [...s.cryptos, toCrypto(row)], lastUpdated: Date.now() }))
    },

    updateCrypto: async (id, updates) => {
      const row = await apiFetch(`/api/crypto/${id}`, {
        method: 'PATCH', body: JSON.stringify(updates),
      })
      set((s) => ({
        cryptos: s.cryptos.map((c) => (c.id === id ? toCrypto(row) : c)),
        lastUpdated: Date.now(),
      }))
    },

    deleteCrypto: async (id) => {
      await apiFetch(`/api/crypto/${id}`, { method: 'DELETE' })
      set((s) => ({ cryptos: s.cryptos.filter((c) => c.id !== id), lastUpdated: Date.now() }))
    },

    sellCrypto: async (cryptoId, quantity, salePrice) => {
      const crypto = get().cryptos.find((c) => c.id === cryptoId)
      if (!crypto || quantity <= 0 || crypto.quantity < quantity) return

      const row = await apiFetch(`/api/crypto/${cryptoId}/sell`, {
        method: 'POST', body: JSON.stringify({ quantity, salePrice }),
      })

      set((s) => ({
        cryptos: crypto.quantity === quantity
          ? s.cryptos.filter((c) => c.id !== cryptoId)
          : s.cryptos.map((c) => c.id === cryptoId ? { ...c, quantity: c.quantity - quantity } : c),
        cryptoSales: [...s.cryptoSales, toCryptoSale(row)],
        lastUpdated: Date.now(),
      }))
    },

    // ── Gold Location operations ─────────────────────────────────────────────

    addGoldLocation: async (location) => {
      const row = await apiFetch('/api/gold-locations', {
        method: 'POST', body: JSON.stringify(location),
      })
      const newLoc = toGoldLocation(row)
      set((s) => ({ goldLocations: [...s.goldLocations, newLoc], lastUpdated: Date.now() }))
      return newLoc.id
    },

    updateGoldLocation: async (id, updates) => {
      const row = await apiFetch(`/api/gold-locations/${id}`, {
        method: 'PATCH', body: JSON.stringify(updates),
      })
      set((s) => ({
        goldLocations: s.goldLocations.map((loc) => (loc.id === id ? toGoldLocation(row) : loc)),
        lastUpdated: Date.now(),
      }))
    },

    deleteGoldLocation: async (id) => {
      await apiFetch(`/api/gold-locations/${id}`, { method: 'DELETE' })
      set((s) => ({
        goldLocations: s.goldLocations.filter((loc) => loc.id !== id),
        golds: s.golds.filter((g) => g.locationId !== id),
        lastUpdated: Date.now(),
      }))
    },

    // ── Gold operations ──────────────────────────────────────────────────────

    addGold: async (gold) => {
      const row = await apiFetch('/api/gold', {
        method: 'POST', body: JSON.stringify(gold),
      })
      set((s) => ({ golds: [...s.golds, toGold(row)], lastUpdated: Date.now() }))
    },

    updateGold: async (id, updates) => {
      const row = await apiFetch(`/api/gold/${id}`, {
        method: 'PATCH', body: JSON.stringify(updates),
      })
      set((s) => ({
        golds: s.golds.map((g) => (g.id === id ? toGold(row) : g)),
        lastUpdated: Date.now(),
      }))
    },

    deleteGold: async (id) => {
      await apiFetch(`/api/gold/${id}`, { method: 'DELETE' })
      set((s) => ({ golds: s.golds.filter((g) => g.id !== id), lastUpdated: Date.now() }))
    },

    sellGold: async (goldId, weight, salePrice) => {
      const gold = get().golds.find((g) => g.id === goldId)
      if (!gold || weight <= 0 || gold.weight < weight) return

      const row = await apiFetch(`/api/gold/${goldId}/sell`, {
        method: 'POST', body: JSON.stringify({ weight, salePrice }),
      })

      set((s) => ({
        golds: gold.weight === weight
          ? s.golds.filter((g) => g.id !== goldId)
          : s.golds.map((g) => g.id === goldId ? { ...g, weight: g.weight - weight } : g),
        goldSales: [...s.goldSales, toGoldSale(row)],
        lastUpdated: Date.now(),
      }))
    },

    // ── Asset prices ─────────────────────────────────────────────────────────

    setAssetPrices: (prices) =>
      set({ assetPrices: prices, lastUpdated: Date.now() }),

    // ── Queries ──────────────────────────────────────────────────────────────

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
      const { stocks, assetPrices } = get()
      const stock = stocks.find((s) => s.id === stockId)
      if (!stock) return 0
      const price = assetPrices.find((p) => p.ticker === stock.ticker)?.price ?? 0
      return stock.quantity * price
    },

    getStockProfitLoss: (stockId) => {
      const { stocks, assetPrices } = get()
      const stock = stocks.find((s) => s.id === stockId)
      if (!stock) return { amount: 0, percentage: 0 }
      const price = assetPrices.find((p) => p.ticker === stock.ticker)?.price ?? 0
      const totalCost = stock.quantity * stock.averagePrice
      const currentValue = stock.quantity * price
      const amount = currentValue - totalCost
      return { amount, percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0 }
    },

    getTotalStockValue: () => {
      const { stocks, getStockValue } = get()
      return stocks.reduce((sum, s) => sum + getStockValue(s.id), 0)
    },

    getCryptoValue: (cryptoId) => {
      const { cryptos, assetPrices } = get()
      const crypto = cryptos.find((c) => c.id === cryptoId)
      if (!crypto) return 0
      const price = assetPrices.find((p) => p.ticker === crypto.symbol)?.price ?? 0
      return crypto.quantity * price
    },

    getCryptoProfitLoss: (cryptoId) => {
      const { cryptos, assetPrices } = get()
      const crypto = cryptos.find((c) => c.id === cryptoId)
      if (!crypto) return { amount: 0, percentage: 0 }
      const price = assetPrices.find((p) => p.ticker === crypto.symbol)?.price ?? 0
      const totalCost = crypto.quantity * crypto.averagePrice
      const currentValue = crypto.quantity * price
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

    getGoldValue: (goldId) => {
      const { golds, assetPrices } = get()
      const gold = golds.find((g) => g.id === goldId)
      if (!gold) return 0
      const price = assetPrices.find((p) => p.ticker === 'XAU')?.price ?? 0
      return gold.weight * price
    },

    getGoldProfitLoss: (goldId) => {
      const { golds, assetPrices } = get()
      const gold = golds.find((g) => g.id === goldId)
      if (!gold) return { amount: 0, percentage: 0 }
      const price = assetPrices.find((p) => p.ticker === 'XAU')?.price ?? 0
      const totalCost = gold.weight * gold.purchasePrice
      const currentValue = gold.weight * price
      const amount = currentValue - totalCost
      return { amount, percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0 }
    },

    getTotalGoldValue: () => {
      const { golds, getGoldValue } = get()
      return golds.reduce((sum, g) => sum + getGoldValue(g.id), 0)
    },
  })
)
