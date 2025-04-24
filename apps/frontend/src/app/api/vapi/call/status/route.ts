import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get call ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const callId = searchParams.get('id');

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    // VAPI API configuration
    const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY || 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8';
    const VAPI_API_URL = process.env.NEXT_PUBLIC_VAPI_API_URL || 'https://api.vapi.ai';

    // Get call status from VAPI API
    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('VAPI API error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to get call status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Log the response for debugging
    console.log('VAPI call status response:', {
      id: data.id,
      status: data.status,
      duration: data.duration,
      created_at: data.created_at
    });

    // Return the call status
    return NextResponse.json({
      id: data.id,
      status: data.status,
      duration: data.duration,
      created_at: data.created_at,
      customer: data.customer,
      assistant_id: data.assistant_id
    });
  } catch (error) {
    console.error('Error getting call status:', error);
    return NextResponse.json(
      { error: 'Failed to get call status' },
      { status: 500 }
    );
  }
}
