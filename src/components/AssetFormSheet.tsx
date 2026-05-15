'use client'

import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/components/ui/use-mobile'
import { Button } from '@/components/ui/button'
import { useAccountsQuery } from '@/lib/queries/accounts'
import { useAddTransaction } from '@/lib/queries/transactions'
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

// Isolates accounts + transaction hooks so they only fire when the
// transaction sheet is actually mounted (sheet open + type === 'transaction').
function TransactionBody({ close }: { close: () => void }) {
  const t = useTranslations('assetFormSheet')
  const tCommon = useTranslations('common')
  const { data: accounts = [] } = useAccountsQuery()
  const addTransaction = useAddTransaction()

  if (accounts.length === 0) {
    return (
      <div className="p-6 text-center space-y-4">
        <h3 className="text-lg font-semibold">{t('noAccounts')}</h3>
        <p className="text-sm text-muted-foreground">{t('noAccountsHint')}</p>
        <Button onClick={close} variant="outline">
          {tCommon('close')}
        </Button>
      </div>
    )
  }

  return (
    <TransactionForm
      accounts={accounts}
      onSubmit={async (data) => {
        await addTransaction.mutateAsync(data)
        close()
      }}
      onCancel={close}
    />
  )
}

export default function AssetFormSheet({
  type,
  open,
  onOpenChange,
  editingId = null,
}: AssetFormSheetProps) {
  const t = useTranslations('assetFormSheet')
  const isMobile = useIsMobile()
  const close = () => onOpenChange(false)
  const titleKeyMap: Record<AssetFormType, 'stock' | 'crypto' | 'gold' | 'transaction'> = {
    stock: 'stock',
    crypto: 'crypto',
    gold: 'gold',
    transaction: 'transaction',
  }
  const title = t(`title.${titleKeyMap[type]}`)

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
    return <TransactionBody close={close} />
  })()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          <div className="overflow-y-auto md:px-4 md:pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 max-w-lg max-h-[90vh] overflow-y-auto rounded-xl"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  )
}
