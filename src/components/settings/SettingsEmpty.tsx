import { Settings as SettingsIcon } from 'lucide-react'

export default function SettingsEmpty({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <SettingsIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
