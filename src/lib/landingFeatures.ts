import {
  Layers,
  RefreshCw,
  LineChart,
  Languages,
  Moon,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export interface LandingFeature {
  key: string
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
  accentColor: string
}

export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    key: 'multiAsset',
    icon: Layers,
    titleKey: 'features.multiAsset.title',
    descriptionKey: 'features.multiAsset.description',
    accentColor: 'text-blue-500',
  },
  {
    key: 'syncBalance',
    icon: RefreshCw,
    titleKey: 'features.syncBalance.title',
    descriptionKey: 'features.syncBalance.description',
    accentColor: 'text-emerald-500',
  },
  {
    key: 'history',
    icon: LineChart,
    titleKey: 'features.history.title',
    descriptionKey: 'features.history.description',
    accentColor: 'text-violet-500',
  },
  {
    key: 'multiLanguage',
    icon: Languages,
    titleKey: 'features.multiLanguage.title',
    descriptionKey: 'features.multiLanguage.description',
    accentColor: 'text-amber-500',
  },
  {
    key: 'darkTheme',
    icon: Moon,
    titleKey: 'features.darkTheme.title',
    descriptionKey: 'features.darkTheme.description',
    accentColor: 'text-indigo-500',
  },
  {
    key: 'privacy',
    icon: ShieldCheck,
    titleKey: 'features.privacy.title',
    descriptionKey: 'features.privacy.description',
    accentColor: 'text-rose-500',
  },
] as const
