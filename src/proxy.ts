import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const DEMO_OPEN_API = /^\/api\/(auth|register)(\/|$)/

async function handle(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/')) {
    if (!MUTATING_METHODS.has(req.method)) return
    if (DEMO_OPEN_API.test(pathname)) return
    const session = await auth()
    if (session?.user?.isDemo) {
      return NextResponse.json(
        { error: 'Demo account is read-only' },
        { status: 401 },
      )
    }
    return
  }

  const intlResponse = intlMiddleware(req)
  const session = await auth()
  const isLoggedIn = !!session

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return intlResponse
}

export default handle

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
    '/api/((?!auth|register).*)',
  ],
}
