// Script to seed Supabase with sample VAPI call data
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedVapiSampleData() {
  console.log('Seeding VAPI sample data to Supabase...');

  // Sample call data (as if received from VAPI webhooks)
  const calls = [
    {
      call_id: 'vapi_call_123456',
      phone_number: '+19876543210',
      status: 'ended',
      start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      end_time: new Date(Date.now() - 3540000).toISOString(),   // 59 minutes ago
      duration: 1200, // 20 minutes
      recording_url: 'https://storage.googleapis.com/vapi-public/sample-recording.mp3',
      metadata: {
        lead_name: 'John Smith',
        lead_id: 'lead-1',
        property_interest: 'Apartment',
        vapi_assistant_id: '4bef1401-c98c-4f78-bedf-744c0c17a6e4',
        direction: 'Outbound'
      }
    },
    {
      call_id: 'vapi_call_123457',
      phone_number: '+18765432109',
      status: 'started',
      start_time: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      metadata: {
        lead_name: 'Sarah Johnson',
        lead_id: 'lead-2',
        property_interest: 'Villa',
        vapi_assistant_id: '4bef1401-c98c-4f78-bedf-744c0c17a6e4',
        direction: 'Outbound'
      }
    },
    {
      call_id: 'vapi_call_123458',
      phone_number: '+17654321098',
      status: 'ended',
      start_time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      end_time: new Date(Date.now() - 7140000).toISOString(),   // 1 hour 59 minutes ago
      duration: 600, // 10 minutes
      recording_url: 'https://storage.googleapis.com/vapi-public/sample-recording-2.mp3',
      metadata: {
        lead_name: 'Michael Brown',
        lead_id: 'lead-3',
        property_interest: 'Townhouse',
        vapi_assistant_id: '4bef1401-c98c-4f78-bedf-744c0c17a6e4',
        direction: 'Inbound'
      }
    },
    {
      call_id: 'vapi_call_123459',
      phone_number: '+16543210987',
      status: 'failed',
      start_time: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      end_time: new Date(Date.now() - 10790000).toISOString(),   // 2 hours 59 minutes 50 seconds ago
      duration: 10,
      metadata: {
        lead_name: 'Emily Davis',
        lead_id: 'lead-4',
        property_interest: 'Penthouse',
        vapi_assistant_id: '4bef1401-c98c-4f78-bedf-744c0c17a6e4',
        direction: 'Outbound',
        failure_reason: 'No answer'
      }
    },
    {
      call_id: 'vapi_call_123460',
      phone_number: '+15432109876',
      status: 'ended',
      start_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      end_time: new Date(Date.now() - 86100000).toISOString(),   // 23 hours 55 minutes ago
      duration: 1800, // 30 minutes
      recording_url: 'https://storage.googleapis.com/vapi-public/sample-recording-3.mp3',
      metadata: {
        lead_name: 'David Wilson',
        lead_id: 'lead-5',
        property_interest: 'Commercial',
        vapi_assistant_id: '4bef1401-c98c-4f78-bedf-744c0c17a6e4',
        direction: 'Inbound'
      }
    }
  ];

  // Sample transcript data
  const transcripts = [
    {
      call_id: 'vapi_call_123456',
      transcript: 'Hello, I\'m interested in buying a property in Dubai Marina.',
      timestamp: new Date(Date.now() - 3580000).toISOString() // 59.6 minutes ago
    },
    {
      call_id: 'vapi_call_123456',
      transcript: 'I\'m looking for a 2-bedroom apartment with a sea view.',
      timestamp: new Date(Date.now() - 3570000).toISOString() // 59.5 minutes ago
    },
    {
      call_id: 'vapi_call_123456',
      transcript: 'My budget is around 2 million AED.',
      timestamp: new Date(Date.now() - 3560000).toISOString() // 59.3 minutes ago
    },
    {
      call_id: 'vapi_call_123458',
      transcript: 'Hi, I\'m calling about the townhouse listing in Arabian Ranches.',
      timestamp: new Date(Date.now() - 7190000).toISOString() // 1 hour 59.8 minutes ago
    },
    {
      call_id: 'vapi_call_123458',
      transcript: 'I\'d like to schedule a viewing for next weekend.',
      timestamp: new Date(Date.now() - 7180000).toISOString() // 1 hour 59.6 minutes ago
    },
    {
      call_id: 'vapi_call_123460',
      transcript: 'I\'m interested in leasing a commercial space in Business Bay.',
      timestamp: new Date(Date.now() - 86390000).toISOString() // 23 hours 59.8 minutes ago
    },
    {
      call_id: 'vapi_call_123460',
      transcript: 'We need approximately 5000 square feet for our company.',
      timestamp: new Date(Date.now() - 86380000).toISOString() // 23 hours 59.6 minutes ago
    },
    {
      call_id: 'vapi_call_123460',
      transcript: 'Our budget is 1 million AED per year.',
      timestamp: new Date(Date.now() - 86370000).toISOString() // 23 hours 59.5 minutes ago
    }
  ];

  // Insert sample calls
  const { error: callsError } = await supabase.from('calls').insert(calls);
  if (callsError) {
    console.error('Error inserting sample calls:', callsError);
  } else {
    console.log('Sample calls inserted successfully');
  }

  // Insert sample transcripts
  const { error: transcriptsError } = await supabase.from('transcripts').insert(transcripts);
  if (transcriptsError) {
    console.error('Error inserting sample transcripts:', transcriptsError);
  } else {
    console.log('Sample transcripts inserted successfully');
  }

  console.log('VAPI sample data seeding complete');
}

// Execute the function
seedVapiSampleData();
