import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phoneNumbers } = await request.json();

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Valid phone numbers array is required' },
        { status: 400 }
      );
    }

    // VAPI API configuration
    const VAPI_PRIVATE_KEY = process.env.NEXT_PRIVATE_VAPI_API_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
    const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
    const VAPI_PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID || 'e65a9e6b-33b7-4711-ad21-90220048e38f';

    // Process calls in batches to avoid rate limiting
    const batchSize = 5;
    const results = [];

    // Process phone numbers in batches
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, Math.min(i + batchSize, phoneNumbers.length));
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(phoneNumbers.length/batchSize)}`);

      const batchPromises = batch.map(async (phoneNumber) => {
        try {
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
              name: `BulkCall_${Date.now()}_${Math.floor(Math.random() * 1000)}`
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`VAPI API error for ${phoneNumber}:`, errorData);
            return { error: true, phoneNumber, details: errorData };
          }

          const data = await response.json();

          // Store call in database using the internal API
          try {
            // Use absolute URL for server-side API calls
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';
            await fetch(`${apiUrl}/api/calls`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                phoneNumber: phoneNumber,
                metadata: {
                  source: 'vapi-bulk-call-panel',
                  timestamp: new Date().toISOString(),
                  call_id: data.id,
                  batch: Math.floor(i/batchSize) + 1
                }
              })
            });
          } catch (dbError) {
            console.error('Database error:', dbError);
          }

          return { ...data, phoneNumber };
        } catch (error) {
          console.error(`Error making call to ${phoneNumber}:`, error);
          return { error: true, phoneNumber, message: 'Failed to initiate call' };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add a delay between batches to avoid rate limiting
      if (i + batchSize < phoneNumbers.length) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Filter out successful calls
    const successfulCalls = results.filter(result => !result.error);

    return NextResponse.json(successfulCalls);
  } catch (error) {
    console.error('Error making bulk calls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
