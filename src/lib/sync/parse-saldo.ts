/**
 * Parse an Indonesian-formatted currency cell into a plain number.
 *
 * Examples: "Rp 62.941.035" → 62941035, "Rp 12.500,50" → 12500.5,
 * "1,234,567.89" → 1234567.89, "12.5" → 12.5, "1.234" → 1234.
 *
 * Returns null when the cell is empty/non-numeric (used by callers to skip
 * blank rows). Returns 0 for "0" / "Rp 0".
 */
export function parseRupiah(input: string | number | null | undefined): number | null {
  if (input == null) return null
  if (typeof input === 'number') return Number.isFinite(input) ? input : null

  let s = input.trim()
  if (!s || s === '-') return null

  // Drop surrounding quotes (sheets sometimes emit "Rp.62.941.035").
  s = s.replace(/^["']|["']$/g, '').trim()
  // Strip currency prefix; remove "Rp"/"Rp." first so we don't eat a real dot.
  s = s.replace(/^Rp\.?\s*/i, '')
  // Remove remaining whitespace including NBSP.
  s = s.replace(/\s+/g, '')

  if (!s) return null

  const isNegative = s.startsWith('-') || (s.startsWith('(') && s.endsWith(')'))
  s = s.replace(/^-/, '').replace(/^\(|\)$/g, '')

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  let normalized: string

  if (!hasComma && !hasDot) {
    normalized = s
  } else if (hasComma && hasDot) {
    // Both present → rightmost is the decimal marker.
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma > lastDot) {
      normalized = s.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    // Comma-only → treat as the decimal marker (rare in Sheets, but covers "12,50").
    // Multiple commas would be thousands separators ("12,500,000").
    const commaCount = (s.match(/,/g) ?? []).length
    if (commaCount > 1) {
      normalized = s.replace(/,/g, '')
    } else {
      const [, tail = ''] = s.split(',')
      normalized = tail.length === 3 ? s.replace(',', '') : s.replace(',', '.')
    }
  } else {
    // Dot-only. Multiple dots ⇒ thousands. One dot ⇒ thousands when the tail
    // is exactly 3 digits (e.g. "1.234"); otherwise decimal (e.g. "12.5").
    const dotCount = (s.match(/\./g) ?? []).length
    if (dotCount > 1) {
      normalized = s.replace(/\./g, '')
    } else {
      const [, tail = ''] = s.split('.')
      normalized = tail.length === 3 ? s.replace('.', '') : s
    }
  }

  if (!/^[0-9.]+$/.test(normalized)) return null
  const n = Number(normalized)
  if (!Number.isFinite(n)) return null
  return isNegative ? -n : n
}

export interface SaldoPick {
  rowIndex: number
  monthLabel: string
  saldoAkhir: number
}

/**
 * Walk rows bottom-up and return the latest row whose saldo column is a
 * non-zero number. Empty / non-numeric / zero rows are skipped. Returns null
 * if every row is empty or zero.
 *
 * `rows` is the raw range value as returned by Google Sheets (string[][]).
 * `saldoColIndex` is the 0-based column index of the "Saldo Akhir" column
 * within each row. The Month label is read from column 0.
 */
export function pickLatestNonZeroSaldoAkhir(
  rows: string[][],
  saldoColIndex: number,
): SaldoPick | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]
    if (!row || row.length <= saldoColIndex) continue
    const value = parseRupiah(row[saldoColIndex])
    if (value == null || value === 0) continue
    const monthLabel = String(row[0] ?? '').trim()
    return { rowIndex: i, monthLabel, saldoAkhir: value }
  }
  return null
}
