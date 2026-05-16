'use client'

import { AppSettingRow } from '@/lib/queries/settings'
import SettingsEmpty from './SettingsEmpty'
import SettingsGroup from './SettingsGroup'

export default function SettingsList({ rows }: { rows: AppSettingRow[] }) {
  if (rows.length === 0) {
    return <SettingsEmpty message="No settings yet. Click ‘Add config’ to create one." />
  }

  const groups = new Map<string, AppSettingRow[]>()
  for (const row of rows) {
    const prefix = row.key.includes('.') ? row.key.split('.')[0] : '(other)'
    const list = groups.get(prefix) ?? []
    list.push(row)
    groups.set(prefix, list)
  }

  const sortedPrefixes = Array.from(groups.keys()).sort()

  return (
    <div className="space-y-6">
      {sortedPrefixes.map((prefix) => (
        <SettingsGroup key={prefix} prefix={prefix} rows={groups.get(prefix)!} />
      ))}
    </div>
  )
}
