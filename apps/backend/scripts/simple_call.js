import fetch from 'node-fetch';

async function makeCall() {
  try {
    console.log('Starting call with RetellAI...');
    const response = await fetch('https://api.retellai.com/v2/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer key_624394f66fb8fcd21ac217080833'
      },
      body: JSON.stringify({
        from_number: '+13433149954',
        to_number: '+971565401583',
        agent_id: 'agent_1fb1845b5bd5dcf52092c82ad8',
        conversation_flow_id: 'conversation_flow_26e9483fc541',
        sip_domain: 'sip:retellaisip.sip.twilio.com',
        webhook_url: 'https://api.retellai.com/v2/webhooks/twilio',
        webhook_auth_key: 'key_624394f66fb8fcd21ac217080833',
        debug_mode: true,
        direction: 'outbound',
        call_type: 'phone_call',
        timeout_seconds: 60,
        retry_attempts: 2,
        secure_media: true,
        transport: 'tls',
        metadata: {
          test_call: true,
          timestamp: new Date().toISOString()
        }
      })
    });

    const responseText = await response.text();
    console.log('\nRaw Response:', responseText);

    if (!response.ok) {
      console.error('Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      return;
    }

    try {
      const data = JSON.parse(responseText);
      console.log('\nCall initiated:', JSON.stringify(data, null, 2));

      // Monitor call status
      console.log('\nMonitoring call status...');
      for (let i = 1; i <= 12; i++) {
        console.log(`\nStatus check ${i}...`);
        const statusResponse = await fetch(`https://api.retellai.com/v2/call/${data.call_id}/status`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer key_624394f66fb8fcd21ac217080833'
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('Current status:', statusData.call_status);
          
          if (statusData.call_status === 'in_progress') {
            console.log('Call is now connected!');
          } else if (statusData.call_status === 'completed') {
            console.log('Call completed successfully!');
            break;
          } else if (statusData.call_status === 'failed') {
            console.log('Call failed:', statusData.error_details || 'No error details available');
            break;
          }
        } else {
          console.log('Status check failed:', await statusResponse.text());
        }

        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

makeCall(); 