import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Initializing Supabase with URL:', supabaseUrl)
console.log('Supabase key present:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public'
  },
  // Add retries for network issues
  queries: {
    retryAttempts: 3,
    retryInterval: 1000,
  }
})

// Test the connection and table
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Simple ping test first
    const { data: pingData, error: pingError } = await supabase
      .from('calls')
      .select('id')
      .limit(1)
      .single()
    
    if (pingError) {
      console.error('❌ Initial connection test failed:', pingError)
      return
    }
    
    console.log('✅ Successfully connected to Supabase')
    
    // Now try to get outbound calls
    const { data: outboundCalls, error: queryError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_type', 'outbound')
      .order('start_time', { ascending: false })
      .limit(5)
    
    if (queryError) {
      console.error('❌ Error querying outbound calls:', queryError)
      return
    }
    
    console.log(`✅ Found ${outboundCalls?.length || 0} outbound calls`)
    if (outboundCalls?.length > 0) {
      console.log('Recent calls:', outboundCalls)
    }
    
  } catch (error) {
    console.error('❌ Error testing Supabase connection:', error)
  }
}

// Run the test immediately
testSupabaseConnection()
