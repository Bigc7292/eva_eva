// Re-export supabase from services to maintain backward compatibility
import { supabase } from './services/supabase';
export { supabase };

// Test the connection and table
async function testSupabaseConnection() {
  try {
    // Test general connection using anon key
    const { data: tableInfo, error: tableError } = await supabase
      .from('calls')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('Error accessing calls table:', tableError)
      return
    }

    console.log('Successfully connected to calls table')

    // Import the table structure check dynamically to avoid circular dependencies
    const { checkTableStructure } = await import('./check-table-structure')
    await checkTableStructure(supabase)
  } catch (error) {
    console.error('Error testing Supabase connection:', error)
  }
}

testSupabaseConnection()