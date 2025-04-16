/**
 * VAPI Service - Backend integration with VAPI.ai
 */
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Initializing VAPI service...');

class VapiService {
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_VAPI_API_URL || 'https://api.vapi.ai';
    this.apiKey = process.env.NEXT_PRIVATE_VAPI_API_KEY || process.env.NEXT_PUBLIC_VAPI_API_KEY;
    this.assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    
    console.log('VAPI service initialized with:', {
      apiUrl: this.apiUrl,
      assistantId: this.assistantId,
      apiKeyPresent: !!this.apiKey
    });
    
    if (!this.apiKey || !this.assistantId) {
      console.error('Missing required VAPI environment variables');
    }
  }

  /**
   * Initiate a call using VAPI
   * @param {string} phoneNumber - The phone number to call
   * @param {Object} metadata - Optional metadata for the call
   */
  async initiateCall(phoneNumber, metadata = {}) {
    try {
      console.log(`Initiating VAPI call to ${phoneNumber}`);
      
      const response = await fetch(`${this.apiUrl}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          assistant_id: this.assistantId,
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
  }

  /**
   * Get call details from VAPI
   * @param {string} callId - The ID of the call to retrieve
   */
  async getCallDetails(callId) {
    try {
      const response = await fetch(`${this.apiUrl}/call/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
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
  }

  /**
   * Get all calls from VAPI
   * @param {number} limit - Optional limit for the number of calls to retrieve
   * @param {number} offset - Optional offset for pagination
   */
  async getCalls(limit = 10, offset = 0) {
    try {
      const response = await fetch(`${this.apiUrl}/calls?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
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
  }

  /**
   * End an active call
   * @param {string} callId - The ID of the call to end
   */
  async endCall(callId) {
    try {
      const response = await fetch(`${this.apiUrl}/call/${callId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
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
  }

  /**
   * Get the transcript of a call
   * @param {string} callId - The ID of the call to get the transcript for
   */
  async getTranscript(callId) {
    try {
      const response = await fetch(`${this.apiUrl}/call/${callId}/transcript`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
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
}

console.log('Creating VAPI service instance...');
export const vapiService = new VapiService();
