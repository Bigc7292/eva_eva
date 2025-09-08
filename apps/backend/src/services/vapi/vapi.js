/**
 * VAPI Service - Backend integration with VAPI.ai
 * Based on VAPI documentation for full integration
 */
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

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
   * @returns {Promise<Object>} Call data
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
   * Initiate bulk calls using VAPI
   * @param {string[]} phoneNumbers - Array of phone numbers to call
   * @param {Object} metadata - Optional metadata for the calls
   * @returns {Promise<Object>} Bulk call results
   */
  async initiateBulkCalls(phoneNumbers, metadata = {}) {
    try {
      console.log(`Initiating bulk VAPI calls to ${phoneNumbers.length} numbers`);

      const result = {
        successful: [],
        failed: [],
        total: phoneNumbers.length,
        successCount: 0,
        failureCount: 0
      };

      // Process calls in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < phoneNumbers.length; i += batchSize) {
        const batch = phoneNumbers.slice(i, i + batchSize);
        const promises = batch.map(async (phoneNumber) => {
          try {
            const callData = await this.initiateCall(phoneNumber, metadata);
            result.successful.push(callData);
            result.successCount++;
            return { success: true, data: callData };
          } catch (error) {
            result.failed.push({
              phoneNumber,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            result.failureCount++;
            return { success: false, error };
          }
        });

        await Promise.all(promises);

        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < phoneNumbers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Bulk call results: ${result.successCount} successful, ${result.failureCount} failed`);
      return result;
    } catch (error) {
      console.error('Error initiating bulk VAPI calls:', error);
      throw error;
    }
  }

  /**
   * Process a CSV file for bulk calls
   * @param {string} filePath - Path to CSV file with phone numbers
   * @param {string[]} metadataFields - Optional array of column names to include as metadata
   * @returns {Promise<Object>} Processed phone numbers and metadata
   */
  async processCsvForBulkCalls(filePath, metadataFields = []) {
    try {
      console.log(`Processing CSV file for bulk calls: ${filePath}`);

      // Read the CSV file
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Parse the CSV content
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`Found ${records.length} records in CSV file`);

      // Find the phone number column
      const firstRecord = records[0];
      const headers = Object.keys(firstRecord);

      const phoneColumnName = headers.find(header =>
        header.toLowerCase().includes('phone') ||
        header.toLowerCase().includes('mobile') ||
        header.toLowerCase().includes('number')
      );

      if (!phoneColumnName) {
        throw new Error('Could not find a phone number column in the CSV');
      }

      console.log(`Using column '${phoneColumnName}' for phone numbers`);

      const phoneNumbers = [];
      const metadata = {};

      // Process each record
      for (const record of records) {
        const phoneNumber = record[phoneColumnName];

        // Skip if no phone number
        if (!phoneNumber) continue;

        // Format phone number (ensure it has country code)
        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        phoneNumbers.push(formattedPhone);

        // Extract metadata if requested
        if (metadataFields.length > 0) {
          const rowMetadata = {};

          for (const field of metadataFields) {
            if (record[field]) {
              rowMetadata[field] = record[field];
            }
          }

          metadata[formattedPhone] = rowMetadata;
        }
      }

      console.log(`Processed ${phoneNumbers.length} valid phone numbers from CSV`);
      return { phoneNumbers, metadata };
    } catch (error) {
      console.error('Error processing CSV file:', error);
      throw error;
    }
  }

  /**
   * Format a phone number to ensure it has a country code
   * @param {string} phoneNumber - The phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // If it starts with 00, replace with +
    if (phoneNumber.startsWith('00')) {
      return `+${digitsOnly.substring(2)}`;
    }

    // If no country code (assuming UAE), add +971
    if (digitsOnly.length <= 10) {
      // If it starts with 0, remove the 0 before adding country code
      if (digitsOnly.startsWith('0')) {
        return `+971${digitsOnly.substring(1)}`;
      }
      return `+971${digitsOnly}`;
    }

    // Otherwise, just add a + at the beginning
    return `+${digitsOnly}`;
  }

  /**
   * Get call details from VAPI
   * @param {string} callId - The ID of the call to retrieve
   * @returns {Promise<Object>} Call details
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
   * @param {Object} filters - Optional filters for the calls
   * @returns {Promise<Object>} List of calls
   */
  async getCalls(limit = 10, offset = 0, filters = {}) {
    try {
      let url = `${this.apiUrl}/calls?limit=${limit}&offset=${offset}`;

      // Add any filters to the URL
      for (const [key, value] of Object.entries(filters)) {
        url += `&${key}=${encodeURIComponent(value)}`;
      }

      const response = await fetch(url, {
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
   * @returns {Promise<Object>} Call end result
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
   * @returns {Promise<Object>} Call transcript
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

  /**
   * Get the recording of a call
   * @param {string} callId - The ID of the call to get the recording for
   * @returns {Promise<Object>} Call recording
   */
  async getRecording(callId) {
    try {
      const response = await fetch(`${this.apiUrl}/call/${callId}/recording`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get recording: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting recording:', error);
      throw error;
    }
  }

  /**
   * Get the summary of a call
   * @param {string} callId - The ID of the call to get the summary for
   * @returns {Promise<Object>} Call summary
   */
  async getSummary(callId) {
    try {
      const response = await fetch(`${this.apiUrl}/call/${callId}/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get summary: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting summary:', error);
      throw error;
    }
  }

  /**
   * Get the structured data from a call
   * @param {string} callId - The ID of the call to get the structured data for
   * @returns {Promise<Object>} Call structured data
   */
  async getStructuredData(callId) {
    try {
      const response = await fetch(`${this.apiUrl}/call/${callId}/structured-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get structured data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting structured data:', error);
      throw error;
    }
  }

  /**
   * Register a webhook URL with VAPI
   * @param {string} url - The webhook URL to register
   * @param {string[]} events - Array of events to subscribe to
   * @returns {Promise<Object>} Webhook registration result
   */
  async registerWebhook(url, events = ['call.started', 'call.ended', 'transcript.created']) {
    try {
      console.log(`Registering webhook at ${url} for events: ${events.join(', ')}`);

      const response = await fetch(`${this.apiUrl}/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url,
          events,
          active: true,
          description: 'Top Loader Agent AI Solutions webhook for call events'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to register webhook: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Webhook registered successfully:', data);
      return data;
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw error;
    }
  }

  /**
   * Extract meeting information from call data
   * @param {Object} callData - The call data to extract meeting information from
   * @returns {Object} Meeting information
   */
  extractMeetingInfo(callData) {
    const structuredData = callData.analysis?.structuredData;

    if (structuredData?.meetingBooked) {
      return {
        meetingBooked: true,
        meetingTime: structuredData.meetingTime,
        // Extract any other relevant meeting information
      };
    }

    return { meetingBooked: false };
  }

  /**
   * Determine if a call was successful
   * @param {Object} callData - The call data to analyze
   * @returns {Object} Call success information
   */
  isCallSuccessful(callData) {
    // Check if the call has a summary or transcript
    const hasContent = !!(callData.summary || callData.transcript ||
                        callData.artifact?.transcript ||
                        callData.analysis?.summary);

    // Check if the call was completed
    const isCompleted = callData.status === 'completed' || callData.status === 'ended';

    // Check if a meeting was booked
    const meetingBooked = callData.analysis?.structuredData?.meetingBooked === true;

    return {
      hasContent,
      isCompleted,
      meetingBooked,
      isSuccessful: isCompleted && hasContent
    };
  }
}

console.log('Creating VAPI service instance...');
export const vapiService = new VapiService();
