/**
 * Reset the demo account by deleting the user row. All related rows are
 * removed automatically via `ON DELETE CASCADE` on every user-owned table.
 *
 * Default run = dry-run: prints what would be deleted, no DB writes.
 * Pass `--yes` to actually execute (single DELETE on users).
 *
 * Usage:
 *   pnpm seed:demo:reset         # dry-run, no DB writes
 *   pnpm seed:demo:reset --yes   # really wipe demo account (user + data)
 *
 * After a real reset, `pnpm seed:demo` will re-create the user and sample
 * data from scratch — the seed script is only idempotent on the user row,
 * so the user has to be gone for a fresh seed to take effect.
 */

import { config as loadEnv } from 'dotenv'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq, sql } from 'drizzle-orm'
import {
  accountBalanceSnapshots,
  cryptoHoldings,
  cryptoLocations,
  cryptoSales,
  goldHoldings,
  goldLocations,
  goldSales,
  portfolioValueSnapshots,
  stockHoldings,
  stockLocations,
  stockSales,
  transactions,
  users,
  wealthAccounts,
} from '../../src/db/schema'

loadEnv({ path: '.env.local' })

const DEMO_EMAIL = 'demo@mailinator.com'

// Tables previewed in the dry-run output. Order is purely cosmetic;
// the actual delete is a single `DELETE FROM users` that cascades.
const PREVIEW_TABLES = [
  { name: 'account_balance_snapshots', table: accountBalanceSnapshots },
  { name: 'portfolio_value_snapshots', table: portfolioValueSnapshots },
  { name: 'stock_sales', table: stockSales },
  { name: 'crypto_sales', table: cryptoSales },
  { name: 'gold_sales', table: goldSales },
  { name: 'transactions', table: transactions },
  { name: 'stock_holdings', table: stockHoldings },
  { name: 'stock_locations', table: stockLocations },
  { name: 'crypto_holdings', table: cryptoHoldings },
  { name: 'crypto_locations', table: cryptoLocations },
  { name: 'gold_holdings', table: goldHoldings },
  { name: 'gold_locations', table: goldLocations },
  { name: 'wealth_accounts', table: wealthAccounts },
] as const

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  const args = new Set(process.argv.slice(2))
  const apply = args.has('--yes')

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  try {
    const [demo] = await db
      .select({ id: users.id, isDemo: users.isDemo })
      .from(users)
      .where(eq(users.email, DEMO_EMAIL))
      .limit(1)

    if (!demo) {
      console.log(`No demo user found (email=${DEMO_EMAIL}). Nothing to do.`)
      return
    }

    if (!demo.isDemo) {
      console.error(
        `Refusing to wipe: user ${DEMO_EMAIL} exists but is_demo=false. ` +
          `This safety check prevents accidentally deleting a non-demo account ` +
          `that happens to share the email.`,
      )
      process.exit(1)
    }

    console.log(`Demo user: ${DEMO_EMAIL} (id=${demo.id})`)
    console.log(apply ? 'Mode: APPLY (user + cascade will be deleted)' : 'Mode: DRY-RUN (no writes — pass --yes to apply)')
    console.log('')

    const counts: Array<{ name: string; count: number }> = []
    for (const { name, table } of PREVIEW_TABLES) {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(table)
        .where(eq((table as typeof wealthAccounts).userId, demo.id))
      counts.push({ name, count: row?.count ?? 0 })
    }

    const width = Math.max(...counts.map((c) => c.name.length), 'users (cascade root)'.length)
    const total = counts.reduce((acc, c) => acc + c.count, 0)
    for (const c of counts) {
      console.log(`  ${c.name.padEnd(width)}  ${String(c.count).padStart(6)}`)
    }
    console.log(`  ${'users (cascade root)'.padEnd(width)}  ${String(1).padStart(6)}`)
    console.log(`  ${'TOTAL ROWS'.padEnd(width)}  ${String(total + 1).padStart(6)}`)
    console.log('')

    if (!apply) {
      console.log('Dry-run complete. Re-run with `--yes` to actually delete.')
      return
    }

    const result = await db.delete(users).where(eq(users.id, demo.id))
    const deleted = (result as { rowCount?: number | null }).rowCount ?? 0
    console.log(`Deleted ${deleted} user row. CASCADE removed ${total} related rows.`)
    console.log('You can now run `pnpm seed:demo` for a fresh seed.')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
