'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import PageLoader from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import AssetFormSheet from '@/components/AssetFormSheet'
import GoldList from '@/components/GoldList'
import GoldSummary from '@/components/GoldSummary'
import { useAssetStore } from '@/lib/useAssetStore'

export default function GoldPage() {
  const { golds, goldLocations } = useAssetStore()
  const hasHydrated = useAssetStore((s) => s.hasHydrated)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!hasHydrated) {
    return <PageLoader />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Emas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola portfolio emas Anda
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null)
              setShowForm(true)
            }}
            className="gap-2 bg-yellow-600 hover:bg-yellow-700"
          >
            <Plus className="w-4 h-4" />
            Tambah Emas
          </Button>
        </div>

        <AssetFormSheet
          type="gold"
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open)
            if (!open) setEditingId(null)
          }}
          editingId={editingId}
        />

        {golds.length > 0 && <GoldSummary />}

        {golds.length > 0 && (
          <GoldList
            golds={golds}
            locations={goldLocations}
            onEdit={(id) => {
              setEditingId(id)
              setShowForm(true)
            }}
          />
        )}

        {golds.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Belum ada emas</p>
            <Button
              onClick={() => {
                setEditingId(null)
                setShowForm(true)
              }}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Emas Pertama
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
