'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpsertSetting } from '@/lib/queries/settings'

interface AddSettingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddSettingDialog({ open, onOpenChange }: AddSettingDialogProps) {
  const t = useTranslations('settings')
  const upsert = useUpsertSetting()
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')

  const reset = () => {
    setKey('')
    setValue('')
    setDescription('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedKey = key.trim()
    if (!trimmedKey) {
      toast.error(t('keyRequired'))
      return
    }
    try {
      await upsert.mutateAsync({
        key: trimmedKey,
        value,
        description: description.trim() || undefined,
      })
      toast.success(t('added'))
      reset()
      onOpenChange(false)
    } catch (err) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t.rich('addDialogDescription', {
              example: () => <span className="font-mono">sync.2027.sheetId</span>,
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setting-key">{t('keyLabel')}</Label>
            <Input
              id="setting-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t('keyPlaceholder')}
              autoFocus
              required
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setting-value">{t('valueLabel')}</Label>
            <Input
              id="setting-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('emptyValue')}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setting-description">{t('descriptionLabel')}</Label>
            <Input
              id="setting-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={upsert.isPending}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
