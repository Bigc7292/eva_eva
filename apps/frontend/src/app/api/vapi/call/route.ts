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
    const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
    const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
    const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || 'e65a9e6b-33b7-4711-ad21-90220048e38f';

    // Make the call to VAPI API
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`
      },
      body: JSON.stringify({
        type: 'outboundPhoneCall',
        assistantId: VAPI_ASSISTANT_ID,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: phoneNumber
        },
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

    // Store call in database
    try {
      const dbResponse = await fetch('http://localhost:3004/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lead_id: null, // Will be updated by webhook
          call_external_id: data.id,
          duration: 0,
          answered: false,
          outcome: 'pending',
          cost: 0,
          recording_url: '',
          transcript: '',
          summary: ''
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
