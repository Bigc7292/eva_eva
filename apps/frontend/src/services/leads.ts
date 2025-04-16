import type { CrmStatus } from '@/types'
import { supabase } from '@/lib/services/supabase'

// Define types here instead of importing from dummy data
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  property_interest?: string;
  budget_range?: string;
  location?: string;
  gender?: string;
  rating?: number;
  notes?: string;
  crm_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Interaction {
  id: string;
  type: string;
  timestamp: string;
  details: string;
  agent?: string;
  duration?: number;
  outcome?: string;
  callId?: string;
  audioUrl?: string;
  transcript?: string;
}

export interface Call {
  id: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  callType?: string;
  callStatus?: string;
  callDuration?: number;
  timestamp?: string;
  audioUrl?: string;
  transcript?: string;
  sentimentScore?: number;
  keyTopics?: string[];
  nextSteps?: string;
  agentId?: string;
  agentName?: string;
  retellCallId?: string;
  // Legacy fields for compatibility
  lead_id?: string;
  customer_phone?: string;
  customer_name?: string;
  call_type?: string;
  status?: string;
  recording_url?: string;
  agent_id?: string;
  agent_name?: string;
  start_time?: string;
  created_at?: string;
  updated_at?: string;
  call_duration?: number;
  call_id?: string;
}

export const leadsService = {
  async getLeads() {
    try {
      console.log('Fetching leads from Supabase...');
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching leads:', error);
        throw error;
      }

      console.log('Leads data from Supabase:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  },

  async searchLeads(query: string) {
    try {
      console.log(`Searching leads with query: "${query}"`);
      const lowerQuery = query.toLowerCase();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .or(`name.ilike.%${lowerQuery}%,email.ilike.%${lowerQuery}%,phone.ilike.%${lowerQuery}%,crm_id.ilike.%${lowerQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error searching leads:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} leads matching "${query}":`, data);
      return data || [];
    } catch (error) {
      console.error('Error searching leads:', error);
      throw error;
    }
  },

  async getLead(id: string) {
    try {
      console.log(`Fetching lead with ID: ${id}`);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Supabase error fetching lead ${id}:`, error);
        throw error;
      }

      console.log(`Lead data for ID ${id}:`, data);
      return data;
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  },

  async getLeadInteractions(leadId: string) {
    try {
      // Assuming there's an interactions table with a lead_id column
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching lead interactions:', error)
      throw error
    }
  },

  async updateLeadStatus(leadId: string, status: CrmStatus) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId)
        .select()

      if (error) throw error
      console.log(`Updated lead ${leadId} status to ${status}`)
      return true
    } catch (error) {
      console.error('Error updating lead status:', error)
      throw error
    }
  },

  async updateLeadDetails(leadId: string, details: Partial<Lead>) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(details)
        .eq('id', leadId)
        .select()

      if (error) throw error
      console.log(`Updated lead ${leadId} details:`, details)
      return true
    } catch (error) {
      console.error('Error updating lead details:', error)
      throw error
    }
  },

  async addLeadInteraction(leadId: string, interaction: Omit<Interaction, 'id'>) {
    try {
      const interactionId = `interaction-${Date.now()}`
      const { data, error } = await supabase
        .from('interactions')
        .insert({
          ...interaction,
          lead_id: leadId,
          id: interactionId
        })
        .select()

      if (error) throw error
      console.log(`Added interaction ${interactionId} to lead ${leadId}:`, interaction)
      return { ...interaction, id: interactionId }
    } catch (error) {
      console.error('Error adding lead interaction:', error)
      throw error
    }
  },

  async initiateCall(leadId: string) {
    try {
      console.log(`Initiating call to lead ID: ${leadId}`);

      // Get lead details from Supabase
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (leadError) {
        console.error(`Error fetching lead ${leadId}:`, leadError);
        throw leadError;
      }

      if (!lead) {
        console.error(`Lead not found: ${leadId}`);
        throw new Error('Lead not found');
      }

      console.log(`Found lead: ${lead.name}, phone: ${lead.phone}`);

      // Create a call record with VAPI assistant ID
      const callId = `call-${Date.now()}`;
      console.log(`Generated call ID: ${callId}`);

      // Add call to calls table
      const { error: callError } = await supabase
        .from('calls')
        .insert({
          id: callId,
          lead_id: leadId,
          phone_number: lead.phone, // Using phone_number to match table schema
          customer_phone: lead.phone,
          customer_name: lead.name,
          call_type: 'outbound',
          status: 'initiated',
          agent_id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '209f26bc-b626-43c7-8815-779eff9712bb',
          agent_name: 'Top Loader Agent AI',
          start_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            lead_id: leadId,
            lead_name: lead.name,
            direction: 'outbound'
          }
        });

      if (callError) {
        console.error('Error creating call record:', callError);
        throw callError;
      }

      console.log(`Call record created successfully: ${callId}`);

      // Add interaction record
      const now = new Date().toISOString();
      const interaction: Omit<Interaction, 'id'> = {
        type: 'Call',
        timestamp: now,
        details: `Initiated outbound call to ${lead.phone}`,
        duration: 0, // Will be updated when call ends
        outcome: 'In Progress',
        callId
      };

      await this.addLeadInteraction(leadId, interaction);
      console.log(`Interaction record created for lead ${leadId}`);

      return callId;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  },

  async scheduleFollowUp(leadId: string, date: Date) {
    try {
      // Add a follow-up task to the tasks table
      const { error } = await supabase
        .from('tasks')
        .insert({
          id: `task-${Date.now()}`,
          lead_id: leadId,
          type: 'follow_up',
          due_date: date.toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      console.log(`Scheduled follow-up for lead ${leadId} on ${date.toISOString()}`)
      return true
    } catch (error) {
      console.error('Error scheduling follow-up:', error)
      throw error
    }
  },

  async assignLeadToAgent(leadId: string, agentId: string, agentName: string) {
    try {
      // Update the lead with the agent information
      const { error } = await supabase
        .from('leads')
        .update({
          agent_id: agentId,
          agent_name: agentName,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      if (error) throw error
      console.log(`Assigned lead ${leadId} to agent ${agentName} (${agentId})`)
      return true
    } catch (error) {
      console.error('Error assigning lead to agent:', error)
      throw error
    }
  }
}