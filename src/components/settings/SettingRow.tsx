'use client'

import { useState } from 'react'
import { Pencil, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ConfirmDialog from '@/components/ConfirmDialog'
import {
  AppSettingRow,
  useDeleteSetting,
  useUpsertSetting,
} from '@/lib/queries/settings'

export default function SettingRow({ row }: { row: AppSettingRow }) {
  const t = useTranslations('settings')
  const upsert = useUpsertSetting()
  const remove = useDeleteSetting()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(row.value)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        key: row.key,
        value: draft,
        description: row.description ?? undefined,
      })
      setEditing(false)
      toast.success(t('saved'))
    } catch (err) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  const handleCancel = () => {
    setDraft(row.value)
    setEditing(false)
  }

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(row.key)
      setConfirmOpen(false)
      toast.success(t('deleted'))
    } catch (err) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  const shortKey = row.key.includes('.') ? row.key.split('.').slice(1).join('.') : row.key

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium text-foreground break-all">
            {shortKey}
          </p>
          {row.description && (
            <p className="text-xs text-muted-foreground mt-1">{row.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {editing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={upsert.isPending}
                aria-label={t('save')}
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={upsert.isPending}
                aria-label={t('cancel')}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label={t('edit')}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmOpen(true)}
                aria-label={t('delete')}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('emptyValue')}
          className="font-mono text-sm"
          autoFocus
        />
      ) : (
        <p className="font-mono text-sm text-muted-foreground break-all">
          {row.value || <span className="italic">{t('emptyValue')}</span>}
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('deleteTitle')}
        description={t('deleteDescription', { key: row.key })}
        destructive
        isLoading={remove.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
