import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

async function handle(req: NextRequest) {
  const intlResponse = intlMiddleware(req)
  const session = await auth()
  const isLoggedIn = !!session
  const { pathname } = req.nextUrl

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
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
