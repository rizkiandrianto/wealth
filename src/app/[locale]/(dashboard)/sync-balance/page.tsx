// Required APIs:
//   POST /api/sync-balance/preview
//   POST /api/sync-balance/commit
//   GET  /api/settings?prefix=sync.

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import SyncBalancePageClient from './SyncBalancePageClient'

export default async function SyncBalancePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user] = await db
    .select({ isOwner: users.isOwner })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user?.isOwner) redirect('/')

  const year = new Date().getFullYear()
  return <SyncBalancePageClient defaultYear={year} />
}
