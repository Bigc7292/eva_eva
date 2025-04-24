import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get Vapi configuration from environment variables
    const publicKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    const privateKey = process.env.NEXT_PRIVATE_VAPI_API_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    const phoneNumberId = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID;
    const apiUrl = process.env.NEXT_PUBLIC_VAPI_API_URL || 'https://api.vapi.ai';

    // Check if required configuration is present
    const missingConfig = [];
    if (!publicKey) missingConfig.push('NEXT_PUBLIC_VAPI_API_KEY');
    if (!privateKey) missingConfig.push('NEXT_PRIVATE_VAPI_API_KEY');
    if (!assistantId) missingConfig.push('NEXT_PUBLIC_VAPI_ASSISTANT_ID');
    if (!phoneNumberId) missingConfig.push('NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID');

    if (missingConfig.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required Vapi configuration: ${missingConfig.join(', ')}`,
          publicKey,
          privateKey: privateKey ? true : false,
          assistantId,
          phoneNumberId
        },
        { status: 400 }
      );
    }

    // Check if the public API key is valid by making a request to the Vapi API
    const response = await fetch(`${apiUrl}/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Vapi API error:', errorData);
      return NextResponse.json(
        { 
          error: errorData.message || 'Failed to validate Vapi configuration',
          publicKey,
          privateKey: privateKey ? true : false,
          assistantId,
          phoneNumberId
        },
        { status: response.status }
      );
    }

    const assistantData = await response.json();

    // Return the configuration
    return NextResponse.json({
      publicKey,
      privateKey: privateKey ? true : false,
      assistantId,
      phoneNumberId,
      assistantName: assistantData.name,
      assistantStatus: assistantData.status
    });
  } catch (error) {
    console.error('Error checking Vapi configuration:', error);
    return NextResponse.json(
      { error: 'Failed to check Vapi configuration' },
      { status: 500 }
    );
  }
}
