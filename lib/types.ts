export type AccountType = 'bank' | 'deposit' | 'cash';
export type StockLocation = 'nanovest' | 'ajaib' | 'crypto';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
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

export interface StockHolding {
  id: string;
  ticker: string;
  name: string;
  location: StockLocation;
  quantity: number;
  averagePrice: number; // in IDR
  currentPrice: number; // in IDR
  purchaseDate: number; // timestamp
  createdAt: number;
}

export interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  dailyBalances: DailyBalance[];
  stocks: StockHolding[];
  lastUpdated: number;
}
