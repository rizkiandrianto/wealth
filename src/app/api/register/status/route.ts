import { NextResponse } from 'next/server'
import { isRegistrationEnabled } from '@/lib/settings'

export async function GET() {
  const enabled = await isRegistrationEnabled()
  return NextResponse.json({ enabled })
}
