'use client'

// Required APIs:
//   GET    /api/gold
//   GET    /api/gold-locations
//   GET    /api/market/prices
//   (POST/PATCH/DELETE /api/gold/* via GoldForm / dialog)

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import AssetFormSheet from '@/components/AssetFormSheet'
import GoldList from '@/components/GoldList'
import GoldSummary from '@/components/GoldSummary'
import { goldsQueryOptions, useGoldsQuery } from '@/lib/queries/gold'
import { goldLocationsQueryOptions, useGoldLocationsQuery } from '@/lib/queries/goldLocations'
import { assetPricesQueryOptions } from '@/lib/queries/prices'

export default function GoldPage() {
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(goldsQueryOptions())
    qc.prefetchQuery(goldLocationsQueryOptions())
    qc.prefetchQuery(assetPricesQueryOptions())
  }, [qc])

  const { data: golds = [], isLoading: goldsLoading } = useGoldsQuery()
  const { data: goldLocations = [] } = useGoldLocationsQuery()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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

        {goldsLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
