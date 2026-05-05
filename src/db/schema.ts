import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  integer,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth Tables (required by NextAuth DrizzleAdapter) ──────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  password: text("password"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ─── App Tables ─────────────────────────────────────────────────────────────

export const wealthAccounts = pgTable("wealth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // bank | deposit | cash
  currency: text("currency").notNull().default("IDR"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fromAccountId: uuid("from_account_id"),
  toAccountId: uuid("to_account_id"),
  amount: numeric("amount", { precision: 20, scale: 4 }).notNull(),
  description: text("description"),
  date: timestamp("date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const stockLocations = pgTable("stock_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const stockHoldings = pgTable("stock_holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  locationId: uuid("location_id")
    .notNull()
    .references(() => stockLocations.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
  averagePrice: numeric("average_price", { precision: 20, scale: 4 }).notNull(),
  purchaseDate: timestamp("purchase_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const stockSales = pgTable("stock_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stockId: uuid("stock_id").notNull(),
  ticker: text("ticker").notNull(),
  quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
  salePrice: numeric("sale_price", { precision: 20, scale: 4 }).notNull(),
  averageCostPrice: numeric("average_cost_price", { precision: 20, scale: 4 }).notNull(),
  realizedPnl: numeric("realized_pnl", { precision: 20, scale: 4 }).notNull(),
  realizedPnlPercent: numeric("realized_pnl_percent", { precision: 10, scale: 4 }).notNull(),
  saleDate: timestamp("sale_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const cryptoLocations = pgTable("crypto_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const cryptoHoldings = pgTable("crypto_holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  locationId: uuid("location_id")
    .notNull()
    .references(() => cryptoLocations.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 30, scale: 12 }).notNull(),
  averagePrice: numeric("average_price", { precision: 20, scale: 4 }).notNull(),
  purchaseDate: timestamp("purchase_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const assetPrices = pgTable("asset_prices", {
  ticker: text("ticker").primaryKey(),
  assetType: text("asset_type").notNull(), // stock | crypto
  name: text("name").notNull(),
  price: numeric("price", { precision: 20, scale: 4 }).notNull().default("0"),
  currency: text("currency").notNull().default("IDR"),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const cryptoSales = pgTable("crypto_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cryptoId: uuid("crypto_id").notNull(),
  symbol: text("symbol").notNull(),
  quantity: numeric("quantity", { precision: 30, scale: 12 }).notNull(),
  salePrice: numeric("sale_price", { precision: 20, scale: 4 }).notNull(),
  averageCostPrice: numeric("average_cost_price", { precision: 20, scale: 4 }).notNull(),
  realizedPnl: numeric("realized_pnl", { precision: 20, scale: 4 }).notNull(),
  realizedPnlPercent: numeric("realized_pnl_percent", { precision: 10, scale: 4 }).notNull(),
  saleDate: timestamp("sale_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const goldLocations = pgTable("gold_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const goldHoldings = pgTable("gold_holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  locationId: uuid("location_id")
    .notNull()
    .references(() => goldLocations.id, { onDelete: "cascade" }),
  weight: numeric("weight", { precision: 20, scale: 4 }).notNull(), // in grams
  purchasePrice: numeric("purchase_price", { precision: 20, scale: 4 }).notNull(), // IDR per gram
  purchaseDate: timestamp("purchase_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const goldSales = pgTable("gold_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goldId: uuid("gold_id").notNull(),
  weight: numeric("weight", { precision: 20, scale: 4 }).notNull(),
  salePrice: numeric("sale_price", { precision: 20, scale: 4 }).notNull(), // IDR per gram
  averageCostPrice: numeric("average_cost_price", { precision: 20, scale: 4 }).notNull(),
  realizedPnl: numeric("realized_pnl", { precision: 20, scale: 4 }).notNull(),
  realizedPnlPercent: numeric("realized_pnl_percent", { precision: 10, scale: 4 }).notNull(),
  saleDate: timestamp("sale_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const dailyBalances = pgTable("daily_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  totalBalance: numeric("total_balance", { precision: 20, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
