'use client'

// Required APIs:
//   GET    /api/stocks
//   GET    /api/stock-locations
//   GET    /api/market/prices
//   GET    /api/stocks/sales        (Sales tab)
//   (POST/PATCH/DELETE /api/stocks/*  via StockForm / dialogs)

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AssetFormSheet from '@/components/AssetFormSheet'
import StocksList from '@/components/StocksList'
import StocksByLocation from '@/components/StocksByLocation'
import StocksSummary from '@/components/StocksSummary'
import StockSalesList from '@/components/sales/StockSalesList'
import { stocksQueryOptions, stockSalesQueryOptions, useStocksQuery } from '@/lib/queries/stocks'
import { stockLocationsQueryOptions, useStockLocationsQuery } from '@/lib/queries/stockLocations'
import { assetPricesQueryOptions } from '@/lib/queries/prices'

export default function StocksPage() {
  const t = useTranslations('holdings.stocks')
  const tTabs = useTranslations('sales')
  const qc = useQueryClient()
  useEffect(() => {
    qc.prefetchQuery(stocksQueryOptions())
    qc.prefetchQuery(stockLocationsQueryOptions())
    qc.prefetchQuery(assetPricesQueryOptions())
    qc.prefetchQuery(stockSalesQueryOptions())
  }, [qc])

  const { data: stocks = [], isLoading: stocksLoading } = useStocksQuery()
  const { data: stockLocations = [] } = useStockLocationsQuery()
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
            {t('addStock')}
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

        <Tabs defaultValue="holdings" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 w-fit">
            <TabsTrigger value="holdings">{tTabs('tabHoldings')}</TabsTrigger>
            <TabsTrigger value="sales">{tTabs('tabSales')}</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-6">
            {stocksLoading ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-md" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </>
            ) : (
              <>
                {stocks.length > 0 && <StocksSummary />}

                {stocks.length > 0 && (
                  <Tabs defaultValue="by-ticker" className="w-full">
                    <TabsList className="grid grid-cols-2 mb-6">
                      <TabsTrigger value="by-ticker">{t('byTicker')}</TabsTrigger>
                      <TabsTrigger value="by-location">{t('byLocation')}</TabsTrigger>
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
                    <p className="text-muted-foreground mb-4">{t('noStocks')}</p>
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
            <StockSalesList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
