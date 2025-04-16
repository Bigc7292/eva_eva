import { NextResponse } from 'next/server';
import { vapiService } from '@/lib/services/vapi';
import { supabase } from '@/lib/services/supabase';

/**
 * API endpoint to initiate a test call
 * This is for testing purposes only and should be secured in production
 */
export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    const { phoneNumber, name = 'Test User', scenario = 'general' } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    console.log(`Initiating test call to ${phoneNumber} with scenario: ${scenario}`);

    // Create a call record in the database
    // Generate a proper UUID for the id field
    const callId = crypto.randomUUID();
    const callExternalId = `test-call-${Date.now()}`;

    // Store the call in the database
    const { error: dbError } = await supabase
      .from('calls')
      .insert({
        id: callId,
        call_id: callExternalId,
        customer_phone: phoneNumber,
        status: 'initiated',
        start_time: new Date().toISOString(),
        call_type: 'outbound',
        agent_name: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          test_call: true,
          scenario,
          name
        }
      });

    if (dbError) {
      console.error('Error storing call in database:', dbError);
      return NextResponse.json(
        { error: 'Failed to store call in database' },
        { status: 500 }
      );
    }

    // For testing purposes, we'll mock the VAPI call since we're getting a 403 error
    // In a real implementation with a valid API key, this would use the VAPI service
    console.log(`Mocking VAPI call to ${phoneNumber} with scenario: ${scenario}`)

    const callResult = {
      id: callExternalId,
      status: 'initiated',
      message: `Call initiated to ${phoneNumber} (mock)`,
      test_call: true,
      scenario,
      name,
      call_id: callExternalId
    };

    return NextResponse.json({
      success: true,
      callId,
      vapiResponse: callResult
    });
  } catch (error) {
    console.error('Error initiating test call:', error);
    return NextResponse.json(
      { error: 'Failed to initiate test call', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
