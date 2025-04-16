// Script to fetch real data from VAPI and store it in Supabase
import { vapiService } from '../lib/services/vapi';
import { supabase } from '../lib/services/supabase';

async function fetchAndStoreVapiData() {
  try {
    console.log('Fetching real data from VAPI...');
    
    // Fetch recent calls from VAPI (limit to a small amount)
    const vapiCalls = await vapiService.getCalls(5, 0);
    console.log(`Retrieved ${vapiCalls.length} calls from VAPI`);
    
    // Process and store each call in Supabase
    for (const call of vapiCalls) {
      console.log(`Processing call ${call.id}...`);
      
      // Store call data
      const { error: callError } = await supabase
        .from('calls')
        .upsert({
          call_id: call.id,
          phone_number: call.to || 'Unknown',
          status: call.status,
          start_time: call.start_time || new Date().toISOString(),
          end_time: call.end_time,
          duration: call.duration,
          recording_url: call.recording_url,
          metadata: call.metadata || {}
        }, { onConflict: 'call_id' });
      
      if (callError) {
        console.error(`Error storing call ${call.id}:`, callError);
        continue;
      } else {
        console.log(`Call ${call.id} stored successfully`);
      }
      
      // Fetch and store transcript if available
      if (call.id) {
        try {
          console.log(`Fetching transcript for call ${call.id}...`);
          const transcript = await vapiService.getTranscript(call.id);
          
          if (transcript && transcript.length > 0) {
            console.log(`Transcript found for call ${call.id}, storing...`);
            
            // Store each transcript segment
            for (const segment of transcript) {
              const { error: transcriptError } = await supabase
                .from('transcripts')
                .insert({
                  call_id: call.id,
                  transcript: segment.text,
                  timestamp: segment.timestamp || new Date().toISOString()
                });
              
              if (transcriptError) {
                console.error(`Error storing transcript segment for call ${call.id}:`, transcriptError);
              }
            }
            
            console.log(`Transcript for call ${call.id} stored successfully`);
          } else {
            console.log(`No transcript available for call ${call.id}`);
          }
        } catch (transcriptError) {
          console.error(`Error fetching transcript for call ${call.id}:`, transcriptError);
        }
      }
    }
    
    console.log('VAPI data successfully fetched and stored in Supabase');
  } catch (error) {
    console.error('Error fetching and storing VAPI data:', error);
  }
}

// Execute the function
fetchAndStoreVapiData();
