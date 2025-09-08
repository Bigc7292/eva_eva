import { supabase } from '@/lib/services/supabase'

export interface PhoneNumberProfile {
  id: string
  phone_number: string
  lead_id?: string
  contact_name?: string
  total_calls: number
  answered_calls: number
  missed_calls: number
  total_duration: number
  average_duration: number
  last_call_date?: string
  last_call_outcome?: string
  callback_scheduled?: boolean
  callback_date?: string
  meetings_scheduled: number
  meetings_attended: number
  interest_level?: string
  lead_quality?: string
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface PhoneInteraction {
  id: string
  phone_number: string
  interaction_type: 'call' | 'sms' | 'email' | 'meeting' | 'callback'
  timestamp: string
  duration?: number
  outcome?: string
  agent_id?: string
  agent_name?: string
  summary?: string
  transcript?: string
  recording_url?: string
  follow_up_required?: boolean
  follow_up_date?: string
  sentiment_score?: number
  ai_rating?: number
  lead_id?: string
  meeting_scheduled?: boolean
  meeting_date?: string
  created_at: string
}

export const phoneProfilesService = {
  // Get phone number profile with all interactions
  async getPhoneProfile(phoneNumber: string): Promise<PhoneNumberProfile | null> {
    try {
      const { data, error } = await supabase
        .from('phone_number_profiles')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error fetching phone profile:', error)
      throw error
    }
  },

  // Get all phone number profiles with pagination
  async getPhoneProfiles(page: number = 1, limit: number = 50): Promise<{
    profiles: PhoneNumberProfile[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const offset = (page - 1) * limit

      // Get profiles with pagination
      const { data: profiles, error: profilesError, count } = await supabase
        .from('phone_number_profiles')
        .select('*', { count: 'exact' })
        .order('last_call_date', { ascending: false })
        .range(offset, offset + limit - 1)

      if (profilesError) throw profilesError

      return {
        profiles: profiles || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error fetching phone profiles:', error)
      throw error
    }
  },

  // Create or update phone number profile
  async upsertPhoneProfile(phoneNumber: string, updates: Partial<PhoneNumberProfile>): Promise<PhoneNumberProfile> {
    try {
      const { data, error } = await supabase
        .from('phone_number_profiles')
        .upsert({
          phone_number: phoneNumber,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone_number'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error upserting phone profile:', error)
      throw error
    }
  },

  // Record a new interaction for a phone number
  async recordInteraction(interaction: Omit<PhoneInteraction, 'id' | 'created_at'>): Promise<PhoneInteraction> {
    try {
      // First record the interaction
      const { data: newInteraction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          ...interaction,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (interactionError) throw interactionError

      // Update or create phone profile
      await this.updatePhoneProfileStats(interaction.phone_number)

      return newInteraction
    } catch (error) {
      console.error('Error recording interaction:', error)
      throw error
    }
  },

  // Update phone profile statistics based on interactions
  async updatePhoneProfileStats(phoneNumber: string): Promise<void> {
    try {
      // Get all interactions for this phone number
      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('timestamp', { ascending: false })

      if (interactionsError) throw interactionsError

      if (!interactions || interactions.length === 0) return

      // Calculate statistics
      const callInteractions = interactions.filter(i => i.interaction_type === 'call')
      const totalCalls = callInteractions.length
      const answeredCalls = callInteractions.filter(i => i.outcome === 'answered' || i.outcome === 'completed').length
      const missedCalls = totalCalls - answeredCalls
      const totalDuration = callInteractions.reduce((sum, i) => sum + (i.duration || 0), 0)
      const averageDuration = totalCalls > 0 ? totalDuration / totalCalls : 0
      
      const meetingInteractions = interactions.filter(i => i.interaction_type === 'meeting')
      const meetingsScheduled = interactions.filter(i => i.meeting_scheduled).length
      const meetingsAttended = meetingInteractions.filter(i => i.outcome === 'attended').length

      const lastInteraction = interactions[0]
      const lastCallInteraction = callInteractions[0]

      // Calculate interest level based on interactions
      const positiveOutcomes = interactions.filter(i => 
        ['interested', 'callback_requested', 'meeting_scheduled', 'positive'].includes(i.outcome || '')
      ).length
      const interestLevel = positiveOutcomes > 0 ? 
        positiveOutcomes / interactions.length > 0.5 ? 'high' : 'medium' : 'low'

      // Update phone profile
      await this.upsertPhoneProfile(phoneNumber, {
        total_calls: totalCalls,
        answered_calls: answeredCalls,
        missed_calls: missedCalls,
        total_duration: totalDuration,
        average_duration: averageDuration,
        last_call_date: lastCallInteraction?.timestamp,
        last_call_outcome: lastCallInteraction?.outcome,
        meetings_scheduled: meetingsScheduled,
        meetings_attended: meetingsAttended,
        interest_level: interestLevel,
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating phone profile stats:', error)
      throw error
    }
  },

  // Get interactions for a phone number
  async getPhoneInteractions(phoneNumber: string, limit?: number): Promise<PhoneInteraction[]> {
    try {
      let query = supabase
        .from('interactions')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('timestamp', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching phone interactions:', error)
      throw error
    }
  },

  // Search phone profiles
  async searchPhoneProfiles(query: string): Promise<PhoneNumberProfile[]> {
    try {
      const { data, error } = await supabase
        .from('phone_number_profiles')
        .select('*')
        .or(`phone_number.ilike.%${query}%,contact_name.ilike.%${query}%,lead_id.ilike.%${query}%`)
        .order('last_call_date', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching phone profiles:', error)
      throw error
    }
  },

  // Get phone profiles by interest level
  async getPhoneProfilesByInterest(interestLevel: string): Promise<PhoneNumberProfile[]> {
    try {
      const { data, error } = await supabase
        .from('phone_number_profiles')
        .select('*')
        .eq('interest_level', interestLevel)
        .order('last_call_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching profiles by interest level:', error)
      throw error
    }
  },

  // Get callbacks scheduled for today
  async getTodaysCallbacks(): Promise<PhoneNumberProfile[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('phone_number_profiles')
        .select('*')
        .eq('callback_scheduled', true)
        .gte('callback_date', `${today}T00:00:00`)
        .lt('callback_date', `${today}T23:59:59`)
        .order('callback_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching today\'s callbacks:', error)
      throw error
    }
  },

  // Mark callback as completed
  async completeCallback(phoneNumber: string, outcome: string, notes?: string): Promise<void> {
    try {
      // Record the callback interaction
      await this.recordInteraction({
        phone_number: phoneNumber,
        interaction_type: 'callback',
        timestamp: new Date().toISOString(),
        outcome,
        summary: notes || 'Callback completed'
      })

      // Update profile to remove callback scheduling
      await this.upsertPhoneProfile(phoneNumber, {
        callback_scheduled: false,
        callback_date: undefined
      })
    } catch (error) {
      console.error('Error completing callback:', error)
      throw error
    }
  },

  // Schedule a callback
  async scheduleCallback(phoneNumber: string, callbackDate: string, notes?: string): Promise<void> {
    try {
      await this.upsertPhoneProfile(phoneNumber, {
        callback_scheduled: true,
        callback_date: callbackDate,
        notes: notes
      })

      // Record the callback scheduling interaction
      await this.recordInteraction({
        phone_number: phoneNumber,
        interaction_type: 'callback',
        timestamp: new Date().toISOString(),
        outcome: 'scheduled',
        summary: `Callback scheduled for ${callbackDate}`,
        follow_up_required: true,
        follow_up_date: callbackDate
      })
    } catch (error) {
      console.error('Error scheduling callback:', error)
      throw error
    }
  }
}