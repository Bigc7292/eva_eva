import { supabase } from '../lib/services/supabase';
import type { Call, LeadProfile, CallAnalytics } from '../types/call';
import { DatabaseError as SupabaseDbError } from '../lib/services/supabase';

// Error types
export class DatabaseError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class CallsService {
  async getCall(id: string): Promise<Call | null> {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('call_id', id)
        .single();

      if (error) {
        throw new DatabaseError('Failed to fetch call', error);
      }

      if (!data) {
        return null;
      }

      // Map to Call interface with our new schema
      const call: Call = {
        id: data.call_id,
        call_id: data.call_id,
        lead_id: null, // We don't have this in the current schema
        phone_number: data.phone_number,
        call_type: data.call_type,
        call_status: data.call_status,
        call_outcome: null, // We don't have this in the current schema
        timestamp: data.start_time,
        end_time: data.end_time,
        call_duration: data.call_duration,
        recording_url: data.recording_url,
        transcript: data.transcript,
        summary: data.summary,
        meeting_scheduled: data.meeting_scheduled || false,
        meeting_time: data.meeting_time,
        callback_scheduled: false, // We don't have this in the current schema
        callback_time: null, // We don't have this in the current schema
        created_at: data.created_at,
        updated_at: data.updated_at,
        metadata: data.metadata,

        // Compatibility fields for UI components
        leadId: null, // We don't have this in the current schema
        leadName: 'Unknown', // We don't have this in the current schema
        leadPhone: data.phone_number,
        callType: data.call_type,
        callStatus: data.call_status,
        callDuration: data.call_duration,
        audioUrl: data.recording_url,
        sentimentScore: data.metadata?.sentiment_score,
        keyTopics: data.metadata?.key_topics || [],
        nextSteps: data.metadata?.next_steps,
        retellCallId: data.call_id
      };

      return call;
    } catch (error) {
      console.error('Error in getCall:', error);
      throw error;
    }
  }

  async createLeadProfile(phone: string, name?: string, email?: string): Promise<LeadProfile> {
    try {
      // First check if lead exists
      const { data: existingLead, error: existingLeadError } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', phone)
        .single();

      let leadId: string;

      if (existingLeadError || !existingLead) {
        // Create new lead
        const { data: newLead, error: createLeadError } = await supabase
          .from('leads')
          .insert([{
            name: name || 'Unknown',
            phone,
            email: email || null,
            status: 'new',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createLeadError || !newLead) {
          throw new DatabaseError('Failed to create lead', createLeadError);
        }

        leadId = newLead.id;
      } else {
        leadId = existingLead.id;
      }

      // Now check if lead profile exists
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('lead_profiles')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (!existingProfileError && existingProfile) {
        return existingProfile;
      }

      // Create new lead profile
      const { data: newProfile, error: createProfileError } = await supabase
        .from('lead_profiles')
        .insert([{
          lead_id: leadId,
          phone,
          first_contact_date: new Date().toISOString(),
          successful_meetings: 0,
          total_calls: 0,
          answered_calls: 0,
          missed_calls: 0,
          interest_level: 'Unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createProfileError) {
        throw new DatabaseError('Failed to create lead profile', createProfileError);
      }

      return newProfile;
    } catch (error) {
      console.error('Error in createLeadProfile:', error);
      throw error;
    }
  }

  async getCallAnalytics(): Promise<CallAnalytics> {
    try {
      console.log('Fetching call analytics from Supabase...');

      // First try to get analytics from call_analytics table
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('call_analytics')
        .select('*')
        .order('date', { ascending: false });

      if (analyticsError) {
        console.error('Supabase error fetching call analytics:', analyticsError);
      }

      // Fetch call data for detailed information
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .order('start_time', { ascending: false });

      if (callsError) {
        console.error('Supabase error fetching calls:', callsError);
        throw new DatabaseError('Failed to fetch calls', callsError);
      }

      console.log('Calls data from Supabase:', callsData);

      // Get call status metrics
      const { data: statusData, error: statusError } = await supabase
        .from('call_status_metrics')
        .select('*');

      if (statusError) {
        console.error('Supabase error fetching call status metrics:', statusError);
      }

      // Get call outcome metrics
      const { data: outcomeData, error: outcomeError } = await supabase
        .from('call_outcome_metrics')
        .select('*');

      if (outcomeError) {
        console.error('Supabase error fetching call outcome metrics:', outcomeError);
      }

      // Calculate analytics from calls data if analytics table is empty
      const totalCalls = callsData.length;
      const answeredCalls = callsData.filter(call =>
        call.call_status === 'Completed' || call.call_status === 'Answered'
      ).length;
      const missedCalls = callsData.filter(call =>
        call.call_status === 'Missed' || call.call_status === 'No Answer'
      ).length;
      const voicemailCalls = callsData.filter(call => call.call_status === 'Voicemail').length;
      const failedCalls = callsData.filter(call => call.call_status === 'Failed').length;
      const answerRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
      const averageCallDuration = answeredCalls > 0 ?
        callsData.filter(call => call.call_status === 'Completed' || call.call_status === 'Answered')
          .reduce((sum, call) => sum + (call.call_duration || 0), 0) / answeredCalls : 0;
      const meetingsScheduled = callsData.filter(call => call.meeting_scheduled).length;
      const callbacksScheduled = 0; // We don't have this in the current schema

      // Map the data to ensure it matches our Call interface
      const calls = callsData.map((call): Call => ({
        id: call.call_id,
        call_id: call.call_id,
        lead_id: null, // We don't have this in the current schema
        phone_number: call.phone_number,
        call_type: call.call_type,
        call_status: call.call_status,
        call_outcome: null, // We don't have this in the current schema
        timestamp: call.start_time,
        end_time: call.end_time,
        call_duration: call.call_duration,
        recording_url: call.recording_url,
        transcript: call.transcript,
        summary: call.summary,
        meeting_scheduled: call.meeting_scheduled || false,
        meeting_time: call.meeting_time,
        callback_scheduled: false, // We don't have this in the current schema
        callback_time: null, // We don't have this in the current schema
        created_at: call.created_at,
        updated_at: call.updated_at,
        metadata: call.metadata,

        // Compatibility fields
        leadId: null, // We don't have this in the current schema
        leadName: 'Unknown', // We don't have this in the current schema
        leadPhone: call.phone_number,
        callType: call.call_type,
        callStatus: call.call_status,
        callDuration: call.call_duration,
        audioUrl: call.recording_url
      }));

      // Prepare calls by date for charts
      const callsByDate = analyticsData ?
        analyticsData.map(item => ({ date: item.date, count: item.total_calls })) :
        Array.from(new Set(callsData.map(call =>
          new Date(call.start_time).toISOString().split('T')[0]
        ))).map(date => ({
          date,
          count: callsData.filter(call =>
            new Date(call.start_time).toISOString().split('T')[0] === date
          ).length
        }));

      // Prepare calls by status for charts
      const callsByStatus = statusData ?
        statusData.map(item => ({ status: item.call_status, count: item.count })) :
        Array.from(new Set(callsData.map(call => call.call_status)))
          .map(status => ({
            status: status || 'Unknown',
            count: callsData.filter(call => call.call_status === status).length
          }));

      // Prepare calls by outcome for charts
      const callsByOutcome = outcomeData ?
        outcomeData.map(item => ({ outcome: item.call_outcome, count: item.count })) :
        Array.from(new Set(callsData.filter(call => call.call_outcome).map(call => call.call_outcome)))
          .map(outcome => ({
            outcome: outcome || 'Unknown',
            count: callsData.filter(call => call.call_outcome === outcome).length
          }));

      return {
        totalCalls,
        answeredCalls,
        missedCalls,
        voicemailCalls,
        failedCalls,
        answerRate,
        averageCallDuration,
        meetingsScheduled,
        callbacksScheduled,
        calls,
        callsByDate,
        callsByStatus,
        callsByOutcome
      };
    } catch (error) {
      console.error('Error in getCallAnalytics:', error);
      throw error;
    }
  }
}

// Export an instance of the service
export const callsService = new CallsService();