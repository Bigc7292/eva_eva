import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase key length:', supabaseKey?.length)

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Test the connection and table
async function testSupabaseConnection() {
  try {
    // Test general connection
    const { data: tableInfo, error: tableError } = await supabase
      .from('calls')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('Error accessing calls table:', tableError)
    } else {
      console.log('Successfully connected to calls table')
      
      // Insert a test record
      const { data: insertData, error: insertError } = await supabase
        .from('calls')
        .insert([
          {
            call_id: 'test-call-' + Date.now(),
            status: 'test',
            start_time: new Date().toISOString(),
            customer_phone: '+1234567890',
          }
        ])
        .select()

      if (insertError) {
        console.error('Error inserting test record:', insertError)
      } else {
        console.log('Successfully inserted test record:', insertData)
      }
    }
  } catch (error) {
    console.error('Error testing Supabase connection:', error)
  }
}

testSupabaseConnection() 