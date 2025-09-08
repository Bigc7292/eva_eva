/**
 * Database Inspector
 * 
 * This script connects to your Supabase database and inspects the current structure
 * to understand what tables and data already exist before applying schema changes.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from your existing files
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectDatabase() {
  console.log('🔍 Inspecting Database Structure...\n');
  
  try {
    // Check known tables that might exist
    const knownTables = [
      'leads', 'calls', 'meetings', 'lead_profiles', 'enhanced_leads',
      'phone_number_profiles', 'interactions', 'user_profiles'
    ];
    
    const results = {
      existingTables: [],
      missingTables: [],
      totalRecords: 0
    };
    
    for (const tableName of knownTables) {
      try {
        console.log(`📋 Checking table: ${tableName}`);
        
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          results.existingTables.push({
            name: tableName,
            recordCount: count || 0
          });
          results.totalRecords += count || 0;
          
          console.log(`   ✅ EXISTS - ${count || 0} records`);
          
          // Get a sample record to show structure
          const { data: sample } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (sample && sample.length > 0) {
            const columns = Object.keys(sample[0]);
            console.log(`   📊 Columns (${columns.length}): ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
            
            // Show sample data for small tables
            if (count && count <= 5) {
              console.log(`   📖 Sample data:`, JSON.stringify(sample[0], null, 2).substring(0, 200) + '...');
            }
          }
        } else {
          results.missingTables.push(tableName);
          console.log(`   ❌ MISSING - ${error.message}`);
        }
      } catch (tableError) {
        results.missingTables.push(tableName);
        console.log(`   ❌ ERROR - ${tableError.message}`);
      }
      console.log('');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE INSPECTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Existing Tables: ${results.existingTables.length}`);
    console.log(`❌ Missing Tables: ${results.missingTables.length}`);
    console.log(`📈 Total Records: ${results.totalRecords}`);
    
    console.log('\n📋 EXISTING TABLES:');
    results.existingTables.forEach(table => {
      console.log(`   • ${table.name} (${table.recordCount} records)`);
    });
    
    if (results.missingTables.length > 0) {
      console.log('\n❌ MISSING TABLES:');
      results.missingTables.forEach(table => {
        console.log(`   • ${table}`);
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (results.existingTables.length > 0) {
      console.log('   • You have existing data - proceed with caution');
      console.log('   • Create a backup before running schema changes');
      console.log('   • Consider incremental migration instead of full schema replacement');
    }
    
    if (results.missingTables.length > 0) {
      console.log('   • Missing tables can be created safely');
      console.log('   • Run the enhanced schema for missing analytics tables');
    }

    return results;

  } catch (error) {
    console.error('❌ Error during database inspection:', error);
    throw error;
  }
}

// Run the inspection
inspectDatabase()
  .then(results => {
    console.log('\n✨ Database inspection completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Database inspection failed:', error);
    process.exit(1);
  });