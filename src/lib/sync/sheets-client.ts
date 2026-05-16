import { google } from 'googleapis'

const SHEETS_READONLY_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'

export class SheetsConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SheetsConfigError'
  }
}

export class SheetsAccessError extends Error {
  readonly sheetId: string
  readonly serviceAccountEmail?: string
  constructor(message: string, sheetId: string, serviceAccountEmail?: string) {
    super(message)
    this.name = 'SheetsAccessError'
    this.sheetId = sheetId
    this.serviceAccountEmail = serviceAccountEmail
  }
}

interface ServiceAccountKey {
  client_email: string
  private_key: string
}

let cachedKey: ServiceAccountKey | null = null

function loadServiceAccountKey(): ServiceAccountKey {
  if (cachedKey) return cachedKey

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new SheetsConfigError(
      'GOOGLE_SERVICE_ACCOUNT_JSON env var is missing. See plan/sync-balance.md → Env section.',
    )
  }

  let jsonText: string
  try {
    jsonText = Buffer.from(raw, 'base64').toString('utf8')
  } catch {
    throw new SheetsConfigError('GOOGLE_SERVICE_ACCOUNT_JSON is not valid base64.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new SheetsConfigError(
      'GOOGLE_SERVICE_ACCOUNT_JSON does not decode to JSON. Check that you base64-encoded the entire file contents.',
    )
  }

  const obj = parsed as Partial<ServiceAccountKey>
  if (typeof obj.client_email !== 'string' || typeof obj.private_key !== 'string') {
    throw new SheetsConfigError(
      'Service account JSON missing client_email or private_key.',
    )
  }

  cachedKey = { client_email: obj.client_email, private_key: obj.private_key }
  return cachedKey
}

function getJwtClient() {
  const key = loadServiceAccountKey()
  return new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [SHEETS_READONLY_SCOPE],
  })
}

export async function readSheetRange(
  sheetId: string,
  range: string,
): Promise<string[][]> {
  const auth = getJwtClient()
  const sheets = google.sheets({ version: 'v4', auth })
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
    })
    const values = res.data.values ?? []
    // Coerce each cell to string so callers can do uniform parsing; numeric
    // cells come back as `number` under UNFORMATTED_VALUE.
    return values.map((row) => row.map((cell) => (cell == null ? '' : String(cell))))
  } catch (err) {
    const status = (err as { code?: number; status?: number }).code
      ?? (err as { code?: number; status?: number }).status
    if (status === 403 || status === 404) {
      const email = cachedKey?.client_email
      throw new SheetsAccessError(
        `Cannot read sheet ${sheetId}. ` +
          (email
            ? `Share the sheet with ${email} as Viewer.`
            : 'Service account may not have access.'),
        sheetId,
        email,
      )
    }
    throw err
  }
}
