import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCachedUsdIdr, refreshUsdIdr } from '@/lib/market/fx'

function checkApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key')
  return key !== null && key === process.env.INTERNAL_API_KEY
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rate = await getCachedUsdIdr()
  if (rate === null) {
    return NextResponse.json({ error: 'FX rate not yet fetched' }, { status: 404 })
  }
  return NextResponse.json({ pair: 'USDIDR', rate })
}

export async function POST(req: NextRequest) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rate = await refreshUsdIdr()
  if (rate === null) {
    return NextResponse.json({ error: 'Failed to fetch USD/IDR' }, { status: 502 })
  }
  return NextResponse.json({
    pair: 'USDIDR',
    rate,
    updatedAt: new Date().toISOString(),
  })
}
