/**
 * Call Poller Service - Actively polls for call data to speed up data retrieval
 */
import { vapiService } from './vapi';
import { supabaseClient } from '../supabase';

// Map to store active polling intervals
const activePolls = new Map<string, { 
  intervalId: NodeJS.Timeout, 
  attempts: number,
  lastStatus: string
}>();

// Cache for call data to avoid unnecessary database queries
const callDataCache = new Map<string, any>();

/**
 * Call Poller Service
 */
export const callPollerService = {
  /**
   * Start polling for call data
   * @param callId - The ID of the call to poll for
   * @param intervalMs - Polling interval in milliseconds (default: 2000)
   * @param maxAttempts - Maximum number of polling attempts (default: 30)
   */
  startPolling(callId: string, intervalMs = 2000, maxAttempts = 30) {
    // Don't start polling if already polling for this call
    if (activePolls.has(callId)) {
      console.log(`Already polling for call ${callId}`);
      return;
    }

    console.log(`Starting polling for call ${callId} every ${intervalMs}ms, max ${maxAttempts} attempts`);
    
    let attempts = 0;
    
    const intervalId = setInterval(async () => {
      attempts++;
      
      try {
        // Fetch call data directly from VAPI
        const callData = await vapiService.getCallDetails(callId);
        
        // Update cache
        callDataCache.set(callId, callData);
        
        // Check if call has ended and has summary/transcript
        if (callData.status === 'ended' || callData.status === 'completed') {
          console.log(`Call ${callId} has ended, processing data...`);
          
          // Process the call data
          await this.processCompletedCall(callId, callData);
          
          // Stop polling if we have all the data we need
          if (callData.transcript && callData.recording_url && callData.summary) {
            console.log(`Call ${callId} has all required data, stopping polling`);
            this.stopPolling(callId);
          } else if (activePolls.get(callId)?.lastStatus !== callData.status) {
            // Status changed, update database with current data
            console.log(`Call ${callId} status changed to ${callData.status}, updating database`);
            await this.updateCallInDatabase(callId, callData);
            
            // Update last status
            const pollInfo = activePolls.get(callId);
            if (pollInfo) {
              activePolls.set(callId, { ...pollInfo, lastStatus: callData.status });
            }
          }
        }
      } catch (error) {
        console.error(`Error polling call data for ${callId}:`, error);
      }
      
      // Stop polling after max attempts
      if (attempts >= maxAttempts) {
        console.log(`Stopped polling for ${callId} after ${maxAttempts} attempts`);
        this.stopPolling(callId);
      }
    }, intervalMs);
    
    // Store interval ID and initial attempts count
    activePolls.set(callId, { 
      intervalId, 
      attempts: 0,
      lastStatus: 'unknown'
    });
    
    return intervalId;
  },
  
  /**
   * Stop polling for call data
   * @param callId - The ID of the call to stop polling for
   */
  stopPolling(callId: string) {
    const pollInfo = activePolls.get(callId);
    
    if (pollInfo) {
      clearInterval(pollInfo.intervalId);
      activePolls.delete(callId);
      console.log(`Stopped polling for call ${callId}`);
    }
  },
  
  /**
   * Process completed call data
   * @param callId - The ID of the call
   * @param callData - The call data from VAPI
   */
  async processCompletedCall(callId: string, callData: any) {
    try {
      // Update the call record in the database
      await this.updateCallInDatabase(callId, callData);
      
      // Fetch additional data if needed
      if (!callData.transcript) {
        try {
          const transcriptData = await vapiService.getTranscript(callId);
          if (transcriptData?.transcript) {
            callData.transcript = transcriptData.transcript;
            await this.updateCallInDatabase(callId, { transcript: transcriptData.transcript });
          }
        } catch (error) {
          console.warn(`Could not fetch transcript for call ${callId}:`, error);
        }
      }
      
      if (!callData.recording_url) {
        try {
          const recordingData = await vapiService.getRecording(callId);
          if (recordingData?.url) {
            callData.recording_url = recordingData.url;
            await this.updateCallInDatabase(callId, { recording_url: recordingData.url });
          }
        } catch (error) {
          console.warn(`Could not fetch recording for call ${callId}:`, error);
        }
      }
      
      if (!callData.summary && !callData.analysis?.summary) {
        try {
          const summaryData = await vapiService.getSummary(callId);
          if (summaryData?.summary) {
            callData.summary = summaryData.summary;
            await this.updateCallInDatabase(callId, { summary: summaryData.summary });
          }
        } catch (error) {
          console.warn(`Could not fetch summary for call ${callId}:`, error);
        }
      }
      
      // Update cache with the latest data
      callDataCache.set(callId, callData);
      
      console.log(`Processed completed call ${callId}`);
      return callData;
    } catch (error) {
      console.error(`Error processing completed call ${callId}:`, error);
      throw error;
    }
  },
  
  /**
   * Update call record in the database
   * @param callId - The ID of the call
   * @param callData - The call data to update
   */
  async updateCallInDatabase(callId: string, callData: any) {
    try {
      // Prepare update data
      const updateData: any = {};
      
      // Map VAPI status to our status format
      if (callData.status) {
        updateData.call_status = callData.status === 'ended' || callData.status === 'completed' 
          ? 'Completed' 
          : callData.status;
      }
      
      // Add end time if available
      if (callData.end_time || callData.endedAt) {
        updateData.end_time = callData.end_time || callData.endedAt;
      }
      
      // Add duration if available
      if (callData.duration || callData.durationSeconds) {
        updateData.duration = callData.duration || callData.durationSeconds;
      }
      
      // Add recording URL if available
      if (callData.recording_url || callData.recordingUrl) {
        updateData.recording_url = callData.recording_url || callData.recordingUrl;
        updateData.audio_url = callData.recording_url || callData.recordingUrl;
      }
      
      // Add transcript if available
      if (callData.transcript) {
        updateData.transcript = callData.transcript;
      }
      
      // Add summary if available
      if (callData.summary || callData.analysis?.summary) {
        updateData.summary = callData.summary || callData.analysis?.summary;
      }
      
      // Only update if we have data to update
      if (Object.keys(updateData).length > 0) {
        // Get current call data to merge metadata properly
        const { data: existingCall, error: fetchError } = await supabaseClient
          .from('calls')
          .select('metadata')
          .eq('call_id', callId)
          .single();
        
        if (fetchError) {
          console.error(`Error fetching existing call data for ${callId}:`, fetchError);
        } else if (existingCall) {
          // Merge metadata
          updateData.metadata = {
            ...existingCall.metadata,
            ...callData
          };
          
          // Update the call record
          const { error: updateError } = await supabaseClient
            .from('calls')
            .update(updateData)
            .eq('call_id', callId);
          
          if (updateError) {
            console.error(`Error updating call ${callId}:`, updateError);
          } else {
            console.log(`Updated call ${callId} in database with:`, Object.keys(updateData));
            
            // If we have contact_id and the call is completed, update the contact record
            if (existingCall.contact_id && (updateData.call_status === 'Completed')) {
              await this.updateContactWithCallData(existingCall.contact_id, callId, callData);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error updating call ${callId} in database:`, error);
    }
  },
  
  /**
   * Update contact record with call data
   * @param contactId - The ID of the contact
   * @param callId - The ID of the call
   * @param callData - The call data
   */
  async updateContactWithCallData(contactId: string, callId: string, callData: any) {
    try {
      // Get current contact data
      const { data: contactData, error: contactError } = await supabaseClient
        .from('contacts')
        .select('transcripts, summaries, audio_files, call_stats')
        .eq('contact_id', contactId)
        .single();
      
      if (contactError) {
        console.error(`Error fetching contact data for ${contactId}:`, contactError);
        return;
      }
      
      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Add transcript if available
      if (callData.transcript) {
        const transcriptEntry = {
          call_id: callId,
          timestamp: callData.start_time || callData.startedAt || new Date().toISOString(),
          text: callData.transcript
        };
        
        const existingTranscripts = contactData.transcripts || [];
        updateData.transcripts = [...existingTranscripts, transcriptEntry];
      }
      
      // Add summary if available
      if (callData.summary || callData.analysis?.summary) {
        const summaryEntry = {
          call_id: callId,
          timestamp: callData.start_time || callData.startedAt || new Date().toISOString(),
          text: callData.summary || callData.analysis?.summary
        };
        
        const existingSummaries = contactData.summaries || [];
        updateData.summaries = [...existingSummaries, summaryEntry];
      }
      
      // Add audio file if available
      if (callData.recording_url || callData.recordingUrl) {
        const audioEntry = {
          call_id: callId,
          timestamp: callData.start_time || callData.startedAt || new Date().toISOString(),
          url: callData.recording_url || callData.recordingUrl
        };
        
        const existingAudioFiles = contactData.audio_files || [];
        updateData.audio_files = [...existingAudioFiles, audioEntry];
      }
      
      // Update call stats
      const callStats = contactData.call_stats || {};
      updateData.call_stats = {
        ...callStats,
        last_call_date: new Date().toISOString(),
        last_call_status: 'completed'
      };
      
      // Only update if we have data to update
      if (Object.keys(updateData).length > 1) { // More than just updated_at
        const { error: updateError } = await supabaseClient
          .from('contacts')
          .update(updateData)
          .eq('contact_id', contactId);
        
        if (updateError) {
          console.error(`Error updating contact ${contactId}:`, updateError);
        } else {
          console.log(`Updated contact ${contactId} with call data from ${callId}`);
        }
      }
    } catch (error) {
      console.error(`Error updating contact with call data:`, error);
    }
  },
  
  /**
   * Get cached call data
   * @param callId - The ID of the call
   */
  getCachedCallData(callId: string) {
    return callDataCache.get(callId);
  },
  
  /**
   * Clear cached call data
   * @param callId - The ID of the call (optional, if not provided all cache is cleared)
   */
  clearCachedCallData(callId?: string) {
    if (callId) {
      callDataCache.delete(callId);
    } else {
      callDataCache.clear();
    }
  }
};
