'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import SettingsList from '@/components/settings/SettingsList'
import SettingsSkeleton from '@/components/settings/SettingsSkeleton'
import AddSettingDialog from '@/components/settings/AddSettingDialog'
import { settingsQueryOptions, useSettingsQuery } from '@/lib/queries/settings'

export default function SettingsPageClient() {
  const t = useTranslations('settings')
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(settingsQueryOptions())
  }, [qc])

  const { data: rows = [], isLoading } = useSettingsQuery()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('addConfig')}
          </Button>
        </div>

        {isLoading ? <SettingsSkeleton /> : <SettingsList rows={rows} />}

        <AddSettingDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>
    </DashboardLayout>
  )
}
