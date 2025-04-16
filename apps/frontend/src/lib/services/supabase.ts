import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
})

export const getActiveCallsSubscription = (callback: Function) => {
  return supabase
    .channel('active_calls')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'active_calls' },
      (payload) => callback(payload)
    )
    .subscribe()
}
