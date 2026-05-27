import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseRupiah, pickLatestNonZeroSaldoAkhir } from './parse-saldo'

describe('parseRupiah', () => {
  it('parses plain integers', () => {
    assert.equal(parseRupiah('62941035'), 62941035)
    assert.equal(parseRupiah('0'), 0)
  })

  it('strips "Rp" / "Rp." prefix and whitespace', () => {
    assert.equal(parseRupiah('Rp 62.941.035'), 62941035)
    assert.equal(parseRupiah('Rp.62.941.035'), 62941035)
    assert.equal(parseRupiah('  Rp.  10.871.618 '), 10871618)
  })

  it('treats "," as decimal when it is the rightmost separator', () => {
    assert.equal(parseRupiah('1.234.567,89'), 1234567.89)
    assert.equal(parseRupiah('Rp 12.500,50'), 12500.5)
  })

  it('treats "." as decimal when "," are thousands', () => {
    assert.equal(parseRupiah('1,234,567.89'), 1234567.89)
  })

  it('handles surrounding quotes from sheet exports', () => {
    assert.equal(parseRupiah('"Rp.62.941.035"'), 62941035)
  })

  it('returns null for blank or dash cells', () => {
    assert.equal(parseRupiah(''), null)
    assert.equal(parseRupiah('   '), null)
    assert.equal(parseRupiah('-'), null)
    assert.equal(parseRupiah(null), null)
    assert.equal(parseRupiah(undefined), null)
  })

  it('returns null for non-numeric garbage', () => {
    assert.equal(parseRupiah('abc'), null)
  })

  it('passes through finite numbers', () => {
    assert.equal(parseRupiah(42), 42)
    assert.equal(parseRupiah(0), 0)
    assert.equal(parseRupiah(Number.NaN), null)
  })

  it('handles negative values', () => {
    assert.equal(parseRupiah('-1.234.567'), -1234567)
    assert.equal(parseRupiah('(1.234)'), -1234)
  })
})

describe('pickLatestNonZeroSaldoAkhir', () => {
  // Mirror of the screenshot in plan/sync-balance.md: 5-column range
  // [Month, Kredit, Debit, Saldo Akhir, Sisa]. Saldo Akhir is col index 3.
  const SALDO_COL = 3

  it('returns the latest non-zero row scanning bottom-up', () => {
    const rows: string[][] = [
      ['Jan', '10.000.000', '0', '50.000.000', ''],
      ['Feb', '5.000.000', '1.000.000', '54.000.000', ''],
      ['Mar', '0', '0', '54.000.000', ''],
      ['Apr', '0', '0', '0', ''],
      ['Mei', '0', '0', '0', ''],
    ]
    const pick = pickLatestNonZeroSaldoAkhir(rows, SALDO_COL)
    assert.deepEqual(pick, { rowIndex: 2, monthLabel: 'Mar', saldoAkhir: 54000000 })
  })

  it('skips zero and empty saldo rows', () => {
    const rows: string[][] = [
      ['Jan', '', '', 'Rp 10.000.000', ''],
      ['Feb', '', '', '', ''],
      ['Mar', '', '', '0', ''],
    ]
    const pick = pickLatestNonZeroSaldoAkhir(rows, SALDO_COL)
    assert.deepEqual(pick, { rowIndex: 0, monthLabel: 'Jan', saldoAkhir: 10000000 })
  })

  it('returns null when every row is empty / zero', () => {
    const rows: string[][] = [
      ['Jan', '', '', '0', ''],
      ['Feb', '', '', '', ''],
    ]
    assert.equal(pickLatestNonZeroSaldoAkhir(rows, SALDO_COL), null)
  })

  it('handles comma-decimal Saldo Akhir values', () => {
    const rows: string[][] = [
      ['Mei', '', '', 'Rp 62.941.035,50', ''],
    ]
    const pick = pickLatestNonZeroSaldoAkhir(rows, SALDO_COL)
    assert.deepEqual(pick, { rowIndex: 0, monthLabel: 'Mei', saldoAkhir: 62941035.5 })
  })

  it('handles quote-wrapped saldo cells', () => {
    const rows: string[][] = [
      ['Mei', '', '', '"Rp.10.871.618"', ''],
    ]
    const pick = pickLatestNonZeroSaldoAkhir(rows, SALDO_COL)
    assert.deepEqual(pick, { rowIndex: 0, monthLabel: 'Mei', saldoAkhir: 10871618 })
  })

  it('returns null for shorter rows than saldoColIndex', () => {
    const rows: string[][] = [['Jan', '0']]
    assert.equal(pickLatestNonZeroSaldoAkhir(rows, SALDO_COL), null)
  })
})
