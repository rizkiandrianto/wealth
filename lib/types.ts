export type AccountType = 'bank' | 'deposit' | 'cash';

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

export interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  dailyBalances: DailyBalance[];
  lastUpdated: number;
}
