import type { CrmStatus } from '@/types'
import { supabase } from '@/lib/services/supabase'

// Define types based on our new database schema
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  property_interest?: string;
  budget?: number;
  location?: string;
  nationality?: string;
  notes?: string;
  interest_level?: string;
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
  call_id: string;
  lead_id: string;
  phone_number: string;
  call_type: string;
  call_status: string;
  call_outcome?: string;
  timestamp: string;
  end_time?: string;
  call_duration?: number;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  meeting_scheduled?: boolean;
  meeting_time?: string;
  callback_scheduled?: boolean;
  callback_time?: string;
  created_at: string;
  updated_at: string;
}

export const leadsService = {
  async getLeads() {
    try {
      console.log('Fetching leads from Supabase...');

      // Get leads from enhanced_leads table
      const { data, error } = await supabase
        .from('enhanced_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching leads:', error);
        throw error;
      }

      // Process leads from enhanced_leads table
      const processedLeads = data?.map(lead => ({
        id: lead.lead_id || lead.id,
        name: lead.name || 'Unknown',
        email: lead.email || '',
        phone: lead.phone_number || lead.phone || '',
        status: lead.status || 'new',
        property_interest: lead.property_interest || '',
        budget: lead.budget || 0,
        location: lead.location || '',
        nationality: lead.nationality || '',
        notes: lead.notes || '',
        interest_level: lead.lead_quality || 'Unknown',
        total_calls: lead.total_calls || 0,
        answered_calls: lead.answered_calls || 0,
        missed_calls: lead.missed_calls || 0,
        created_at: lead.created_at,
        updated_at: lead.updated_at
      })) || [];

      console.log('Leads data from Supabase:', processedLeads);
      return processedLeads;
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
        .from('enhanced_leads')
        .select('*')
        .or(`name.ilike.%${lowerQuery}%,email.ilike.%${lowerQuery}%,phone_number.ilike.%${lowerQuery}%,lead_id.ilike.%${lowerQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error searching leads:', error);
        throw error;
      }

      // Process leads from enhanced_leads table
      const processedLeads = data?.map(lead => ({
        id: lead.lead_id || lead.id,
        name: lead.name || 'Unknown',
        email: lead.email || '',
        phone: lead.phone_number || lead.phone || '',
        status: lead.status || 'new',
        property_interest: lead.property_interest || '',
        budget: lead.budget || 0,
        location: lead.location || '',
        nationality: lead.nationality || '',
        notes: lead.notes || '',
        interest_level: lead.lead_quality || 'Unknown',
        total_calls: lead.total_calls || 0,
        answered_calls: lead.answered_calls || 0,
        missed_calls: lead.missed_calls || 0,
        created_at: lead.created_at,
        updated_at: lead.updated_at
      })) || [];

      console.log(`Found ${processedLeads.length} leads matching "${query}":`, processedLeads);
      return processedLeads;
    } catch (error) {
      console.error('Error searching leads:', error);
      throw error;
    }
  },

  async getLead(id: string) {
    try {
      console.log(`Fetching lead with ID: ${id}`);

      // Get lead from enhanced_leads table
      const { data, error } = await supabase
        .from('enhanced_leads')
        .select(`
          *
        `)
        .eq('lead_id', id)
        .single();

      if (error) {
        console.error(`Supabase error fetching lead ${id}:`, error);
        throw error;
      }

      // Get calls for this lead
      const { data: callsData, error: callsError } = await supabase
        .from('enhanced_calls')
        .select('*')
        .eq('metadata->lead_id', id)
        .order('timestamp', { ascending: false });

      if (callsError) {
        console.error(`Error fetching calls for lead ${id}:`, callsError);
      }

      // Process the lead data from enhanced_leads
      const processedLead = {
        ...data,
        id: data.lead_id || data.id,
        phone: data.phone_number || data.phone || '',
        interest_level: data.lead_quality || 'Unknown',
        total_calls: data.total_calls || 0,
        answered_calls: data.answered_calls || 0,
        missed_calls: data.missed_calls || 0,
        last_call_date: data.last_call_date,
        last_call_status: data.last_call_status,
        successful_meetings: data.successful_meetings || 0,
        calls: callsData || [],
        interactions: [],
        // Add empty arrays for UI components that expect these properties
        preferredAreas: data.preferred_areas ?
          (Array.isArray(data.preferred_areas) ? data.preferred_areas : [data.preferred_areas]) : []
      };

      console.log(`Lead data for ID ${id}:`, processedLead);
      return processedLead;
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
        .from('enhanced_leads')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId)
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
      // Add updated_at timestamp
      const updatedDetails = {
        ...details,
        updated_at: new Date().toISOString()
      };

      // Convert fields to match enhanced_leads schema
      const enhancedDetails: any = { ...updatedDetails };
      if (details.phone) {
        enhancedDetails.phone_number = details.phone;
        delete enhancedDetails.phone;
      }
      if (details.interest_level) {
        enhancedDetails.lead_quality = details.interest_level;
        delete enhancedDetails.interest_level;
      }

      const { data, error } = await supabase
        .from('enhanced_leads')
        .update(enhancedDetails)
        .eq('lead_id', leadId)
        .select()

      if (error) throw error
      console.log(`Updated lead ${leadId} details:`, enhancedDetails)
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
        .from('enhanced_leads')
        .select('*')
        .eq('lead_id', leadId)
        .single()

      if (leadError) {
        console.error(`Error fetching lead ${leadId}:`, leadError);
        throw leadError;
      }

      if (!lead) {
        console.error(`Lead not found: ${leadId}`);
        throw new Error('Lead not found');
      }

      console.log(`Found lead: ${lead.name}, phone: ${lead.phone_number || lead.phone}`);

      // Create a call record with VAPI assistant ID
      const callId = `call-${Date.now()}`;
      console.log(`Generated call ID: ${callId}`);

      // Add call to enhanced_calls table with new schema
      const { error: callError } = await supabase
        .from('enhanced_calls')
        .insert({
          call_id: callId,
          lead_id: leadId,
          phone_number: lead.phone_number || lead.phone,
          call_type: 'Outbound',
          call_status: 'Initiated',
          timestamp: new Date().toISOString(),
          metadata: {
            lead_id: leadId,
            lead_name: lead.name,
            direction: 'outbound',
            agent_id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738',
            agent_name: 'Top Loader Agent AI'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (callError) {
        console.error('Error creating call record:', callError);
        throw callError;
      }

      console.log(`Call record created successfully: ${callId}`);

      // Update lead with call information
      await supabase
        .from('enhanced_leads')
        .update({
          total_calls: (lead.total_calls || 0) + 1,
          last_call_date: new Date().toISOString(),
          last_call_status: 'Initiated',
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId);

      return callId;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  },

  async scheduleFollowUp(leadId: string, date: Date) {
    try {
      // Add a follow-up task to the enhanced_leads table
      const { error } = await supabase
        .from('enhanced_leads')
        .update({
          status: 'call_back_later',
          callback_date: date.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId)

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
      // Update the lead with the agent information in metadata
      const { error } = await supabase
        .from('leads')
        .update({
          metadata: { agent_id: agentId, agent_name: agentName },
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