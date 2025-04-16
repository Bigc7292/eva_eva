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
        .eq('id', id)
        .single();

      if (error) {
        throw new DatabaseError('Failed to fetch call', error);
      }

      if (!data) {
        return null;
      }

      // Map to Call interface
      return {
        id: data.id,
        call_id: data.call_id,
        status: data.status,
        start_time: data.start_time,
        customer_phone: data.phone_number,
        call_duration: data.duration,
        agent_id: data.agent_id,
        agent_name: data.agent_name,
        created_at: data.created_at,
        updated_at: data.updated_at,
        // Additional fields for call detail page
        leadId: data.metadata?.lead_id,
        leadName: data.metadata?.lead_name || 'Unknown',
        leadPhone: data.phone_number,
        callType: data.metadata?.direction || 'Outbound',
        callStatus: data.status === 'ended' ? 'Completed' : data.status,
        callDuration: data.duration,
        timestamp: data.start_time,
        audioUrl: data.recording_url,
        transcript: data.metadata?.transcript,
        sentimentScore: data.metadata?.sentiment_score,
        keyTopics: data.metadata?.key_topics || [],
        nextSteps: data.metadata?.next_steps,
        retellCallId: data.call_id
      };
    } catch (error) {
      console.error('Error in getCall:', error);
      throw error;
    }
  }

  async createLeadProfile(phone: string): Promise<LeadProfile> {
    try {
      const { data: existingLead, error: existingError } = await supabase
        .from('lead_profiles')
        .select('*')
        .eq('phone', phone)
        .single();

      if (existingError) {
        throw new DatabaseError('Failed to check existing lead', existingError);
      }

      if (existingLead) {
        return existingLead;
      }

      const { data: newLead, error: createError } = await supabase
        .from('lead_profiles')
        .insert([{ phone }])
        .select()
        .single();

      if (createError) {
        throw new DatabaseError('Failed to create lead profile', createError);
      }

      return newLead;
    } catch (error) {
      console.error('Error in createLeadProfile:', error);
      throw error;
    }
  }

  async getCallAnalytics(): Promise<CallAnalytics> {
    try {
      console.log('Fetching call analytics from Supabase...');

      // Fetch call data using anon key authentication
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .order('start_time', { ascending: false });

      if (callsError) {
        console.error('Supabase error fetching calls:', callsError);
        throw new DatabaseError('Failed to fetch calls', callsError);
      }

      console.log('Calls data from Supabase:', callsData);

      // Calculate analytics
      const totalCalls = callsData.length;
      const successfulCalls = callsData.filter(call => call.status === 'completed' || call.status === 'ended').length;
      const missedCalls = callsData.filter(call => call.status === 'missed' || call.status === 'no-answer').length;
      const averageCallDuration = callsData.reduce((sum, call) => sum + (call.duration || 0), 0) / (totalCalls || 1);

      // Map the data to ensure it matches our Call interface
      const calls = callsData.map((call): Call => ({
        id: call.id,
        call_id: call.call_id || call.id,
        status: call.status,
        start_time: call.start_time,
        customer_phone: call.phone_number,
        call_duration: call.duration,
        agent_id: call.agent_id,
        agent_name: call.agent_name || (call.metadata?.agent_name),
        created_at: call.created_at,
        updated_at: call.updated_at,
        // Add any additional fields from metadata
        ...(call.metadata && typeof call.metadata === 'object' ? {
          leadId: call.metadata.lead_id,
          leadName: call.metadata.lead_name,
          callType: call.metadata.direction || 'outbound'
        } : {})
      }));

      return {
        totalCalls,
        successfulCalls,
        missedCalls,
        averageCallDuration,
        calls
      };
    } catch (error) {
      console.error('Error in getCallAnalytics:', error);
      throw error;
    }
  }
}

// Export an instance of the service
export const callsService = new CallsService();