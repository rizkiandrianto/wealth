import {
  Account,
  AccountType,
  AssetPrice,
  CryptoHolding,
  CryptoLocation,
  CryptoSale,
  GoldHolding,
  GoldLocation,
  GoldSale,
  StockHolding,
  StockLocation,
  StockSale,
  Transaction,
} from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>

export const ts = (v: unknown) => new Date(v as string).getTime()
export const num = (v: unknown) => parseFloat(v as string)

export const toAccount = (r: Row): Account => ({
  id: r.id, name: r.name, type: r.type as AccountType,
  currency: r.currency, balance: num(r.balance), createdAt: ts(r.createdAt),
})

export type SnapshotRow = { accountId: string; date: string; balance: number }
export const toSnapshot = (r: Row): SnapshotRow => ({
  accountId: r.accountId, date: r.date, balance: num(r.balance),
})

export const toTransaction = (r: Row): Transaction => ({
  id: r.id,
  fromAccountId: r.fromAccountId ?? undefined,
  toAccountId: r.toAccountId ?? undefined,
  amount: num(r.amount),
  description: r.description ?? undefined,
  date: ts(r.date),
  createdAt: ts(r.createdAt),
})

export const toStockLocation = (r: Row): StockLocation => ({
  id: r.id, name: r.name, createdAt: ts(r.createdAt),
})

export const toCryptoLocation = (r: Row): CryptoLocation => ({
  id: r.id, name: r.name, createdAt: ts(r.createdAt),
})

export const toGoldLocation = (r: Row): GoldLocation => ({
  id: r.id, name: r.name, createdAt: ts(r.createdAt),
})

export const toStock = (r: Row): StockHolding => ({
  id: r.id, ticker: r.ticker, locationId: r.locationId,
  market: (r.market === 'US' ? 'US' : 'IDX'),
  quantity: num(r.quantity), averagePrice: num(r.averagePrice),
  purchaseDate: ts(r.purchaseDate), createdAt: ts(r.createdAt),
})

export const toCrypto = (r: Row): CryptoHolding => ({
  id: r.id, symbol: r.symbol, name: r.name, locationId: r.locationId,
  quantity: num(r.quantity), averagePrice: num(r.averagePrice),
  purchaseDate: ts(r.purchaseDate), createdAt: ts(r.createdAt),
})

export const toGold = (r: Row): GoldHolding => ({
  id: r.id, locationId: r.locationId,
  weight: num(r.weight), purchasePrice: num(r.purchasePrice),
  purchaseDate: ts(r.purchaseDate), createdAt: ts(r.createdAt),
})

export const toStockSale = (r: Row): StockSale => ({
  id: r.id, stockId: r.stockId, ticker: r.ticker,
  quantity: num(r.quantity), salePrice: num(r.salePrice),
  averageCostPrice: num(r.averageCostPrice),
  realizedPnL: num(r.realizedPnl), realizedPnLPercent: num(r.realizedPnlPercent),
  saleDate: ts(r.saleDate), purchaseDate: ts(r.purchaseDate), createdAt: ts(r.createdAt),
})

export const toCryptoSale = (r: Row): CryptoSale => ({
  id: r.id, cryptoId: r.cryptoId, symbol: r.symbol,
  quantity: num(r.quantity), salePrice: num(r.salePrice),
  averageCostPrice: num(r.averageCostPrice),
  realizedPnL: num(r.realizedPnl), realizedPnLPercent: num(r.realizedPnlPercent),
  saleDate: ts(r.saleDate), purchaseDate: ts(r.purchaseDate), createdAt: ts(r.createdAt),
})

export const toGoldSale = (r: Row): GoldSale => ({
  id: r.id, goldId: r.goldId,
  weight: num(r.weight), salePrice: num(r.salePrice),
  averageCostPrice: num(r.averageCostPrice),
  realizedPnL: num(r.realizedPnl), realizedPnLPercent: num(r.realizedPnlPercent),
  saleDate: ts(r.saleDate), purchaseDate: ts(r.purchaseDate), createdAt: ts(r.createdAt),
})

export const toAssetPrice = (r: Row): AssetPrice => ({
  ticker: r.ticker, assetType: r.assetType as AssetPrice['assetType'],
  name: r.name, price: num(r.price), currency: r.currency,
  updatedAt: ts(r.updatedAt),
})
