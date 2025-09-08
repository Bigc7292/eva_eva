import fetch from 'node-fetch';

async function makeTestCall() {
  try {
    console.log('Starting call attempt...');
    
    const callData = {
      from_number: '+13433149954',
      to_number: '+971565401583',
      agent_id: 'agent_1fb1845b5bd5dcf52092c82ad8',
      sip_domain: 'sip:retellaisip.sip.twilio.com',
      debug_mode: true,
      direction: 'outbound',
      call_type: 'phone_call',
      metadata: {
        test_call: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log('Call request data:', JSON.stringify(callData, null, 2));

    const response = await fetch('https://api.retellai.com/v2/register-phone-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer key_49d0acc0302b82c8928f4ec589c1'
      },
      body: JSON.stringify(callData)
    });

    const responseText = await response.text();
    console.log('Raw API Response:', responseText);

    if (!response.ok) {
      console.error('API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });
      return;
    }

    const data = JSON.parse(responseText);
    console.log('Call successfully initiated:', JSON.stringify(data, null, 2));
    console.log('Call ID:', data.call_id);
    
    // Wait a few seconds and check call status
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusResponse = await fetch(`https://api.retellai.com/v2/calls/${data.call_id}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer key_49d0acc0302b82c8928f4ec589c1'
      }
    });
    
    const statusData = await statusResponse.json();
    console.log('Call status after 5 seconds:', JSON.stringify(statusData, null, 2));

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

makeTestCall(); 