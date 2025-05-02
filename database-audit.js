/**
 * Database Audit Script
 * 
 * This script analyzes the current database structure and identifies inconsistencies
 * between the schema and the code that accesses it.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Get all tables in the database
 * @returns {Promise<Array>} - Array of table names
 */
async function getTables() {
  try {
    const { data, error } = await supabase
      .from('_temp_query')
      .select()
      .sql('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name;');
    
    if (error) {
      throw error;
    }
    
    return data.map(row => row.table_name);
  } catch (error) {
    log(`Error getting tables: ${error.message}`);
    return [];
  }
}

/**
 * Get columns for a table
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} - Array of column information
 */
async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .from('_temp_query')
      .select()
      .sql(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${tableName}' ORDER BY ordinal_position;`);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    log(`Error getting columns for table ${tableName}: ${error.message}`);
    return [];
  }
}

/**
 * Get foreign keys for a table
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} - Array of foreign key information
 */
async function getTableForeignKeys(tableName) {
  try {
    const { data, error } = await supabase
      .from('_temp_query')
      .select()
      .sql(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '${tableName}';
      `);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    log(`Error getting foreign keys for table ${tableName}: ${error.message}`);
    return [];
  }
}

/**
 * Get indexes for a table
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} - Array of index information
 */
async function getTableIndexes(tableName) {
  try {
    const { data, error } = await supabase
      .from('_temp_query')
      .select()
      .sql(`
        SELECT
          i.relname AS index_name,
          a.attname AS column_name,
          ix.indisunique AS is_unique
        FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
        WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname = '${tableName}'
        ORDER BY
          i.relname;
      `);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    log(`Error getting indexes for table ${tableName}: ${error.message}`);
    return [];
  }
}

/**
 * Get sample data from a table
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} - Array of sample data
 */
async function getTableSampleData(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    log(`Error getting sample data for table ${tableName}: ${error.message}`);
    return [];
  }
}

/**
 * Analyze a table
 * @param {string} tableName - Table name
 * @returns {Promise<Object>} - Table analysis
 */
async function analyzeTable(tableName) {
  try {
    log(`Analyzing table: ${tableName}`);
    
    const columns = await getTableColumns(tableName);
    const foreignKeys = await getTableForeignKeys(tableName);
    const indexes = await getTableIndexes(tableName);
    const sampleData = await getTableSampleData(tableName);
    
    // Count rows in the table
    const { data: countData, error: countError } = await supabase
      .from('_temp_query')
      .select()
      .sql(`SELECT COUNT(*) FROM ${tableName};`);
    
    const rowCount = countError ? 'Error counting rows' : countData[0].count;
    
    return {
      name: tableName,
      columns,
      foreignKeys,
      indexes,
      rowCount,
      sampleData
    };
  } catch (error) {
    log(`Error analyzing table ${tableName}: ${error.message}`);
    return {
      name: tableName,
      error: error.message
    };
  }
}

/**
 * Analyze the database
 * @returns {Promise<Object>} - Database analysis
 */
async function analyzeDatabase() {
  try {
    log('Starting database analysis...');
    
    const tables = await getTables();
    log(`Found ${tables.length} tables: ${tables.join(', ')}`);
    
    const tableAnalyses = [];
    
    for (const tableName of tables) {
      const analysis = await analyzeTable(tableName);
      tableAnalyses.push(analysis);
    }
    
    return {
      tables: tableAnalyses
    };
  } catch (error) {
    log(`Error analyzing database: ${error.message}`);
    return {
      error: error.message
    };
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting database audit...');
    
    const analysis = await analyzeDatabase();
    
    // Output the analysis
    console.log('\n--- DATABASE AUDIT RESULTS ---\n');
    
    if (analysis.error) {
      console.log(`Error: ${analysis.error}`);
      return;
    }
    
    // Print table summaries
    console.log('Table Summaries:');
    for (const table of analysis.tables) {
      console.log(`\n${table.name}:`);
      console.log(`  Columns: ${table.columns.length}`);
      console.log(`  Foreign Keys: ${table.foreignKeys.length}`);
      console.log(`  Indexes: ${table.indexes.length}`);
      console.log(`  Row Count: ${table.rowCount}`);
      
      // Print column details
      console.log('  Columns:');
      for (const column of table.columns) {
        console.log(`    ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      }
      
      // Print foreign key details
      if (table.foreignKeys.length > 0) {
        console.log('  Foreign Keys:');
        for (const fk of table.foreignKeys) {
          console.log(`    ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        }
      }
      
      // Print index details
      if (table.indexes.length > 0) {
        console.log('  Indexes:');
        for (const idx of table.indexes) {
          console.log(`    ${idx.index_name} on ${idx.column_name} (${idx.is_unique ? 'UNIQUE' : 'NON-UNIQUE'})`);
        }
      }
    }
    
    // Identify potential issues
    console.log('\nPotential Issues:');
    
    // Check for missing indexes on foreign keys
    for (const table of analysis.tables) {
      const indexedColumns = table.indexes.map(idx => idx.column_name);
      const foreignKeyColumns = table.foreignKeys.map(fk => fk.column_name);
      
      for (const fkColumn of foreignKeyColumns) {
        if (!indexedColumns.includes(fkColumn)) {
          console.log(`  Missing index on foreign key column ${table.name}.${fkColumn}`);
        }
      }
    }
    
    // Check for inconsistent column naming
    const callsTable = analysis.tables.find(t => t.name === 'calls');
    const contactsTable = analysis.tables.find(t => t.name === 'contacts');
    
    if (callsTable && contactsTable) {
      // Check for contact_id vs id inconsistency
      const callsContactIdColumn = callsTable.columns.find(c => c.column_name === 'contact_id');
      const contactsIdColumn = contactsTable.columns.find(c => c.column_name === 'contact_id' || c.column_name === 'id');
      
      if (callsContactIdColumn && contactsIdColumn && callsContactIdColumn.column_name !== contactsIdColumn.column_name) {
        console.log(`  Inconsistent column naming: calls.${callsContactIdColumn.column_name} references contacts.${contactsIdColumn.column_name}`);
      }
    }
    
    log('Database audit completed successfully');
  } catch (error) {
    log(`Error in database audit: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
