/**
 * Seed the demo account and a realistic-looking portfolio.
 *
 * Idempotent on the user row (matched by email). When the demo user already
 * exists, sample data is NOT re-inserted — run `pnpm seed:demo:reset --yes`
 * first (deletes the user; CASCADE wipes everything) and then `pnpm seed:demo`
 * again for a fresh seed.
 *
 * Usage:
 *   pnpm seed:demo
 */

import { config as loadEnv } from 'dotenv'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import {
  cryptoHoldings,
  cryptoLocations,
  cryptoSales,
  goldHoldings,
  goldLocations,
  goldSales,
  stockHoldings,
  stockLocations,
  stockSales,
  transactions,
  users,
  wealthAccounts,
} from '../../src/db/schema'

loadEnv({ path: '.env.local' })

const DEMO_EMAIL = 'demo@mailinator.com'
const DEMO_NAME = 'Demo User'
const DEMO_PASSWORD = 'demo1234'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  try {
    const [existing] = await db
      .select({ id: users.id, isDemo: users.isDemo })
      .from(users)
      .where(eq(users.email, DEMO_EMAIL))
      .limit(1)

    if (existing) {
      if (!existing.isDemo) {
        await db.update(users).set({ isDemo: true }).where(eq(users.id, existing.id))
      }
      console.log(`Demo user already exists (id=${existing.id}). Skipping sample data.`)
      console.log('Run `pnpm seed:demo:reset --yes` first if you want a fresh seed.')
      return
    }

    const hashed = await bcrypt.hash(DEMO_PASSWORD, 12)
    const [created] = await db
      .insert(users)
      .values({ name: DEMO_NAME, email: DEMO_EMAIL, password: hashed, isDemo: true })
      .returning({ id: users.id })
    const userId = created.id
    console.log(`Created demo user (id=${userId}).`)

    await db.transaction(async (tx) => {
      // ── Wealth accounts ────────────────────────────────────────────
      // Balances reflect the transactions inserted at the bottom:
      //   BCA      = +100M deposit + 20M transfer in            = 120M
      //   Sinarmas = +50M deposit - 20M transfer - 10M withdraw =  20M
      //   Alami    (deposito, no cash-flow)                     =  30M
      //   Dompet   (cash, no cash-flow)                         = 2.5M
      const [bca] = await tx
        .insert(wealthAccounts)
        .values({ userId, name: 'BCA', type: 'bank', currency: 'IDR', balance: '120000000' })
        .returning({ id: wealthAccounts.id })
      const [sinarmas] = await tx
        .insert(wealthAccounts)
        .values({ userId, name: 'Sinarmas', type: 'bank', currency: 'IDR', balance: '20000000' })
        .returning({ id: wealthAccounts.id })
      await tx
        .insert(wealthAccounts)
        .values({ userId, name: 'Alami', type: 'deposit', currency: 'IDR', balance: '30000000' })
      await tx
        .insert(wealthAccounts)
        .values({ userId, name: 'Dompet', type: 'cash', currency: 'IDR', balance: '2500000' })

      // ── Stock locations ────────────────────────────────────────────
      const [ajaib] = await tx
        .insert(stockLocations).values({ userId, name: 'Ajaib' })
        .returning({ id: stockLocations.id })
      const [nanovestStock] = await tx
        .insert(stockLocations).values({ userId, name: 'Nanovest' })
        .returning({ id: stockLocations.id })
      const [ajaibCrypto] = await tx
        .insert(stockLocations).values({ userId, name: 'Ajaib Crypto' })
        .returning({ id: stockLocations.id })

      // ── IDX stocks @ Ajaib ─────────────────────────────────────────
      // BBCA × 5 purchases (average down/up across 5 entry dates).
      const bbcaHoldings = await tx
        .insert(stockHoldings)
        .values([
          { userId, locationId: ajaib.id, ticker: 'BBCA', market: 'IDX', quantity: '100', averagePrice: '9500',  purchaseDate: new Date('2025-01-15') },
          { userId, locationId: ajaib.id, ticker: 'BBCA', market: 'IDX', quantity: '150', averagePrice: '9800',  purchaseDate: new Date('2025-02-10') },
          { userId, locationId: ajaib.id, ticker: 'BBCA', market: 'IDX', quantity: '200', averagePrice: '9700',  purchaseDate: new Date('2025-03-20') },
          { userId, locationId: ajaib.id, ticker: 'BBCA', market: 'IDX', quantity: '120', averagePrice: '10000', purchaseDate: new Date('2025-04-05') },
          { userId, locationId: ajaib.id, ticker: 'BBCA', market: 'IDX', quantity: '80',  averagePrice: '10200', purchaseDate: new Date('2025-05-12') },
        ])
        .returning({ id: stockHoldings.id })

      await tx.insert(stockHoldings).values({
        userId, locationId: ajaib.id, ticker: 'PTBA', market: 'IDX',
        quantity: '300', averagePrice: '2800', purchaseDate: new Date('2025-02-20'),
      })

      const [bbri] = await tx
        .insert(stockHoldings)
        .values({
          userId, locationId: ajaib.id, ticker: 'BBRI', market: 'IDX',
          quantity: '250', averagePrice: '4500', purchaseDate: new Date('2025-03-01'),
        })
        .returning({ id: stockHoldings.id })

      // ── US stocks @ Nanovest + Ajaib Crypto ────────────────────────
      // averagePrice is IDR per share (same convention as IDX & crypto):
      // the price updater converts Yahoo USD prices to IDR before storing,
      // so cost-basis must match. Rough USD/IDR ≈ 16,000 used for seed.
      //   AAPL ≈ $230 × 16,000 ≈ 3,680,000
      //   NVDA ≈ $130 × 16,000 ≈ 2,080,000  (post-2024 10:1 split)
      //   TSLA ≈ $280 × 16,000 ≈ 4,480,000
      await tx.insert(stockHoldings).values([
        { userId, locationId: nanovestStock.id, ticker: 'AAPL', market: 'US', quantity: '5', averagePrice: '3680000', purchaseDate: new Date('2025-01-20') },
        { userId, locationId: ajaibCrypto.id,   ticker: 'NVDA', market: 'US', quantity: '3', averagePrice: '2080000', purchaseDate: new Date('2025-02-15') },
        { userId, locationId: nanovestStock.id, ticker: 'TSLA', market: 'US', quantity: '2', averagePrice: '4480000', purchaseDate: new Date('2025-03-05') },
      ])

      // ── Crypto ─────────────────────────────────────────────────────
      const [binance] = await tx
        .insert(cryptoLocations).values({ userId, name: 'Binance' })
        .returning({ id: cryptoLocations.id })
      const [indodax] = await tx
        .insert(cryptoLocations).values({ userId, name: 'Indodax' })
        .returning({ id: cryptoLocations.id })

      // BTC × 2 purchases on different exchanges.
      const [btc1] = await tx
        .insert(cryptoHoldings)
        .values({
          userId, locationId: binance.id, symbol: 'BTC', name: 'Bitcoin',
          quantity: '0.05', averagePrice: '1500000000',
          purchaseDate: new Date('2025-01-25'),
        })
        .returning({ id: cryptoHoldings.id })
      await tx.insert(cryptoHoldings).values({
        userId, locationId: indodax.id, symbol: 'BTC', name: 'Bitcoin',
        quantity: '0.03', averagePrice: '1700000000',
        purchaseDate: new Date('2025-03-15'),
      })

      const [eth] = await tx
        .insert(cryptoHoldings)
        .values({
          userId, locationId: binance.id, symbol: 'ETH', name: 'Ethereum',
          quantity: '0.5', averagePrice: '55000000',
          purchaseDate: new Date('2025-02-12'),
        })
        .returning({ id: cryptoHoldings.id })

      await tx.insert(cryptoHoldings).values({
        userId, locationId: indodax.id, symbol: 'SOL', name: 'Solana',
        quantity: '10', averagePrice: '3200000',
        purchaseDate: new Date('2025-03-08'),
      })

      // ── Gold @ Nanovest + Pegadaian ────────────────────────────────
      const [nanovestGold] = await tx
        .insert(goldLocations).values({ userId, name: 'Nanovest' })
        .returning({ id: goldLocations.id })
      const [pegadaian] = await tx
        .insert(goldLocations).values({ userId, name: 'Pegadaian' })
        .returning({ id: goldLocations.id })

      const [gold1] = await tx
        .insert(goldHoldings)
        .values({
          userId, locationId: nanovestGold.id,
          weight: '5', purchasePrice: '1200000',
          purchaseDate: new Date('2025-01-30'),
        })
        .returning({ id: goldHoldings.id })

      const [gold2] = await tx
        .insert(goldHoldings)
        .values({
          userId, locationId: pegadaian.id,
          weight: '10', purchasePrice: '1180000',
          purchaseDate: new Date('2025-02-18'),
        })
        .returning({ id: goldHoldings.id })

      await tx.insert(goldHoldings).values({
        userId, locationId: nanovestGold.id,
        weight: '3', purchasePrice: '1250000',
        purchaseDate: new Date('2025-03-12'),
      })
      await tx.insert(goldHoldings).values({
        userId, locationId: pegadaian.id,
        weight: '7', purchasePrice: '1300000',
        purchaseDate: new Date('2025-04-22'),
      })

      // ── Sales ──────────────────────────────────────────────────────
      // Stock: BBCA partial (from oldest lot, FIFO-style) + BBRI partial.
      await tx.insert(stockSales).values([
        {
          userId,
          stockId: bbcaHoldings[0].id,
          ticker: 'BBCA',
          quantity: '100',
          salePrice: '10500',
          averageCostPrice: '9500',
          realizedPnl: '100000',
          realizedPnlPercent: '10.5263',
          saleDate: new Date('2025-06-15'),
        },
        {
          userId,
          stockId: bbri.id,
          ticker: 'BBRI',
          quantity: '100',
          salePrice: '4800',
          averageCostPrice: '4500',
          realizedPnl: '30000',
          realizedPnlPercent: '6.6667',
          saleDate: new Date('2025-07-10'),
        },
      ])

      // Crypto: BTC partial + ETH partial.
      await tx.insert(cryptoSales).values([
        {
          userId,
          cryptoId: btc1.id,
          symbol: 'BTC',
          quantity: '0.01',
          salePrice: '1800000000',
          averageCostPrice: '1500000000',
          realizedPnl: '3000000',
          realizedPnlPercent: '20',
          saleDate: new Date('2025-08-05'),
        },
        {
          userId,
          cryptoId: eth.id,
          symbol: 'ETH',
          quantity: '0.1',
          salePrice: '60000000',
          averageCostPrice: '55000000',
          realizedPnl: '500000',
          realizedPnlPercent: '9.0909',
          saleDate: new Date('2025-08-20'),
        },
      ])

      // Gold: 2g of Nanovest lot + 3g of Pegadaian lot.
      await tx.insert(goldSales).values([
        {
          userId,
          goldId: gold1.id,
          weight: '2',
          salePrice: '1350000',
          averageCostPrice: '1200000',
          realizedPnl: '300000',
          realizedPnlPercent: '12.5',
          saleDate: new Date('2025-09-15'),
        },
        {
          userId,
          goldId: gold2.id,
          weight: '3',
          salePrice: '1400000',
          averageCostPrice: '1180000',
          realizedPnl: '660000',
          realizedPnlPercent: '18.6441',
          saleDate: new Date('2025-10-22'),
        },
      ])

      // ── Transactions ───────────────────────────────────────────────
      await tx.insert(transactions).values([
        {
          userId,
          fromAccountId: null,
          toAccountId: bca.id,
          amount: '100000000',
          description: 'Setor awal ke BCA',
          date: new Date('2025-01-01'),
        },
        {
          userId,
          fromAccountId: null,
          toAccountId: sinarmas.id,
          amount: '50000000',
          description: 'Setor awal ke Sinarmas',
          date: new Date('2025-01-05'),
        },
        {
          userId,
          fromAccountId: sinarmas.id,
          toAccountId: bca.id,
          amount: '20000000',
          description: 'Pindah dana ke BCA',
          date: new Date('2025-02-01'),
        },
        {
          userId,
          fromAccountId: sinarmas.id,
          toAccountId: null,
          amount: '10000000',
          description: 'Penarikan tunai',
          date: new Date('2025-03-15'),
        },
      ])
    })

    console.log('Seeded demo portfolio:')
    console.log('  • Accounts: BCA, Sinarmas (bank), Alami (deposit), Dompet (cash)')
    console.log('  • IDX stocks @ Ajaib: BBCA ×5, PTBA, BBRI')
    console.log('  • US stocks: AAPL/TSLA @ Nanovest, NVDA @ Ajaib Crypto')
    console.log('  • Crypto: BTC ×2 (Binance + Indodax), ETH @ Binance, SOL @ Indodax')
    console.log('  • Gold: 2× Nanovest, 2× Pegadaian')
    console.log('  • Sales: 2 stock, 2 crypto, 2 gold')
    console.log('  • Transactions: 2 deposits, 1 transfer, 1 withdrawal')
    console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
