import { and, eq, inArray, like } from 'drizzle-orm'
import { db } from '@/db'
import { appSettings } from '@/db/schema'

export type AppSetting = typeof appSettings.$inferSelect

export async function getSetting(userId: string, key: string): Promise<string | null> {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(and(eq(appSettings.userId, userId), eq(appSettings.key, key)))
    .limit(1)
  return row?.value ?? null
}

export async function getSettings(
  userId: string,
  keys: string[]
): Promise<Record<string, string>> {
  if (keys.length === 0) return {}
  const rows = await db
    .select({ key: appSettings.key, value: appSettings.value })
    .from(appSettings)
    .where(and(eq(appSettings.userId, userId), inArray(appSettings.key, keys)))
  const out: Record<string, string> = {}
  for (const r of rows) out[r.key] = r.value
  return out
}

export async function listSettings(userId: string, prefix?: string): Promise<AppSetting[]> {
  const conds = [eq(appSettings.userId, userId)]
  if (prefix) conds.push(like(appSettings.key, `${prefix}%`))
  return db
    .select()
    .from(appSettings)
    .where(and(...conds))
    .orderBy(appSettings.key)
}

export async function upsertSetting(
  userId: string,
  key: string,
  value: string,
  description?: string
): Promise<void> {
  await db
    .insert(appSettings)
    .values({ userId, key, value, description: description ?? null })
    .onConflictDoUpdate({
      target: [appSettings.userId, appSettings.key],
      set: {
        value,
        ...(description !== undefined ? { description } : {}),
        updatedAt: new Date(),
      },
    })
}

export async function deleteSetting(userId: string, key: string): Promise<void> {
  await db
    .delete(appSettings)
    .where(and(eq(appSettings.userId, userId), eq(appSettings.key, key)))
}

// ── Convenience: sync feature config ───────────────────────────────────────

export class SettingsError extends Error {
  constructor(message: string, readonly missing: string[]) {
    super(message)
    this.name = 'SettingsError'
  }
}

export interface SyncConfig {
  year: number
  sheetId: string
  sinarmas: { range: string; accountId: string }
  bca: { range: string; accountId: string }
}

export async function getSyncConfig(userId: string, year: number): Promise<SyncConfig> {
  const keys = [
    `sync.${year}.sheetId`,
    `sync.${year}.sinarmas.range`,
    `sync.${year}.sinarmas.accountId`,
    `sync.${year}.bca.range`,
    `sync.${year}.bca.accountId`,
  ]
  const map = await getSettings(userId, keys)
  const missing = keys.filter((k) => !map[k]?.trim())
  if (missing.length > 0) {
    throw new SettingsError(`Missing sync config: ${missing.join(', ')}`, missing)
  }
  return {
    year,
    sheetId: map[`sync.${year}.sheetId`]!,
    sinarmas: {
      range: map[`sync.${year}.sinarmas.range`]!,
      accountId: map[`sync.${year}.sinarmas.accountId`]!,
    },
    bca: {
      range: map[`sync.${year}.bca.range`]!,
      accountId: map[`sync.${year}.bca.accountId`]!,
    },
  }
}

// Boolean-coercing helper for flags stored as "true"/"false"/empty strings.
// Empty / null / unparseable → defaultValue.
export function parseBool(value: string | null | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue
  const v = value.trim().toLowerCase()
  if (v === '') return defaultValue
  if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true
  if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false
  return defaultValue
}

