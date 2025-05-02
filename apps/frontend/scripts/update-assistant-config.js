// Script to update Vapi assistant configuration for better phone call handling
const https = require('https');

const VAPI_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';

// Updated configuration for better phone call handling
const data = JSON.stringify({
  // Increase silence timeout to prevent premature call termination
  silence_timeout_ms: 10000, // 10 seconds (default is often 5 seconds)
  
  // Adjust speech recognition settings
  speech_recognition_settings: {
    model: "whisper-large-v3", // Use the most accurate model
    language: "en",
    temperature: 0.0, // Lower temperature for more accurate transcription
    response_format: "verbose_json", // Get detailed transcription info
    vad_filter: true, // Voice activity detection to filter out background noise
    vad_threshold: 0.3 // Lower threshold to pick up more speech
  },
  
  // Adjust call settings
  call_settings: {
    max_duration_seconds: 1800, // 30 minutes max call duration
    end_call_on_silence: false, // Don't end call on silence
    end_call_after_completion: false // Don't end call after assistant completes response
  }
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
