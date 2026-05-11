'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import PageLoader from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AssetFormSheet from '@/components/AssetFormSheet'
import CryptosList from '@/components/CryptosList'
import CryptosByLocation from '@/components/CryptosByLocation'
import CryptosSummary from '@/components/CryptosSummary'
import { useAssetStore } from '@/lib/useAssetStore'

export default function CryptoPage() {
  const { cryptos, cryptoLocations } = useAssetStore()
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
            <h1 className="text-3xl font-bold tracking-tight">Crypto</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola portfolio crypto Anda
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
            Tambah Crypto
          </Button>
        </div>

        <AssetFormSheet
          type="crypto"
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open)
            if (!open) setEditingId(null)
          }}
          editingId={editingId}
        />

        {cryptos.length > 0 && <CryptosSummary />}

        {cryptos.length > 0 && (
          <Tabs defaultValue="by-symbol" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="by-symbol">Berdasarkan Symbol</TabsTrigger>
              <TabsTrigger value="by-location">Berdasarkan Lokasi</TabsTrigger>
            </TabsList>

            <TabsContent value="by-symbol" className="space-y-4">
              <CryptosList
                cryptos={cryptos}
                onEdit={(id) => {
                  setEditingId(id)
                  setShowForm(true)
                }}
              />
            </TabsContent>

            <TabsContent value="by-location" className="space-y-4">
              <CryptosByLocation
                cryptos={cryptos}
                locations={cryptoLocations}
                onEdit={(id) => {
                  setEditingId(id)
                  setShowForm(true)
                }}
              />
            </TabsContent>
          </Tabs>
        )}

        {cryptos.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Belum ada crypto</p>
            <Button
              onClick={() => {
                setEditingId(null)
                setShowForm(true)
              }}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Crypto Pertama
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
