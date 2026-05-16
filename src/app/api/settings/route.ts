import { NextRequest, NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'
import {
  deleteSetting,
  listSettings,
  upsertSetting,
} from '@/lib/settings'

async function withOwner<T>(fn: (userId: string) => Promise<T>): Promise<Response> {
  try {
    const session = await requireOwner()
    const result = await fn(session.user.id)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof Response) return err
    throw err
  }
}

export async function GET(req: NextRequest) {
  return withOwner(async (userId) => {
    const prefix = req.nextUrl.searchParams.get('prefix') ?? undefined
    return listSettings(userId, prefix)
  })
}

export async function POST(req: NextRequest) {
  return withOwner(async (userId) => {
    const body = await req.json()
    const { key, value, description } = body ?? {}
    if (typeof key !== 'string' || !key.trim()) {
      throw new Response('Missing key', { status: 400 })
    }
    if (typeof value !== 'string') {
      throw new Response('Value must be a string', { status: 400 })
    }
    await upsertSetting(
      userId,
      key.trim(),
      value,
      typeof description === 'string' ? description : undefined,
    )
    return { ok: true }
  })
}

export async function DELETE(req: NextRequest) {
  return withOwner(async (userId) => {
    const body = await req.json().catch(() => ({}))
    const { key } = body ?? {}
    if (typeof key !== 'string' || !key.trim()) {
      throw new Response('Missing key', { status: 400 })
    }
    await deleteSetting(userId, key.trim())
    return { ok: true }
  })
}
