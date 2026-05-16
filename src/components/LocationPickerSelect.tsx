'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Location {
  id: string
  name: string
}

interface LocationPickerSelectProps {
  locations: Location[]
  value: string
  onChange: (id: string) => void
  onAddLocation: (name: string) => Promise<string> | string
}

export default function LocationPickerSelect({
  locations,
  value,
  onChange,
  onAddLocation,
}: LocationPickerSelectProps) {
  const t = useTranslations('locationPicker')
  const tCommon = useTranslations('common')
  const [selectOpen, setSelectOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const handleSave = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const newId = await onAddLocation(trimmed)
    onChange(newId)
    setNewName('')
    setDialogOpen(false)
  }

  return (
    <>
      <Select open={selectOpen} onOpenChange={setSelectOpen} value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc.id} value={loc.id}>
              {loc.name}
            </SelectItem>
          ))}
          <hr className="my-1 border-border" />
          <button
            type="button"
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-blue-600 outline-none hover:bg-accent hover:text-blue-700"
            onClick={() => {
              setSelectOpen(false)
              setDialogOpen(true)
            }}
          >
            + {t('addNew')}
          </button>
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('addTitle')}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t('namePlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSave}>{tCommon('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
