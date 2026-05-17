import { cn } from '@/lib/utils'

type LogoSize = 'sm' | 'md' | 'lg'

interface LogoProps {
  size?: LogoSize
  showWordmark?: boolean
  className?: string
}

const SIZE_STYLES: Record<LogoSize, { box: string; text: string }> = {
  sm: { box: 'w-6 h-6', text: 'text-base' },
  md: { box: 'w-8 h-8', text: 'text-xl' },
  lg: { box: 'w-12 h-12', text: 'text-2xl' },
}

export default function Logo({ size = 'md', showWordmark = true, className }: LogoProps) {
  const styles = SIZE_STYLES[size]
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span
        className={cn(
          'rounded-lg p-1 bg-white flex items-center justify-center overflow-hidden shrink-0',
          styles.box,
        )}
      >
        <img
          src="/mywealth.png"
          alt="Wealth logo"
          className="rounded-lg w-full h-full object-contain"
        />
      </span>
      {showWordmark && (
        <span className={cn('font-bold', styles.text)}>Wealth</span>
      )}
    </span>
  )
}
