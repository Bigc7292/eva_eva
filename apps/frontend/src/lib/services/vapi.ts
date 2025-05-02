/**
 * VAPI Service - Handles integration with VAPI.ai for voice calls
 * Based on VAPI documentation for full integration
 */

const VAPI_API_URL = process.env.NEXT_PUBLIC_VAPI_API_URL || 'https://api.vapi.ai';
const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY || '';
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
const PRIVATE_VAPI_API_KEY = process.env.NEXT_PRIVATE_VAPI_API_KEY;
const VAPI_PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID || 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const VAPI_CALLER_ID = process.env.NEXT_PUBLIC_VAPI_CALLER_ID || '+971565401583';
const VAPI_BASE_URL = 'https://api.vapi.ai/v1';

// Define interfaces for VAPI data types
export interface VapiCall {
  id: string;
  status: string;
  assistant_id?: string;
  phone_number_id?: string;
  to?: string;
  from?: string;
  direction?: 'inbound' | 'outbound';
  start_time?: string;
  end_time?: string;
  duration?: number;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  sentiment?: number;
  metadata?: Record<string, unknown>;
  artifact?: {
    transcript?: string;
    recording?: string;
  };
  analysis?: {
    summary?: string;
    structuredData?: {
      meetingBooked?: boolean;
      meetingTime?: string;
      [key: string]: unknown;
    };
  };
}

export interface VapiTranscript {
  id: string;
  call_id: string;
  transcript: string;
  timestamp: string;
}

export interface VapiBulkCallResult {
  successful: VapiCall[];
  failed: {
    phoneNumber: string;
    error: string;
  }[];
  total: number;
  successCount: number;
  failureCount: number;
}

// Log initialization (but not sensitive values)
console.log('Initializing VAPI service with:', {
  apiUrl: VAPI_API_URL,
  assistantId: VAPI_ASSISTANT_ID,
  publicKeyPresent: !!VAPI_API_KEY,
  privateKeyPresent: !!PRIVATE_VAPI_API_KEY,
  publicKeyValue: VAPI_API_KEY.substring(0, 5) + '...',
  assistantIdValue: VAPI_ASSISTANT_ID,
  phoneNumberId: VAPI_PHONE_NUMBER_ID,
  callerId: VAPI_CALLER_ID
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
      console.log('VAPI configuration:', {
        apiUrl: VAPI_API_URL,
        assistantId: VAPI_ASSISTANT_ID,
        publicKeyPresent: !!VAPI_API_KEY,
        publicKeyValue: VAPI_API_KEY.substring(0, 5) + '...'
      });

      const response = await fetch(`${VAPI_API_URL}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VAPI_API_KEY}`
        },
        body: JSON.stringify({
          assistant_id: VAPI_ASSISTANT_ID,
          to: phoneNumber,
          from: VAPI_CALLER_ID, // Use the Twilio number
          phone_number_id: VAPI_PHONE_NUMBER_ID, // Use the phone number ID
          metadata
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('VAPI API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
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
   * Initiate bulk calls using VAPI
   * @param phoneNumbers - Array of phone numbers to call
   * @param metadata - Optional metadata for the calls
   * @param individualMetadata - Optional metadata specific to each phone number
   * @param progressCallback - Optional callback for progress updates
   */
  async initiateBulkCalls(
    phoneNumbers: string[],
    metadata: Record<string, unknown> = {},
    individualMetadata: Record<string, Record<string, unknown>> = {},
    progressCallback?: (progress: { completed: number, total: number, current: { number: string, success: boolean } }) => void
  ): Promise<VapiBulkCallResult> {
    try {
      console.log(`Initiating bulk VAPI calls to ${phoneNumbers.length} numbers`);

      const result: VapiBulkCallResult = {
        successful: [],
        failed: [],
        total: phoneNumbers.length,
        successCount: 0,
        failureCount: 0
      };

      // Process calls in batches to avoid overwhelming the API
      const batchSize = 5; // Reduced batch size for better reliability
      let completed = 0;

      for (let i = 0; i < phoneNumbers.length; i += batchSize) {
        const batch = phoneNumbers.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(phoneNumbers.length/batchSize)}`);

        // Process each number in the batch sequentially to avoid rate limits
        for (const phoneNumber of batch) {
          try {
            // Merge common metadata with individual metadata for this number
            const mergedMetadata = {
              ...metadata,
              ...(individualMetadata[phoneNumber] || {})
            };

            const callData = await this.initiateCall(phoneNumber, mergedMetadata);
            result.successful.push(callData);
            result.successCount++;
            completed++;

            // Call progress callback if provided
            if (progressCallback) {
              progressCallback({
                completed,
                total: phoneNumbers.length,
                current: { number: phoneNumber, success: true }
              });
            }

            // Add a small delay between individual calls
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            result.failed.push({
              phoneNumber,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            result.failureCount++;
            completed++;

            // Call progress callback if provided
            if (progressCallback) {
              progressCallback({
                completed,
                total: phoneNumbers.length,
                current: { number: phoneNumber, success: false }
              });
            }

            // Log the error but continue with other numbers
            console.error(`Error calling ${phoneNumber}:`, error);
          }
        }

        // Add a delay between batches to avoid rate limiting
        if (i + batchSize < phoneNumbers.length) {
          console.log(`Waiting before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`Bulk call results: ${result.successCount} successful, ${result.failureCount} failed`);
      return result;
    } catch (error) {
      console.error('Error initiating bulk VAPI calls:', error);
      throw error;
    }
  },

  /**
   * Process a CSV file for bulk calls
   * @param file - CSV file with phone numbers
   * @param metadataFields - Optional array of column names to include as metadata
   */
  async processCsvForBulkCalls(file: File, metadataFields: string[] = []): Promise<{ phoneNumbers: string[], metadata: Record<string, Record<string, unknown>>, validationResults: { total: number, valid: number, invalid: number, errors: Array<{line: number, error: string}> } }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string;

          // Handle different line endings (\r\n, \n, \r)
          const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

          // Check if file is empty
          if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
            throw new Error('CSV file is empty');
          }

          // Parse headers - handle both comma and semicolon delimiters
          const firstLine = lines[0];
          const delimiter = firstLine.includes(';') ? ';' : ',';
          const headers = firstLine.split(delimiter).map(header => header.trim());

          // Validate headers
          if (headers.length === 0) {
            throw new Error('CSV file has no headers');
          }

          // Find the phone number column index with more flexible matching
          let phoneColumnIndex = headers.findIndex(header =>
            header.toLowerCase().includes('phone') ||
            header.toLowerCase().includes('mobile') ||
            header.toLowerCase().includes('cell') ||
            header.toLowerCase().includes('tel') ||
            header.toLowerCase().includes('number')
          );

          // If no column found with those names, use the first column as fallback
          if (phoneColumnIndex === -1) {
            console.warn('No explicit phone column found in CSV, using first column');
            phoneColumnIndex = 0;
          }

          const phoneNumbers: string[] = [];
          const metadata: Record<string, Record<string, unknown>> = {};
          const validationResults = {
            total: 0,
            valid: 0,
            invalid: 0,
            errors: [] as Array<{line: number, error: string}>
          };

          // Process each line (skip header)
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines

            validationResults.total++;

            try {
              // Handle quoted values correctly
              const values = this.parseCSVLine(lines[i], delimiter);

              // Check if we have enough values
              if (values.length < headers.length) {
                throw new Error(`Line ${i+1} has fewer values than headers`);
              }

              const phoneNumber = values[phoneColumnIndex];

              // Skip if no phone number
              if (!phoneNumber) {
                throw new Error('No phone number found');
              }

              // Format phone number (ensure it has country code)
              const formattedPhone = this.formatPhoneNumber(phoneNumber);

              // Validate phone number format
              if (!this.isValidPhoneNumber(formattedPhone)) {
                throw new Error(`Invalid phone number format: ${phoneNumber}`);
              }

              phoneNumbers.push(formattedPhone);
              validationResults.valid++;

              // Extract metadata for all columns
              const rowMetadata: Record<string, unknown> = {};

              // If specific metadata fields were requested, only include those
              if (metadataFields.length > 0) {
                metadataFields.forEach(field => {
                  const fieldIndex = headers.findIndex(header =>
                    header.toLowerCase() === field.toLowerCase()
                  );

                  if (fieldIndex !== -1 && fieldIndex < values.length && values[fieldIndex]) {
                    rowMetadata[field] = values[fieldIndex];
                  }
                });
              } else {
                // Otherwise include all columns except the phone number column
                headers.forEach((header, index) => {
                  if (index !== phoneColumnIndex && index < values.length && values[index]) {
                    rowMetadata[header] = values[index];
                  }
                });
              }

              metadata[formattedPhone] = rowMetadata;
            } catch (error) {
              validationResults.invalid++;
              validationResults.errors.push({
                line: i + 1, // 1-based line number for user-friendly reporting
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }

          // Log validation results
          console.log('CSV validation results:', validationResults);

          resolve({ phoneNumbers, metadata, validationResults });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading CSV file'));
      };

      reader.readAsText(file);
    });
  },

  /**
   * Parse a CSV line handling quoted values correctly
   * @param line - The CSV line to parse
   * @param delimiter - The delimiter character (comma or semicolon)
   */
  parseCSVLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Toggle quote state
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        // Add character to current field
        current += char;
      }
    }

    // Add the last field
    result.push(current.trim());

    return result;
  },

  /**
   * Validate a phone number format
   * @param phoneNumber - The phone number to validate
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation - should start with + and have at least 8 digits
    const phoneRegex = /^\+[0-9]{8,15}$/;
    return phoneRegex.test(phoneNumber);
  },

  /**
   * Format a phone number to ensure it has a country code
   * @param phoneNumber - The phone number to format
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // If it starts with 00, replace with +
    if (phoneNumber.startsWith('00')) {
      return '+' + digitsOnly.substring(2);
    }

    // If no country code (assuming UAE), add +971
    if (digitsOnly.length <= 10) {
      // If it starts with 0, remove the 0 before adding country code
      if (digitsOnly.startsWith('0')) {
        return '+971' + digitsOnly.substring(1);
      }
      return '+971' + digitsOnly;
    }

    // Otherwise, just add a + at the beginning
    return '+' + digitsOnly;
  },

  /**
   * Get call details from VAPI
   * @param callId - The ID of the call to retrieve
   */
  async getCallDetails(callId: string): Promise<VapiCall> {
    try {
      console.log(`Getting call details for ${callId}`);
      const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get call details: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get call details: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Call details retrieved successfully:', data);
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
   * @param filters - Optional filters for the calls
   */
  async getCalls(limit = 10, offset = 0, filters?: Record<string, string>) {
    try {
      let url = `${VAPI_API_URL}/calls?limit=${limit}&offset=${offset}`;

      // Add any filters to the URL
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          url += `&${key}=${encodeURIComponent(value)}`;
        });
      }

      const response = await fetch(url, {
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
      console.log(`Getting transcript for call ${callId}`);
      const response = await fetch(`${VAPI_API_URL}/call/${callId}/transcript`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get transcript: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get transcript: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Transcript retrieved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error getting transcript:', error);
      throw error;
    }
  },

  /**
   * Get the recording of a call
   * @param callId - The ID of the call to get the recording for
   */
  async getRecording(callId: string) {
    try {
      console.log(`Getting recording for call ${callId}`);

      // First try to get the call details which might include the recording URL
      try {
        const callDetails = await this.getCallDetails(callId);
        if (callDetails?.recording_url) {
          console.log(`Found recording URL in call details: ${callDetails.recording_url}`);
          return { url: callDetails.recording_url };
        }
      } catch (detailsError) {
        console.warn(`Could not get call details, trying recording endpoint: ${detailsError}`);
      }

      // If no recording URL in call details, try the recording endpoint
      const response = await fetch(`${VAPI_API_URL}/call/${callId}/recording`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get recording: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get recording: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Recording retrieved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error getting recording:', error);
      throw error;
    }
  },

  /**
   * Get the summary of a call
   * @param callId - The ID of the call to get the summary for
   */
  async getSummary(callId: string) {
    try {
      const response = await fetch(`${VAPI_API_URL}/call/${callId}/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
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
  },

  /**
   * Get the structured data from a call
   * @param callId - The ID of the call to get the structured data for
   */
  async getStructuredData(callId: string) {
    try {
      const response = await fetch(`${VAPI_API_URL}/call/${callId}/structured-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
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
  },

  /**
   * Initialize the VAPI Web SDK for browser-based calls
   * @returns The initialized VAPI Web SDK instance
   */
  initWebSdk() {
    // This is a placeholder - in a real implementation, you would load and initialize the VAPI Web SDK
    // Example: return new Vapi({ apiKey: VAPI_API_KEY });
    console.log('Initializing VAPI Web SDK');
    return {
      start: async (assistantId: string) => {
        console.log(`Starting web call with assistant ${assistantId}`);
        return { id: 'web-call-' + Date.now() };
      },
      on: (event: string, callback: Function) => {
        console.log(`Registered listener for ${event} event`);
      }
    };
  },

  /**
   * Register a webhook URL with VAPI
   * @param url - The webhook URL to register
   * @param events - Array of events to subscribe to
   */
  async registerWebhook(url: string, events: string[] = ['call.started', 'call.ended', 'transcript.created']) {
    try {
      // This should be called from the backend with the private API key
      console.log(`Registering webhook at ${url} for events: ${events.join(', ')}`);

      // This is just a placeholder - in a real implementation, you would call the VAPI API
      return { success: true, message: 'Webhook registered successfully' };
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw error;
    }
  }
};

/**
 * Helper function to extract meeting information from call data
 * @param callData - The call data to extract meeting information from
 */
export function extractMeetingInfo(callData: VapiCall) {
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
 * Helper function to determine if a call was successful
 * @param callData - The call data to analyze
 */
export function isCallSuccessful(callData: VapiCall) {
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
