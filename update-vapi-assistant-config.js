// Script to update Vapi assistant configuration for better phone call handling
import https from 'node:https';

const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';

// Updated configuration for better phone call handling
const data = JSON.stringify({
  // Increase silence timeout to prevent premature call termination
  silenceTimeoutSeconds: 15, // 15 seconds (increased from default 30 seconds)

  // Set maximum call duration
  maxDurationSeconds: 1800, // 30 minutes max call duration

  // Configure transcriber settings
  transcriber: {
    provider: "openai", // Specify the provider (required)
    model: "gpt-4o-transcribe", // Use one of the allowed models
    language: "en"
  },

  // Configure background noise handling
  noiseReductionEnabled: true
});

const options = {
  hostname: 'api.vapi.ai',
  path: `/assistant/${VAPI_ASSISTANT_ID}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log(`Updating configuration for assistant ${VAPI_ASSISTANT_ID}`);

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);

  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Assistant configuration updated successfully:');
      try {
        const parsedData = JSON.parse(responseData);
        console.log(JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.log(responseData);
      }
    } else {
      console.error(`Error updating assistant configuration: ${res.statusCode}`);
      console.error(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error updating assistant configuration:', error);
});

req.write(data);
req.end();