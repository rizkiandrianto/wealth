'use client'

// Required APIs:
//   GET    /api/crypto
//   GET    /api/crypto-locations
//   GET    /api/market/prices
//   GET    /api/crypto/sales        (Sales tab)
//   (POST/PATCH/DELETE /api/crypto/* via CryptoForm / dialogs)

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AssetFormSheet from '@/components/AssetFormSheet'
import CryptosList from '@/components/CryptosList'
import CryptosByLocation from '@/components/CryptosByLocation'
import CryptosSummary from '@/components/CryptosSummary'
import CryptoSalesList from '@/components/sales/CryptoSalesList'
import { cryptosQueryOptions, cryptoSalesQueryOptions, useCryptosQuery } from '@/lib/queries/crypto'
import { cryptoLocationsQueryOptions, useCryptoLocationsQuery } from '@/lib/queries/cryptoLocations'
import { assetPricesQueryOptions } from '@/lib/queries/prices'

export default function CryptoPage() {
  const t = useTranslations('holdings.crypto')
  const tTabs = useTranslations('sales')
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(cryptosQueryOptions())
    qc.prefetchQuery(cryptoLocationsQueryOptions())
    qc.prefetchQuery(assetPricesQueryOptions())
    qc.prefetchQuery(cryptoSalesQueryOptions())
  }, [qc])

  const { data: cryptos = [], isLoading: cryptosLoading } = useCryptosQuery()
  const { data: cryptoLocations = [] } = useCryptoLocationsQuery()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('pageSubtitle')}
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
            {t('addCrypto')}
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

        <Tabs defaultValue="holdings" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 w-fit">
            <TabsTrigger value="holdings">{tTabs('tabHoldings')}</TabsTrigger>
            <TabsTrigger value="sales">{tTabs('tabSales')}</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-6">
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
                    <TabsList className="grid grid-cols-2 mb-6">
                      <TabsTrigger value="by-symbol">{t('bySymbol')}</TabsTrigger>
                      <TabsTrigger value="by-location">{t('byLocation')}</TabsTrigger>
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
                    <p className="text-muted-foreground mb-4">{t('noCrypto')}</p>
                    <Button
                      onClick={() => {
                        setEditingId(null)
                        setShowForm(true)
                      }}
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t('addFirst')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <CryptoSalesList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
