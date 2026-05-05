'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
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
  onAddLocation: (name: string) => string
}

const ADD_NEW_SENTINEL = '__add_new__'

export default function LocationPickerSelect({
  locations,
  value,
  onChange,
  onAddLocation,
}: LocationPickerSelectProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const handleValueChange = (val: string) => {
    if (val === ADD_NEW_SENTINEL) {
      setDialogOpen(true)
      return
    }
    onChange(val)
  }

  const handleSave = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const newId = onAddLocation(trimmed)
    onChange(newId)
    setNewName('')
    setDialogOpen(false)
  }

  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc.id} value={loc.id}>
              {loc.name}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={ADD_NEW_SENTINEL} className="text-blue-600">
            + Tambah lokasi baru
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Lokasi Baru</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nama lokasi"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
