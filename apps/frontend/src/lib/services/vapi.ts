/**
 * VAPI Service - Handles integration with VAPI.ai for voice calls
 */

const VAPI_API_URL = process.env.NEXT_PUBLIC_VAPI_API_URL || 'https://api.vapi.ai';
const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY || '';
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
const PRIVATE_VAPI_API_KEY = process.env.NEXT_PRIVATE_VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai/v1';

export interface VapiCall {
  id: string;
  status: string;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  sentiment?: number;
}

// Log initialization (but not sensitive values)
console.log('Initializing VAPI service with:', {
  apiUrl: VAPI_API_URL,
  assistantId: VAPI_ASSISTANT_ID,
  publicKeyPresent: !!VAPI_API_KEY,
  privateKeyPresent: !!PRIVATE_VAPI_API_KEY
});

// Validate required environment variables
if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID) {
  console.error('Missing required VAPI environment variables');
}

/**
 * VAPI Service for handling voice calls
 */
export const vapiService = {
  /**
   * Initiate a call using VAPI
   * @param phoneNumber - The phone number to call
   * @param metadata - Optional metadata for the call
   */
  async initiateCall(phoneNumber: string, metadata: Record<string, unknown> = {}) {
    try {
      console.log(`Initiating VAPI call to ${phoneNumber}`);

      const response = await fetch(`${VAPI_API_URL}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VAPI_API_KEY}`
        },
        body: JSON.stringify({
          assistant_id: VAPI_ASSISTANT_ID,
          to: phoneNumber,
          metadata
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`VAPI call failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('VAPI call initiated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error initiating VAPI call:', error);
      throw error;
    }
  },

  /**
   * Get call details from VAPI
   * @param callId - The ID of the call to retrieve
   */
  async getCallDetails(callId: string) {
    try {
      const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get call details: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting call details:', error);
      throw error;
    }
  },

  /**
   * Get all calls from VAPI
   * @param limit - Optional limit for the number of calls to retrieve
   * @param offset - Optional offset for pagination
   */
  async getCalls(limit = 10, offset = 0) {
    try {
      const response = await fetch(`${VAPI_API_URL}/calls?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get calls: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting calls:', error);
      throw error;
    }
  },

  /**
   * End an active call
   * @param callId - The ID of the call to end
   */
  async endCall(callId: string) {
    try {
      const response = await fetch(`${VAPI_API_URL}/call/${callId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to end call: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  },

  /**
   * Get the transcript of a call
   * @param callId - The ID of the call to get the transcript for
   */
  async getTranscript(callId: string) {
    try {
      const response = await fetch(`${VAPI_API_URL}/call/${callId}/transcript`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get transcript: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting transcript:', error);
      throw error;
    }
  }
};

/**
 * Initiate a call using VAPI
 * @param phoneNumber - The phone number to call
 * @param leadId - The lead ID associated with the call
 */
export async function initiateCall(phoneNumber: string, leadId: string) {
  const response = await fetch(`${VAPI_BASE_URL}/calls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: phoneNumber,
      lead_id: leadId,
    }),
  });

  return await response.json();
}

/**
 * Get call details from VAPI
 * @param callId - The ID of the call to retrieve
 */
export async function getCallDetails(callId: string): Promise<VapiCall> {
  const response = await fetch(`${VAPI_BASE_URL}/calls/${callId}`, {
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
    },
  });

  return await response.json();
}
