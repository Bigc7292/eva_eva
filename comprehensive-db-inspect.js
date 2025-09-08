/**
 * Comprehensive Database Inspector
 * 
 * This script will try multiple approaches to inspect your existing Supabase database
 * including checking with service role key for full access
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - trying both anon and service role
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ2MjA3MiwiZXhwIjoyMDYwMDM4MDcyfQ.qhJOG88xI4TdOoOqMOsEPqLhMLpLIrcGmAa8YA2tpRo';

// Create clients with different keys
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspectWithServiceRole() {
  console.log('🔑 Using Service Role Key for comprehensive inspection...\n');
  
  try {
    // Try to get all tables using service role
    const { data: tables, error } = await supabaseService
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            table_name, 
            table_schema,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = t.table_schema) as column_count
          FROM information_schema.tables t
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });

    if (error) {
      console.log('❌ Could not access information_schema via RPC, trying direct table access...\n');
      return await inspectKnownTables();
    }

    console.log('📋 Found Tables in Database:');
    console.log('=' .repeat(50));
    
    for (const table of tables) {
      console.log(`\n🗂️  Table: ${table.table_name}`);
      console.log(`   Schema: ${table.table_schema}`);
      console.log(`   Columns: ${table.column_count}`);
      
      // Get record count and sample data
      try {
        const { data: records, error: countError, count } = await supabaseService
          .from(table.table_name)
          .select('*', { count: 'exact', head: true });
        
        if (!countError) {
          console.log(`   Records: ${count || 0}`);
          
          if (count > 0) {
            // Get sample data
            const { data: sample } = await supabaseService
              .from(table.table_name)
              .select('*')
              .limit(1);
            
            if (sample && sample.length > 0) {
              console.log(`   Sample columns: ${Object.keys(sample[0]).join(', ')}`);
            }
          }
        } else {
          console.log(`   Records: Unable to count (${countError.message})`);
        }
      } catch (err) {
        console.log(`   Records: Error accessing table`);
      }
    }
    
    return tables;
    
  } catch (error) {
    console.log('❌ Service role inspection failed, trying alternative approach...\n');
    return await inspectKnownTables();
  }
}

async function inspectKnownTables() {
  console.log('🔍 Checking Known Tables Individually...\n');
  
  const knownTables = [
    'leads', 'calls', 'meetings', 'lead_profiles', 'enhanced_leads',
    'phone_number_profiles', 'interactions', 'user_profiles',
    'users', 'profiles', 'analytics', 'phone_calls', 'callbacks'
  ];
  
  const results = {
    existingTables: [],
    missingTables: [],
    totalRecords: 0,
    errors: []
  };
  
  for (const tableName of knownTables) {
    try {
      console.log(`📋 Checking: ${tableName}`);
      
      // Try with service role first
      let { data, error, count } = await supabaseService
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      // If service role fails, try anon
      if (error) {
        const result = await supabaseAnon
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        data = result.data;
        error = result.error;
        count = result.count;
      }
      
      if (!error) {
        results.existingTables.push({
          name: tableName,
          recordCount: count || 0
        });
        results.totalRecords += count || 0;
        
        console.log(`   ✅ EXISTS - ${count || 0} records`);
        
        // Get sample data to understand structure
        const { data: sample } = await supabaseService
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (sample && sample.length > 0) {
          const columns = Object.keys(sample[0]);
          console.log(`   📊 Columns (${columns.length}): ${columns.slice(0, 8).join(', ')}${columns.length > 8 ? '...' : ''}`);
          
          // Show sample data for small tables or interesting fields
          if (count && count <= 3) {
            console.log(`   📖 Sample:`, JSON.stringify(sample[0], null, 2).substring(0, 300) + '...');
          }
        }
      } else {
        results.missingTables.push(tableName);
        console.log(`   ❌ MISSING or NO ACCESS - ${error.message}`);
        results.errors.push({ table: tableName, error: error.message });
      }
    } catch (tableError) {
      results.missingTables.push(tableName);
      console.log(`   ❌ ERROR - ${tableError.message}`);
      results.errors.push({ table: tableName, error: tableError.message });
    }
    console.log('');
  }
  
  return results;
}

async function comprehensiveInspection() {
  console.log('🔍 COMPREHENSIVE DATABASE INSPECTION');
  console.log('=' .repeat(60));
  console.log(`🌐 Database: ${SUPABASE_URL}`);
  console.log(`⏰ Time: ${new Date().toISOString()}\n`);
  
  try {
    // First try service role comprehensive inspection
    const serviceResults = await inspectWithServiceRole();
    
    // Also check known tables for detailed info
    const detailedResults = await inspectKnownTables();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL INSPECTION SUMMARY');
    console.log('='.repeat(60));
    
    if (detailedResults.existingTables) {
      console.log(`✅ Existing Tables: ${detailedResults.existingTables.length}`);
      console.log(`❌ Missing Tables: ${detailedResults.missingTables.length}`);
      console.log(`📈 Total Records: ${detailedResults.totalRecords}`);
      
      if (detailedResults.existingTables.length > 0) {
        console.log('\n📋 EXISTING TABLES WITH DATA:');
        detailedResults.existingTables
          .filter(t => t.recordCount > 0)
          .forEach(table => {
            console.log(`   • ${table.name} (${table.recordCount} records)`);
          });
        
        const emptyTables = detailedResults.existingTables.filter(t => t.recordCount === 0);
        if (emptyTables.length > 0) {
          console.log('\n📋 EMPTY TABLES:');
          emptyTables.forEach(table => {
            console.log(`   • ${table.name} (0 records)`);
          });
        }
      }
      
      if (detailedResults.errors.length > 0) {
        console.log('\n⚠️  ACCESS ISSUES:');
        detailedResults.errors.forEach(err => {
          console.log(`   • ${err.table}: ${err.error}`);
        });
      }
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (detailedResults.existingTables && detailedResults.existingTables.length > 0) {
      const tablesWithData = detailedResults.existingTables.filter(t => t.recordCount > 0);
      if (tablesWithData.length > 0) {
        console.log('   ⚠️  CAUTION: You have existing data!');
        console.log('   📁 Backup existing data before schema changes');
        console.log('   🔄 Consider migration scripts instead of schema replacement');
        console.log('   🧪 Test schema changes in development environment first');
      } else {
        console.log('   ✅ Tables exist but are empty - safe to run enhanced schema');
      }
    } else {
      console.log('   ✅ No conflicting tables found - safe to run enhanced schema');
    }
    
    return detailedResults;
    
  } catch (error) {
    console.error('❌ Comprehensive inspection failed:', error);
    throw error;
  }
}

// Run the comprehensive inspection
comprehensiveInspection()
  .then(results => {
    console.log('\n✨ Database inspection completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Inspection failed:', error);
    process.exit(1);
  });