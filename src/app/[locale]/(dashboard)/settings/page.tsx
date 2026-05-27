// Required APIs:
//   GET    /api/settings
//   POST   /api/settings
//   DELETE /api/settings

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import SettingsPageClient from './SettingsPageClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user] = await db
    .select({ isOwner: users.isOwner })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user?.isOwner) redirect('/')

  return <SettingsPageClient />
}
