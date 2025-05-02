/**
 * Update VAPI webhook URL using fetch API
 */

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Private key for admin operations
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';

// Set the ngrok URL
const ngrokUrl = 'https://03d5-80-227-84-38.ngrok-free.app';
const webhookUrl = `${ngrokUrl}/api/webhooks/vapi`;

console.log('Starting webhook update...');
console.log('Using ngrok URL:', ngrokUrl);
console.log('Setting webhook URL to:', webhookUrl);

// Main function
async function main() {
  try {
    // Import fetch
    const fetch = (await import('node-fetch')).default;
    
    // Update assistant webhook URL
    console.log('Updating assistant webhook URL...');
    const assistantResponse = await fetch(`${VAPI_API_URL}/v1/assistants/${VAPI_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        webhook_url: webhookUrl
      })
    });
    
    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      console.error(`Failed to update assistant webhook URL: ${assistantResponse.status}`);
      console.error(`Error details: ${errorText}`);
    } else {
      const assistantData = await assistantResponse.json();
      console.log('✅ Assistant webhook URL updated successfully');
      console.log('Response:', assistantData);
    }
    
    // Update phone number webhook URL
    console.log('Updating phone number webhook URL...');
    const phoneResponse = await fetch(`${VAPI_API_URL}/v1/phone_numbers/${PHONE_NUMBER_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        webhook_url: webhookUrl
      })
    });
    
    if (!phoneResponse.ok) {
      const errorText = await phoneResponse.text();
      console.error(`Failed to update phone number webhook URL: ${phoneResponse.status}`);
      console.error(`Error details: ${errorText}`);
    } else {
      const phoneData = await phoneResponse.json();
      console.log('✅ Phone number webhook URL updated successfully');
      console.log('Response:', phoneData);
    }
    
    console.log('\n=== VAPI Webhook Setup Complete ===');
    console.log(`Your webhook URL is: ${webhookUrl}`);
  } catch (error) {
    console.error('Error updating webhook URLs:', error);
  }
}

// Run the main function
main();
