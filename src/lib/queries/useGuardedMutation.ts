import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useDemoGuard } from '@/components/providers/DemoGuardProvider'

export class DemoBlockedError extends Error {
  constructor() {
    super('Demo blocked')
    this.name = 'DemoBlockedError'
  }
}

export function useGuardedMutation<TData, TErr, TVars, TCtx = unknown>(
  options: UseMutationOptions<TData, TErr, TVars, TCtx>,
) {
  const { data: session } = useSession()
  const { openDemoDialog } = useDemoGuard()
  const isDemo = !!session?.user?.isDemo
  const originalMutationFn = options.mutationFn
  return useMutation<TData, TErr, TVars, TCtx>({
    ...options,
    mutationFn: async (vars, ctx) => {
      if (isDemo) {
        openDemoDialog()
        throw new DemoBlockedError() as unknown as TErr
      }
      return originalMutationFn!(vars, ctx)
    },
    onError: (err, vars, onMutateResult, ctx) => {
      if (err instanceof DemoBlockedError) return
      options.onError?.(err, vars, onMutateResult, ctx)
    },
  })
}
