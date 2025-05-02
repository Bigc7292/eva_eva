import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // VAPI API configuration
    const VAPI_PRIVATE_KEY = process.env.NEXT_PRIVATE_VAPI_API_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
    const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
    const VAPI_PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID || 'e65a9e6b-33b7-4711-ad21-90220048e38f';

    // Make the call to VAPI API
    console.log(`Initiating call to ${phoneNumber} with VAPI...`);
    console.log('Using phone_number_id:', VAPI_PHONE_NUMBER_ID);

    // Try a different API endpoint format
    const response = await fetch('https://api.vapi.ai/v1/phone/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`
      },
      body: JSON.stringify({
        assistant_id: VAPI_ASSISTANT_ID,
        to: phoneNumber,
        from: process.env.NEXT_PUBLIC_VAPI_CALLER_ID || '+971565401583',
        phone_number_id: VAPI_PHONE_NUMBER_ID,
        webhook_url: process.env.NEXT_PUBLIC_VAPI_WEBHOOK_URL,
        name: `Call_${Date.now()}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('VAPI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to initiate call', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Store call in database using the internal API
    try {
      // Use absolute URL for server-side API calls
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';
      const dbResponse = await fetch(`${apiUrl}/api/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          metadata: {
            source: 'vapi-call-panel',
            timestamp: new Date().toISOString(),
            call_id: data.id
          }
        })
      });

      if (!dbResponse.ok) {
        console.error('Failed to store call in database');
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error making call:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
