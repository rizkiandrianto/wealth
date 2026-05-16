'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type DemoGuardContextValue = {
  openDemoDialog: () => void
}

const DemoGuardContext = createContext<DemoGuardContextValue | null>(null)

export function useDemoGuard(): DemoGuardContextValue {
  const ctx = useContext(DemoGuardContext)
  if (!ctx) {
    return { openDemoDialog: () => {} }
  }
  return ctx
}

export function DemoGuardProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('demo')
  const [open, setOpen] = useState(false)

  const openDemoDialog = useCallback(() => setOpen(true), [])

  return (
    <DemoGuardContext.Provider value={{ openDemoDialog }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialogDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpen(false)}>
              {t('dialogAck')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DemoGuardContext.Provider>
  )
}
