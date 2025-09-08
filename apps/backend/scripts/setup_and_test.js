import fetch from 'node-fetch';

async function checkAndSetupSystem() {
  try {
    console.log('1. Checking agent status...');
    const agentResponse = await fetch(`https://api.retellai.com/v2/agents/${encodeURIComponent('agent_1fb1845b5bd5dcf52092c82ad8')}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer key_49d0acc0302b82c8928f4ec589c1'
      }
    });

    if (!agentResponse.ok) {
      throw new Error('Agent not found or not active');
    }

    console.log('2. Checking phone number configuration...');
    const phoneResponse = await fetch('https://api.retellai.com/v2/phone-numbers', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer key_49d0acc0302b82c8928f4ec589c1'
      }
    });

    if (!phoneResponse.ok) {
      throw new Error('Could not verify phone number configuration');
    }

    console.log('3. Making test call...');
    const callResponse = await fetch('https://api.retellai.com/v2/register-phone-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer key_49d0acc0302b82c8928f4ec589c1'
      },
      body: JSON.stringify({
        from_number: '+13433149954',
        to_number: '+971565401583',
        agent_id: 'agent_1fb1845b5bd5dcf52092c82ad8',
        sip_domain: 'sip:retellaisip.sip.twilio.com',
        debug_mode: true,
        direction: 'outbound',
        call_type: 'phone_call',
        webhook_url: 'https://api.retellai.com/v2/webhooks/twilio',
        webhook_auth_key: 'key_624394f66fb8fcd21ac217080833'
      })
    });

    const callData = await callResponse.json();
    console.log('Call initiated:', JSON.stringify(callData, null, 2));

    // Monitor call status
    console.log('4. Monitoring call status...');
    let attempts = 0;
    const checkStatus = async () => {
      if (attempts >= 5) return;
      attempts++;

      const statusResponse = await fetch(`https://api.retellai.com/v2/calls/${callData.call_id}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer key_49d0acc0302b82c8928f4ec589c1'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Status check ${attempts}:`, JSON.stringify(statusData, null, 2));
      }

      setTimeout(checkStatus, 3000);
    };

    checkStatus();

  } catch (error) {
    console.error('Setup error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name
    });
  }
}

checkAndSetupSystem(); 