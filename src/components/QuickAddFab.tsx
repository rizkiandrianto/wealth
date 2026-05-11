'use client'

import { useState } from 'react'
import { Plus, TrendingUp, Bitcoin, ArrowLeftRight, Gem } from 'lucide-react'
import { cn } from '@/lib/utils'
import AssetFormSheet, { type AssetFormType } from '@/components/AssetFormSheet'

type Action = {
  type: AssetFormType
  label: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
}

const ACTIONS: Action[] = [
  {
    type: 'gold',
    label: 'Emas',
    icon: Gem,
    gradient: 'from-yellow-500 to-amber-500',
  },
  {
    type: 'stock',
    label: 'Saham',
    icon: TrendingUp,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    type: 'crypto',
    label: 'Kripto',
    icon: Bitcoin,
    gradient: 'from-orange-500 to-amber-600',
  },
  {
    type: 'transaction',
    label: 'Transaksi',
    icon: ArrowLeftRight,
    gradient: 'from-emerald-500 to-teal-600',
  },
]

export default function QuickAddFab() {
  const [open, setOpen] = useState(false)
  const [activeType, setActiveType] = useState<AssetFormType | null>(null)

  const handlePick = (type: AssetFormType) => {
    setActiveType(type)
    setOpen(false)
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Tutup menu tambah"
          className="fixed inset-0 bg-black/20 backdrop-blur-sm top-0 z-50"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:bottom-6 md:translate-x-0 z-50 flex flex-col items-center md:items-end gap-3">
        {ACTIONS.map((action, index) => {
          const Icon = action.icon
          const reverseIndex = ACTIONS.length - 1 - index
          return (
            <div
              key={action.type}
              className={cn(
                'flex items-center gap-3 transition-all duration-200 ease-out',
                open
                  ? 'translate-y-0 opacity-100 pointer-events-auto'
                  : 'translate-y-4 opacity-0 pointer-events-none',
              )}
              style={{ transitionDelay: open ? `${reverseIndex * 40}ms` : '0ms' }}
            >
              <span className="hidden md:inline-flex rounded-full border bg-background px-3 py-1 text-sm font-medium shadow-sm">
                {action.label}
              </span>
              <button
                type="button"
                onClick={() => handlePick(action.type)}
                aria-label={`Tambah ${action.label}`}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg transition-transform hover:scale-105 active:scale-95',
                  action.gradient,
                )}
              >
                <Icon className="h-5 w-5" />
              </button>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Tutup menu tambah' : 'Buka menu tambah'}
          aria-expanded={open}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:shadow-xl active:scale-95 border-4 border-white"
        >
          <Plus
            className={cn(
              'h-6 w-6 transition-transform duration-200',
              open && 'rotate-45',
            )}
          />
        </button>
      </div>

      <AssetFormSheet
        type={activeType ?? 'stock'}
        open={activeType !== null}
        onOpenChange={(o) => {
          if (!o) setActiveType(null)
        }}
      />
    </>
  )
}
