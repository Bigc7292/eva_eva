// Update VAPI phone number webhook URL
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const VAPI_API_URL = 'https://api.vapi.ai/phone-number/53cb46fd-5e37-4860-8668-7594005f872a';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const NGROK_URL = 'https://dfb7-91-73-200-83.ngrok-free.app/api/webhooks/vapi';

(async () => {
  const res = await fetch(VAPI_API_URL, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${PRIVATE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ serverUrl: NGROK_URL })
  });
  const data = await res.json();
  console.log('VAPI phone number webhook update response:', data);
})();
