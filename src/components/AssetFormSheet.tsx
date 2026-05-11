'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/components/ui/use-mobile'
import { Button } from '@/components/ui/button'
import { useAssetStore } from '@/lib/useAssetStore'
import StockForm from '@/components/StockForm'
import CryptoForm from '@/components/CryptoForm'
import GoldForm from '@/components/GoldForm'
import TransactionForm from '@/components/TransactionForm'

export type AssetFormType = 'stock' | 'crypto' | 'gold' | 'transaction'

interface AssetFormSheetProps {
  type: AssetFormType
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId?: string | null
}

const TITLE: Record<AssetFormType, string> = {
  stock: 'Tambah / Edit Saham',
  crypto: 'Tambah / Edit Crypto',
  gold: 'Tambah / Edit Emas',
  transaction: 'Catat Transaksi',
}

export default function AssetFormSheet({
  type,
  open,
  onOpenChange,
  editingId = null,
}: AssetFormSheetProps) {
  const isMobile = useIsMobile()
  const accounts = useAssetStore((s) => s.accounts)
  const addTransaction = useAssetStore((s) => s.addTransaction)

  const close = () => onOpenChange(false)

  const body = (() => {
    if (type === 'stock') {
      return <StockForm editingId={editingId} onClose={close} />
    }
    if (type === 'crypto') {
      return <CryptoForm editingId={editingId} onClose={close} />
    }
    if (type === 'gold') {
      return <GoldForm editingId={editingId} onClose={close} />
    }
    if (accounts.length === 0) {
      return (
        <div className="p-6 text-center space-y-4">
          <h3 className="text-lg font-semibold">Belum ada akun</h3>
          <p className="text-sm text-muted-foreground">
            Buat akun dulu sebelum mencatat transaksi.
          </p>
          <Button onClick={close} variant="outline">
            Tutup
          </Button>
        </div>
      )
    }
    return (
      <TransactionForm
        accounts={accounts}
        onSubmit={(data) => {
          addTransaction(data)
          close()
        }}
        onCancel={close}
      />
    )
  })()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerTitle className="sr-only">{TITLE[type]}</DrawerTitle>
          <div className="overflow-y-auto px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogTitle className="sr-only">{TITLE[type]}</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  )
}
