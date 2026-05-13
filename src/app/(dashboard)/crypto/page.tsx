'use client'

// Required APIs:
//   GET    /api/crypto
//   GET    /api/crypto-locations
//   GET    /api/market/prices
//   (POST/PATCH/DELETE /api/crypto/* via CryptoForm / dialogs)

import { useState } from 'react'
import { Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AssetFormSheet from '@/components/AssetFormSheet'
import CryptosList from '@/components/CryptosList'
import CryptosByLocation from '@/components/CryptosByLocation'
import CryptosSummary from '@/components/CryptosSummary'
import { useCryptosQuery } from '@/lib/queries/crypto'
import { useCryptoLocationsQuery } from '@/lib/queries/cryptoLocations'

export default function CryptoPage() {
  const { data: cryptos = [], isLoading: cryptosLoading } = useCryptosQuery()
  const { data: cryptoLocations = [] } = useCryptoLocationsQuery()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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

        {cryptosLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-md" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
