import { NextRequest, NextResponse } from 'next/server'
import { inArray } from 'drizzle-orm'
import { requireOwner } from '@/lib/auth'
import { db } from '@/db'
import { wealthAccounts } from '@/db/schema'
import { appDateStr } from '@/lib/snapshot'
import { getSyncConfig, SettingsError } from '@/lib/settings'
import { readSheetRange, SheetsAccessError, SheetsConfigError } from '@/lib/sync/sheets-client'
import { pickLatestNonZeroSaldoAkhir } from '@/lib/sync/parse-saldo'
import { computeDiff, DiffResult } from '@/lib/sync/diff'

// Saldo Akhir is the 4th of 5 columns (Month, Kredit, Debit, Saldo Akhir, Sisa).
const SALDO_COL_INDEX = 3

interface BankDiff extends DiffResult {
  sheetMonth: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner()
    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const yearInput = Number(body?.year)
    const year = Number.isFinite(yearInput) && yearInput > 0
      ? Math.trunc(yearInput)
      : Number.parseInt(appDateStr(new Date()).slice(0, 4), 10)

    const config = await getSyncConfig(userId, year)

    const [sinarmasRows, bcaRows] = await Promise.all([
      readSheetRange(config.sheetId, config.sinarmas.range),
      readSheetRange(config.sheetId, config.bca.range),
    ])

    const sinarmasPick = pickLatestNonZeroSaldoAkhir(sinarmasRows, SALDO_COL_INDEX)
    const bcaPick = pickLatestNonZeroSaldoAkhir(bcaRows, SALDO_COL_INDEX)

    const accountIds = [config.sinarmas.accountId, config.bca.accountId]
    const accountRows = await db
      .select({
        id: wealthAccounts.id,
        name: wealthAccounts.name,
        balance: wealthAccounts.balance,
        userId: wealthAccounts.userId,
      })
      .from(wealthAccounts)
      .where(inArray(wealthAccounts.id, accountIds))

    const byId = new Map(accountRows.map((r) => [r.id, r]))

    const sinarmasAccount = byId.get(config.sinarmas.accountId)
    const bcaAccount = byId.get(config.bca.accountId)
    if (!sinarmasAccount || sinarmasAccount.userId !== userId) {
      return NextResponse.json(
        { error: 'Configured Sinarmas account not found' },
        { status: 422 },
      )
    }
    if (!bcaAccount || bcaAccount.userId !== userId) {
      return NextResponse.json(
        { error: 'Configured BCA account not found' },
        { status: 422 },
      )
    }

    const diffs: BankDiff[] = []
    if (sinarmasPick) {
      diffs.push({
        ...computeDiff({
          accountId: sinarmasAccount.id,
          accountName: sinarmasAccount.name,
          dbBalance: Number(sinarmasAccount.balance),
          sheetBalance: sinarmasPick.saldoAkhir,
        }),
        sheetMonth: sinarmasPick.monthLabel,
      })
    }
    if (bcaPick) {
      diffs.push({
        ...computeDiff({
          accountId: bcaAccount.id,
          accountName: bcaAccount.name,
          dbBalance: Number(bcaAccount.balance),
          sheetBalance: bcaPick.saldoAkhir,
        }),
        sheetMonth: bcaPick.monthLabel,
      })
    }

    const warnings: string[] = []
    if (!sinarmasPick) warnings.push(`No non-zero Saldo Akhir found for Sinarmas (${config.sinarmas.range})`)
    if (!bcaPick) warnings.push(`No non-zero Saldo Akhir found for BCA (${config.bca.range})`)

    return NextResponse.json({
      year,
      asOf: appDateStr(new Date()),
      diffs,
      warnings,
    })
  } catch (err) {
    if (err instanceof Response) return err
    if (err instanceof SettingsError) {
      return NextResponse.json(
        { error: err.message, missing: err.missing },
        { status: 412 },
      )
    }
    if (err instanceof SheetsConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
    if (err instanceof SheetsAccessError) {
      return NextResponse.json(
        { error: err.message, sheetId: err.sheetId, serviceAccountEmail: err.serviceAccountEmail },
        { status: 502 },
      )
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

