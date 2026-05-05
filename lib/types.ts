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

export interface StockHolding {
  id: string;
  ticker: string;
  name: string;
  locationId: string; // reference to StockLocation.id
  quantity: number;
  averagePrice: number; // in IDR
  currentPrice: number; // in IDR (will be fetched from API later)
  purchaseDate: number; // timestamp
  createdAt: number;
}

export interface AppState {
  accounts: Account[];
  stockLocations: StockLocation[];
  transactions: Transaction[];
  dailyBalances: DailyBalance[];
  stocks: StockHolding[];
  lastUpdated: number;
}
