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

      // Try to get leads from contacts table first
      let { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching contacts:', error);

        // If contacts table fails, try leads table
        const leadsResult = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        data = leadsResult.data;
        error = leadsResult.error;

        if (error) {
          console.error('Supabase error fetching leads:', error);
          throw error;
        }
      }

      // Process leads from contacts/leads table
      const processedLeads = data?.map(lead => {
        // Use contact_id as the primary ID if available
        const leadId = lead.contact_id || lead.id || lead.lead_uuid || '';
        console.log(`Processing lead: ${lead.name}, ID: ${leadId}`);

        return {
          id: leadId,
          name: lead.name || 'Unknown',
          email: lead.email || '',
          phone: lead.phone || lead.phone_number || '',
          status: lead.status || 'new',
          property_interest: lead.property_interest || lead.interests || '',
          budget: lead.budget || 0,
          location: lead.location || '',
          nationality: lead.nationality || '',
          notes: lead.notes || '',
          interest_level: lead.interest_level || 'Unknown',
          created_at: lead.created_at,
          updated_at: lead.updated_at
        };
      }) || [];

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

      // Try to search in contacts table first
      let { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`name.ilike.%${lowerQuery}%,email.ilike.%${lowerQuery}%,phone.ilike.%${lowerQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error searching contacts:', error);

        // If contacts table fails, try leads table
        const leadsResult = await supabase
          .from('leads')
          .select('*')
          .or(`name.ilike.%${lowerQuery}%,email.ilike.%${lowerQuery}%,phone.ilike.%${lowerQuery}%`)
          .order('created_at', { ascending: false });

        data = leadsResult.data;
        error = leadsResult.error;

        if (error) {
          console.error('Supabase error searching leads:', error);
          throw error;
        }
      }

      // Process leads from contacts/leads table
      const processedLeads = data?.map(lead => {
        // Use contact_id as the primary ID if available
        const leadId = lead.contact_id || lead.id || lead.lead_uuid || '';
        console.log(`Processing search result: ${lead.name}, ID: ${leadId}`);

        return {
          id: leadId,
          name: lead.name || 'Unknown',
          email: lead.email || '',
          phone: lead.phone || lead.phone_number || '',
          status: lead.status || 'new',
          property_interest: lead.property_interest || lead.interests || '',
          budget: lead.budget || 0,
          location: lead.location || '',
          nationality: lead.nationality || '',
          notes: lead.notes || '',
          interest_level: lead.interest_level || 'Unknown',
          created_at: lead.created_at,
          updated_at: lead.updated_at
        };
      }) || [];

      console.log(`Found ${processedLeads.length} leads matching "${query}":`, processedLeads);
      return processedLeads;
    } catch (error) {
      console.error('Error searching leads:', error);
      throw error;
    }
  },

  async getLead(id: string) {
  if (!id || id === "undefined") {
    throw new Error("Invalid or missing lead ID");
  }
    try {
      console.log(`Fetching lead with ID: ${id}`);

      // Try to get lead from contacts table first
      let data: any = null;
      let error: any = null;

      // First try with contact_id field
      try {
        const contactResult = await supabase
          .from('contacts')
          .select('*')
          .eq('contact_id', id)
          .single();

        data = contactResult.data;
        error = contactResult.error;

        // If not found, try with id field
        if (error) {
          const contactResult2 = await supabase
            .from('contacts')
            .select('*')
            .eq('id', id)
            .single();

          data = contactResult2.data;
          error = contactResult2.error;
        }
      } catch (contactError) {
        console.log(`Contact not found with ID ${id}, trying leads table`);
        error = contactError;
      }

      // If contact not found, try leads table
      if (error) {
        const leadResult = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .single();

        data = leadResult.data;
        error = leadResult.error;

        if (error) {
          console.error(`Supabase error fetching lead ${id}:`, error);
          throw error;
        }
      }

      // Get calls for this lead
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error(`Error fetching calls for lead ${id}:`, callsError);
      }

      // Process the lead data
      const processedLead = {
        ...data,
        id: data.id || '',
        name: data.name || 'Unknown',
        email: data.email || '',
        phone: data.phone || '',
        status: data.status || 'new',
        property_interest: data.property_interest || '',
        budget: data.budget || 0,
        location: data.location || '',
        nationality: data.nationality || '',
        notes: data.notes || '',
        interest_level: data.interest_level || 'Unknown',
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
        .eq('lead_uuid', leadId)
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
      // Try to update in contacts table first
      let error = null;

      try {
        const { error: contactError } = await supabase
          .from('contacts')
          .update({
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
          .select();

        error = contactError;
      } catch (contactError) {
        console.log(`Contact not found with ID ${leadId}, trying leads table`);
        error = contactError;
      }

      // If contact update failed, try leads table
      if (error) {
        const { error: leadError } = await supabase
          .from('leads')
          .update({
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
          .select();

        if (leadError) {
          console.error(`Error updating lead ${leadId} status:`, leadError);
          throw leadError;
        }
      }

      console.log(`Updated lead ${leadId} status to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating lead status:', error);
      throw error;
    }
  },

  async updateLeadDetails(leadId: string, details: Partial<Lead>) {
    try {
      // Add updated_at timestamp
      const updatedDetails = {
        ...details,
        updated_at: new Date().toISOString()
      };

      // Try to update in contacts table first
      let error = null;

      try {
        const { error: contactError } = await supabase
          .from('contacts')
          .update(updatedDetails)
          .eq('id', leadId)
          .select();

        error = contactError;
      } catch (contactError) {
        console.log(`Contact not found with ID ${leadId}, trying leads table`);
        error = contactError;
      }

      // If contact update failed, try leads table
      if (error) {
        const { error: leadError } = await supabase
          .from('leads')
          .update(updatedDetails)
          .eq('id', leadId)
          .select();

        if (leadError) {
          console.error(`Error updating lead ${leadId} details:`, leadError);
          throw leadError;
        }
      }

      console.log(`Updated lead ${leadId} details:`, updatedDetails);
      return true;
    } catch (error) {
      console.error('Error updating lead details:', error);
      throw error;
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

      // Try to get lead from contacts table first
      let lead: any = null;
      let leadError: any = null;

      // First try with contact_id field
      try {
        const contactResult = await supabase
          .from('contacts')
          .select('*')
          .eq('contact_id', leadId)
          .single();

        lead = contactResult.data;
        leadError = contactResult.error;

        // If not found, try with id field
        if (leadError) {
          const contactResult2 = await supabase
            .from('contacts')
            .select('*')
            .eq('id', leadId)
            .single();

          lead = contactResult2.data;
          leadError = contactResult2.error;
        }
      } catch (contactError) {
        console.log(`Contact not found with ID ${leadId}, trying leads table`);
        leadError = contactError;
      }

      // If contact not found, try leads table
      if (leadError) {
        const leadResult = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        lead = leadResult.data;
        leadError = leadResult.error;

        if (leadError) {
          console.error(`Error fetching lead ${leadId}:`, leadError);
          throw leadError;
        }
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
          contact_id: leadId,
          phone: lead.phone,
          type: 'outbound',
          status: 'initiated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          agent_name: 'Top Loader Agent AI',
          agent_id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738'
        });

      if (callError) {
        console.error('Error creating call record:', callError);
        throw callError;
      }

      console.log(`Call record created successfully: ${callId}`);

      return callId;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  },

  async scheduleFollowUp(leadId: string, date: Date) {
    try {
      // Try to update in contacts table first
      let error = null;

      try {
        const { error: contactError } = await supabase
          .from('contacts')
          .update({
            status: 'call_back_later',
            callback_date: date.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);

        error = contactError;
      } catch (contactError) {
        console.log(`Contact not found with ID ${leadId}, trying leads table`);
        error = contactError;
      }

      // If contact update failed, try leads table
      if (error) {
        const { error: leadError } = await supabase
          .from('leads')
          .update({
            status: 'call_back_later',
            callback_date: date.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);

        if (leadError) {
          console.error(`Error scheduling follow-up for lead ${leadId}:`, leadError);
          throw leadError;
        }
      }

      console.log(`Scheduled follow-up for lead ${leadId} on ${date.toISOString()}`);
      return true;
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      throw error;
    }
  },

  async assignLeadToAgent(leadId: string, agentId: string, agentName: string) {
    try {
      // Try to update in contacts table first
      let error = null;

      try {
        const { error: contactError } = await supabase
          .from('contacts')
          .update({
            agent_id: agentId,
            agent_name: agentName,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);

        error = contactError;
      } catch (contactError) {
        console.log(`Contact not found with ID ${leadId}, trying leads table`);
        error = contactError;
      }

      // If contact update failed, try leads table
      if (error) {
        const { error: leadError } = await supabase
          .from('leads')
          .update({
            agent_id: agentId,
            agent_name: agentName,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);

        if (leadError) {
          console.error(`Error assigning lead ${leadId} to agent:`, leadError);
          throw leadError;
        }
      }

      console.log(`Assigned lead ${leadId} to agent ${agentName} (${agentId})`);
      return true;
    } catch (error) {
      console.error('Error assigning lead to agent:', error);
      throw error;
    }
  }
}