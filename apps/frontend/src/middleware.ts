import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip middleware in development for easier testing
  if (process.env.NODE_ENV === 'development') {
    // Check for mock session in development
    const mockSession = req.cookies.get('mock-session')?.value;
    const hasMockSession = mockSession && mockSession !== 'null';
    
    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/auth', '/api/auth']
    const isPublicRoute = publicRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    )

    // If user has mock session and trying to access auth pages, redirect to dashboard
    if (hasMockSession && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Allow access to all routes in development
    return res;
  }
  
  // Production middleware with Supabase
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get session from cookies
  const token = req.cookies.get('sb-access-token')?.value
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/auth', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (token && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}