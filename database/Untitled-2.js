// Example: Fetch VAPI data using axios
const axios = require('axios');

async function fetchVapiLeads() {
  const response = await axios.get('https://api.vapi.com/leads', {
    headers: { Authorization: 'd1529b85-51d5-47c0-9332-a73d40f7d62b' }
  });
  return response.data;
}