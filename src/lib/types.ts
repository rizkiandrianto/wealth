export type AccountType = 'bank' | 'deposit' | 'cash';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: number;
}

export interface StockLocation {
  id: string;
  name: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  fromAccountId?: string; // Optional: if empty, it's a topup
  toAccountId?: string; // Optional: if empty, it's a withdrawal
  amount: number;
  description?: string;
  date: number; // timestamp
  createdAt: number;
}

export interface DailyBalance {
  date: string; // YYYY-MM-DD
  balances: {
    [accountId: string]: number;
  };
}

export interface AssetPrice {
  ticker: string;
  assetType: 'stock' | 'crypto';
  name: string;
  price: number;
  currency: string;
  updatedAt: number;
}

export interface StockHolding {
  id: string;
  ticker: string;
  locationId: string; // reference to StockLocation.id
  quantity: number;
  averagePrice: number; // in IDR
  purchaseDate: number; // timestamp
  createdAt: number;
}

export interface CryptoLocation {
  id: string;
  name: string;
  createdAt: number;
}

export interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  locationId: string; // reference to CryptoLocation.id
  quantity: number;
  averagePrice: number; // in IDR
  purchaseDate: number; // timestamp
  createdAt: number;
}

export interface StockSale {
  id: string;
  stockId: string;
  ticker: string;
  quantity: number;
  salePrice: number; // in IDR
  averageCostPrice: number; // in IDR
  realizedPnL: number; // in IDR
  realizedPnLPercent: number; // percentage
  saleDate: number; // timestamp
  createdAt: number;
}

export interface CryptoSale {
  id: string;
  cryptoId: string;
  symbol: string;
  quantity: number;
  salePrice: number; // in IDR
  averageCostPrice: number; // in IDR
  realizedPnL: number; // in IDR
  realizedPnLPercent: number; // percentage
  saleDate: number; // timestamp
  createdAt: number;
}

export interface AppState {
  accounts: Account[];
  stockLocations: StockLocation[];
  cryptoLocations: CryptoLocation[];
  transactions: Transaction[];
  dailyBalances: DailyBalance[];
  stocks: StockHolding[];
  cryptos: CryptoHolding[];
  stockSales: StockSale[];
  cryptoSales: CryptoSale[];
  assetPrices: AssetPrice[];
  lastUpdated: number;
}
