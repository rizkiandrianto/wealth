'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import PageLoader from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AssetFormSheet from '@/components/AssetFormSheet'
import StocksList from '@/components/StocksList'
import StocksByLocation from '@/components/StocksByLocation'
import StocksSummary from '@/components/StocksSummary'
import { useAssetStore } from '@/lib/useAssetStore'

export default function StocksPage() {
  const { stocks, stockLocations } = useAssetStore()
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
            <h1 className="text-3xl font-bold tracking-tight">Saham</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola portfolio saham Anda
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null)
              setShowForm(true)
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Saham
          </Button>
        </div>

        <AssetFormSheet
          type="stock"
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open)
            if (!open) setEditingId(null)
          }}
          editingId={editingId}
        />

        {stocks.length > 0 && <StocksSummary />}

        {stocks.length > 0 && (
          <Tabs defaultValue="by-ticker" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="by-ticker">Berdasarkan Ticker</TabsTrigger>
              <TabsTrigger value="by-location">Berdasarkan Lokasi</TabsTrigger>
            </TabsList>

            <TabsContent value="by-ticker" className="space-y-4">
              <StocksList
                stocks={stocks}
                onEdit={(id) => {
                  setEditingId(id)
                  setShowForm(true)
                }}
              />
            </TabsContent>

            <TabsContent value="by-location" className="space-y-4">
              <StocksByLocation
                stocks={stocks}
                locations={stockLocations}
                onEdit={(id) => {
                  setEditingId(id)
                  setShowForm(true)
                }}
              />
            </TabsContent>
          </Tabs>
        )}

        {stocks.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Belum ada saham</p>
            <Button
              onClick={() => {
                setEditingId(null)
                setShowForm(true)
              }}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Saham Pertama
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
