import { supabase } from '@/lib/services/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)

  await supabase.auth.signOut()

  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    status: 301,
  })
}