import DashboardLayout from '@/components/DashboardLayout'
import { Spinner } from '@/components/ui/spinner'

export default function PageLoader() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Spinner className="size-5" />
        <span>Memuat data…</span>
      </div>
    </DashboardLayout>
  )
}
