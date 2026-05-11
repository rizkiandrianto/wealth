/**
 * Import historical balance snapshots from a CSV (typically exported from
 * Google Sheets). CSV format:
 *
 *   Date,Sinarmas,BTN,CIMB,BCA,...
 *   05/09/2023,15335000,6000000,10000000,42000000,...
 *
 * - Date column is DD/MM/YYYY.
 * - Numeric cells may use Indonesian decimal comma. Values wrapped in double
 *   quotes (e.g. `"57331622,6"`) preserve the embedded comma; the parser
 *   strips the quotes and converts the decimal comma to a period.
 *
 * Usage:
 *   pnpm tsx scripts/import-snapshots.ts seed/historical_snapshots.csv [user-email]
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { and, eq } from 'drizzle-orm'
import { accountBalanceSnapshots, users, wealthAccounts } from '../src/db/schema'

loadEnv({ path: '.env.local' })

const DEFAULT_EMAIL = 'rizki_andrianto@rocketmail.com'

function parseDateDMY(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function parseNumber(s: string): number | null {
  const cleaned = s.trim().replace(/\s/g, '').replace(',', '.')
  if (cleaned === '' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let buf = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          buf += '"'
          i++
        } else {
          inQuote = false
        }
      } else {
        buf += ch
      }
    } else {
      if (ch === ',') {
        out.push(buf)
        buf = ''
      } else if (ch === '"' && buf === '') {
        inQuote = true
      } else {
        buf += ch
      }
    }
  }
  out.push(buf)
  return out
}

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: pnpm tsx scripts/import-snapshots.ts <path/to/csv> [user-email]')
    process.exit(1)
  }
  const email = process.argv[3] ?? DEFAULT_EMAIL

  const absPath = resolve(csvPath)
  const raw = readFileSync(absPath, 'utf8')
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) {
    console.error('CSV has no data rows.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const db = drizzle(pool, { schema: { accountBalanceSnapshots, users, wealthAccounts } })

  try {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
    if (!user) {
      console.error(`User not found for email: ${email}`)
      process.exit(1)
    }

    const accounts = await db
      .select({ id: wealthAccounts.id, name: wealthAccounts.name })
      .from(wealthAccounts)
      .where(eq(wealthAccounts.userId, user.id))
    const accountByName = new Map(accounts.map((a) => [a.name, a.id]))

    const header = splitCsvLine(lines[0]).map((s) => s.trim())
    const dateIdx = header.findIndex((h) => h.toLowerCase().includes('date'))
    if (dateIdx === -1) {
      console.error('CSV header must contain a "Date" column.')
      process.exit(1)
    }

    const unknownCols: string[] = []
    const colAccountId: Array<string | null> = header.map((h, i) => {
      if (i === dateIdx) return null
      const id = accountByName.get(h)
      if (!id) unknownCols.push(h)
      return id ?? null
    })
    if (unknownCols.length > 0) {
      console.warn(`[warn] Unmatched columns (skipped): ${unknownCols.join(', ')}`)
    }

    let inserted = 0
    let skipped = 0
    for (let i = 1; i < lines.length; i++) {
      const cells = splitCsvLine(lines[i])
      const dateStr = parseDateDMY(cells[dateIdx] ?? '')
      if (!dateStr) {
        console.warn(`[warn] Row ${i + 1}: bad date "${cells[dateIdx]}", skipping`)
        skipped++
        continue
      }
      for (let c = 0; c < cells.length; c++) {
        const accountId = colAccountId[c]
        if (!accountId) continue
        const balance = parseNumber(cells[c] ?? '')
        if (balance == null) continue
        await db
          .insert(accountBalanceSnapshots)
          .values({ userId: user.id, accountId, date: dateStr, balance: String(balance) })
          .onConflictDoUpdate({
            target: [
              accountBalanceSnapshots.userId,
              accountBalanceSnapshots.accountId,
              accountBalanceSnapshots.date,
            ],
            set: { balance: String(balance), updatedAt: new Date() },
          })
        inserted++
      }
    }

    console.log(`Done. Upserted ${inserted} snapshot rows across ${lines.length - 1} dates.`)
    if (skipped > 0) console.log(`Skipped ${skipped} rows due to invalid date.`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
