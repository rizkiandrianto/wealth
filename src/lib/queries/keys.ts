import type { SnapshotRange } from '@/lib/snapshot'

export const queryKeys = {
  accounts: ['accounts'] as const,
  transactions: ['transactions'] as const,
  accountSnapshots: {
    all: ['accountSnapshots'] as const,
    range: (range: SnapshotRange) => ['accountSnapshots', range] as const,
  },
  stocks: ['stocks'] as const,
  stocksSummary: ['stocks', 'summary'] as const,
  stocksTickers: ['stocks', 'tickers'] as const,
  stockLocations: ['stockLocations'] as const,
  stockSales: ['stockSales'] as const,
  stockSalesSummary: ['stockSales', 'summary'] as const,
  cryptos: ['cryptos'] as const,
  cryptosSummary: ['cryptos', 'summary'] as const,
  cryptosTickers: ['cryptos', 'tickers'] as const,
  cryptoLocations: ['cryptoLocations'] as const,
  cryptoSales: ['cryptoSales'] as const,
  cryptoSalesSummary: ['cryptoSales', 'summary'] as const,
  golds: ['golds'] as const,
  goldsSummary: ['golds', 'summary'] as const,
  goldsTicker: ['golds', 'ticker'] as const,
  goldLocations: ['goldLocations'] as const,
  goldSales: ['goldSales'] as const,
  goldSalesSummary: ['goldSales', 'summary'] as const,
  assetPrices: ['assetPrices'] as const,
  portfolioSnapshots: {
    all: ['portfolioSnapshots'] as const,
    range: (range: SnapshotRange) => ['portfolioSnapshots', range] as const,
  },
} as const
