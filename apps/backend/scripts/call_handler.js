import fetch from 'node-fetch';
import twilio from 'twilio';
import { config } from './config.js';

// Initialize Twilio client
const twilioClient = twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

async function makeCallWithPostHandling() {
  try {
    console.log('Starting secure call with RetellAI and Twilio integration...');
    
    // Step 1: Register call with RetellAI
    const retellResponse = await fetch('https://api.retellai.com/v2/register-phone-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.retell.apiKey}`
      },
      body: JSON.stringify({
        from_number: config.phone.fromNumber,
        to_number: config.phone.toNumber,
        agent_id: config.retell.agentId,
        conversation_flow_id: config.retell.conversationFlowId,
        sip_domain: `sip:${config.twilio.sipDomain}`,
        webhook_url: config.retell.webhookUrl,
        webhook_auth_key: config.retell.apiKey,
        debug_mode: true,
        direction: 'outbound',
        call_type: 'phone_call',
        timeout_seconds: 120,
        retry_attempts: 3,
        secure_media: true,
        transport: 'tls',
        metadata: {
          test_call: true,
          timestamp: new Date().toISOString(),
          flow_enabled: true,
          secure: true
        }
      })
    });

    const retellData = await retellResponse.json();
    console.log('RetellAI Call Registration:', JSON.stringify(retellData, null, 2));

    // Step 2: Monitor call status and handle post-call actions
    let callCompleted = false;
    let attempts = 0;
    const maxAttempts = 24;

    while (!callCompleted && attempts < maxAttempts) {
      attempts++;
      console.log(`\nStatus check ${attempts}/${maxAttempts}...`);

      const statusResponse = await fetch(
        `https://api.retellai.com/v2/phone-call/${retellData.call_id}?include_transcripts=true`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.retell.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Call Status Update:', JSON.stringify(statusData, null, 2));

        if (statusData.call_status === 'completed') {
          callCompleted = true;
          
          // Step 3: Post-call handling with Twilio
          try {
            // Get call recording if available
            const recordings = await twilioClient.recordings.list({
              callSid: statusData.twilio_call_sid
            });

            if (recordings.length > 0) {
              console.log('Call Recording URL:', recordings[0].mediaUrl);
              
              // You can download or process the recording here
              // Example: Save recording URL to your database
            }

            // Get call details from Twilio
            const call = await twilioClient.calls(statusData.twilio_call_sid).fetch();
            console.log('Call Duration:', call.duration, 'seconds');
            console.log('Call Status:', call.status);
            console.log('Call Price:', call.price);

            // Additional post-call processing
            console.log('Call Summary:');
            console.log('- Start Time:', call.startTime);
            console.log('- End Time:', call.endTime);
            console.log('- Direction:', call.direction);
            console.log('- From:', call.from);
            console.log('- To:', call.to);

          } catch (twilioError) {
            console.error('Twilio post-call handling error:', twilioError.message);
          }
        } else if (['failed', 'disconnected'].includes(statusData.call_status)) {
          console.log('Call ended with status:', statusData.call_status);
          if (statusData.disconnection_reason) {
            console.log('Disconnection reason:', statusData.disconnection_reason);
          }
          break;
        }
      }

      if (!callCompleted) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
      }
    }

  } catch (error) {
    console.error('Error in call handling:', error.message);
  }
}

// Start the call process
makeCallWithPostHandling(); 