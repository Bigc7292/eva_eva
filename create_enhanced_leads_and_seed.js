// Script to create enhanced_leads table and seed with sample data using Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createTableAndSeed() {
  // Create table
  const createTableSql = `
    create table if not exists enhanced_leads (
      id uuid primary key default uuid_generate_v4(),
      name varchar(100),
      phone varchar(32) unique,
      email varchar(100),
      status varchar(32),
      source varchar(64),
      location varchar(100),
      successful_meetings integer default 0,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );
  `;
  const { error: tableError } = await supabase.rpc('execute_sql', { sql: createTableSql });
  if (tableError) {
    console.error('Error creating enhanced_leads table:', tableError);
  } else {
    console.log('enhanced_leads table created or already exists.');
  }

  // Insert sample data
  const leads = [
    {
      name: 'John Smith',
      phone: '+1234567890',
      email: 'john.smith@example.com',
      status: 'Active',
      source: 'Website',
      location: 'Dubai',
      successful_meetings: 2
    },
    {
      name: 'Jane Doe',
      phone: '+1987654321',
      email: 'jane.doe@example.com',
      status: 'Converted',
      source: 'Referral',
      location: 'Abu Dhabi',
      successful_meetings: 1
    },
    {
      name: 'Ali Hassan',
      phone: '+971501234567',
      email: 'ali.hassan@example.com',
      status: 'Active',
      source: 'Ad Campaign',
      location: 'Sharjah',
      successful_meetings: 0
    },
    {
      name: 'Maria Lopez',
      phone: '+447911123456',
      email: 'maria.lopez@example.com',
      status: 'Active',
      source: 'Website',
      location: 'London',
      successful_meetings: 0
    },
    {
      name: 'Wei Zhang',
      phone: '+8613800138000',
      email: 'wei.zhang@example.com',
      status: 'Converted',
      source: 'Event',
      location: 'Beijing',
      successful_meetings: 3
    }
  ];
  for (const lead of leads) {
    const { error } = await supabase.from('enhanced_leads').insert([lead]);
    if (error) {
      if (error.code !== '23505') // ignore duplicate key error
        console.error('Error inserting lead:', lead, error);
    } else {
      console.log('Inserted sample lead:', lead.name);
    }
  }
}

createTableAndSeed().then(() => process.exit(0));
