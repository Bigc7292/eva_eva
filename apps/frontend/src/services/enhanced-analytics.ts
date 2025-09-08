import { supabase } from '@/lib/services/supabase';

// Enhanced types for comprehensive analytics
export interface CallAnalytics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  voicemailCalls: number;
  failedCalls: number;
  answerRate: number;
  averageCallDuration: number;
  meetingsScheduled: number;
  callbacksScheduled: number;
  callsByOutcome: Array<{ outcome: string; count: number }>;
  callsByDay: Array<{ date: string; calls: number; answered: number }>;
  callsByHour: Array<{ hour: number; calls: number }>;
  conversionRate: number;
}

export interface MeetingAnalytics {
  totalMeetings: number;
  attendedMeetings: number;
  noShowMeetings: number;
  rescheduledMeetings: number;
  cancelledMeetings: number;
  attendanceRate: number;
  totalRevenue: number;
  averageRevenue: number;
  meetingsByLocation: Array<{ location: string; count: number }>;
  meetingsByType: Array<{ type: string; count: number }>;
  meetingsByDay: Array<{ date: string; meetings: number; attended: number }>;
}

export interface AgentPerformance {
  userId: string;
  agentName: string;
  totalCalls: number;
  answeredCalls: number;
  answerRate: number;
  meetingsBooked: number;
  meetingsAttended: number;
  conversionRate: number;
  averageCallDuration: number;
  totalRevenue: number;
}

export interface PhoneNumberProfile {
  profileId: string;
  phoneNumber: string;
  firstContactDate: string;
  lastContactDate: string;
  totalCalls: number;
  totalAnswered: number;
  totalMeetingsScheduled: number;
  totalMeetingsAttended: number;
  status: string;
  interestLevel: string;
  leadSource: string;
  leadQualityScore: number;
  interactions: Array<{
    interactionId: string;
    interactionType: string;
    interactionDate: string;
    outcome: string;
    details: string;
    duration: number;
  }>;
}

export interface DashboardOverview {
  totalDialed: number;
  totalAnswered: number;
  totalNotAnswered: number;
  totalInterested: number;
  totalNotInterested: number;
  totalCallbacks: number;
  totalMeetingsBooked: number;
  totalMeetingsAttended: number;
  averageCallsToMeeting: number;
  aiRatings: {
    averageCallQuality: number;
    averageLeadQuality: number;
    averageVoiceAssistant: number;
  };
  locationAnalysis: Array<{ location: string; meetings: number }>;
  dailyTrends: Array<{ date: string; calls: number; meetings: number }>;
}

// Analytics service class
export class AnalyticsService {
  
  // Get comprehensive call analytics
  static async getCallAnalytics(startDate?: string, endDate?: string, interval: string = 'daily'): Promise<CallAnalytics> {
    try {
      let query = supabase
        .from('calls')
        .select('*');

      if (startDate) {
        query = query.gte('start_time', startDate);
      }
      if (endDate) {
        query = query.lte('start_time', endDate);
      }

      const { data: calls, error } = await query;

      if (error) throw error;

      const totalCalls = calls?.length || 0;
      const answeredCalls = calls?.filter(call => call.call_outcome === 'answered').length || 0;
      const missedCalls = calls?.filter(call => ['no-answer', 'busy'].includes(call.call_outcome)).length || 0;
      const voicemailCalls = calls?.filter(call => call.call_outcome === 'voicemail').length || 0;
      const failedCalls = calls?.filter(call => call.call_outcome === 'failed').length || 0;
      
      const answerRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
      
      const durations = calls?.filter(call => call.call_duration).map(call => call.call_duration) || [];
      const averageCallDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      
      const meetingsScheduled = calls?.filter(call => call.meeting_scheduled).length || 0;
      const callbacksScheduled = calls?.filter(call => call.callback_scheduled).length || 0;
      
      const conversionRate = totalCalls > 0 ? (meetingsScheduled / totalCalls) * 100 : 0;

      // Group calls by outcome
      const callsByOutcome = this.groupByField(calls || [], 'call_outcome');

      // Group calls by day
      const callsByDay = this.groupCallsByTimeInterval(calls || [], interval);

      // Group calls by hour for time analysis
      const callsByHour = this.groupCallsByHour(calls || []);

      return {
        totalCalls,
        answeredCalls,
        missedCalls,
        voicemailCalls,
        failedCalls,
        answerRate: Math.round(answerRate * 100) / 100,
        averageCallDuration: Math.round(averageCallDuration),
        meetingsScheduled,
        callbacksScheduled,
        callsByOutcome,
        callsByDay,
        callsByHour,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting call analytics:', error);
      throw error;
    }
  }

  // Get comprehensive meeting analytics
  static async getMeetingAnalytics(startDate?: string, endDate?: string): Promise<MeetingAnalytics> {
    try {
      let query = supabase
        .from('meetings')
        .select('*');

      if (startDate) {
        query = query.gte('scheduled_time', startDate);
      }
      if (endDate) {
        query = query.lte('scheduled_time', endDate);
      }

      const { data: meetings, error } = await query;

      if (error) throw error;

      const totalMeetings = meetings?.length || 0;
      const attendedMeetings = meetings?.filter(m => m.outcome === 'attended').length || 0;
      const noShowMeetings = meetings?.filter(m => m.outcome === 'no-show').length || 0;
      const rescheduledMeetings = meetings?.filter(m => m.outcome === 'rescheduled').length || 0;
      const cancelledMeetings = meetings?.filter(m => m.outcome === 'cancelled').length || 0;

      const attendanceRate = totalMeetings > 0 ? (attendedMeetings / totalMeetings) * 100 : 0;

      const revenues = meetings?.filter(m => m.revenue_amount).map(m => m.revenue_amount) || [];
      const totalRevenue = revenues.reduce((sum, revenue) => sum + (revenue || 0), 0);
      const averageRevenue = attendedMeetings > 0 ? totalRevenue / attendedMeetings : 0;

      const meetingsByLocation = this.groupByField(meetings || [], 'location');
      const meetingsByType = this.groupByField(meetings || [], 'meeting_type');
      const meetingsByDay = this.groupMeetingsByDay(meetings || []);

      return {
        totalMeetings,
        attendedMeetings,
        noShowMeetings,
        rescheduledMeetings,
        cancelledMeetings,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        totalRevenue,
        averageRevenue: Math.round(averageRevenue * 100) / 100,
        meetingsByLocation,
        meetingsByType,
        meetingsByDay
      };
    } catch (error) {
      console.error('Error getting meeting analytics:', error);
      throw error;
    }
  }

  // Get agent performance analytics
  static async getAgentPerformance(startDate?: string, endDate?: string): Promise<AgentPerformance[]> {
    try {
      const { data, error } = await supabase.rpc('get_agent_performance', {
        start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting agent performance:', error);
      throw error;
    }
  }

  // Get phone number profile with interactions
  static async getPhoneNumberProfile(phoneNumber: string): Promise<PhoneNumberProfile | null> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('phone_number_profiles')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      if (!profile) return null;

      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('profile_id', profile.profile_id)
        .order('interaction_date', { ascending: false });

      if (interactionsError) throw interactionsError;

      return {
        profileId: profile.profile_id,
        phoneNumber: profile.phone_number,
        firstContactDate: profile.first_contact_date,
        lastContactDate: profile.last_contact_date,
        totalCalls: profile.total_calls,
        totalAnswered: profile.total_answered,
        totalMeetingsScheduled: profile.total_meetings_scheduled,
        totalMeetingsAttended: profile.total_meetings_attended,
        status: profile.status,
        interestLevel: profile.interest_level,
        leadSource: profile.lead_source,
        leadQualityScore: profile.lead_quality_score,
        interactions: interactions?.map(interaction => ({
          interactionId: interaction.interaction_id,
          interactionType: interaction.interaction_type,
          interactionDate: interaction.interaction_date,
          outcome: interaction.outcome,
          details: interaction.details,
          duration: interaction.duration_seconds
        })) || []
      };
    } catch (error) {
      console.error('Error getting phone number profile:', error);
      throw error;
    }
  }

  // Get dashboard overview with all key metrics
  static async getDashboardOverview(startDate?: string, endDate?: string): Promise<DashboardOverview> {
    try {
      const [callAnalytics, meetingAnalytics] = await Promise.all([
        this.getCallAnalytics(startDate, endDate),
        this.getMeetingAnalytics(startDate, endDate)
      ]);

      // Get AI ratings
      const { data: aiRatings } = await supabase
        .from('calls')
        .select('ai_rating_quality')
        .not('ai_rating_quality', 'is', null);

      const averageCallQuality = aiRatings && aiRatings.length > 0 ? 
        aiRatings.reduce((sum, rating) => sum + rating.ai_rating_quality, 0) / aiRatings.length : 0;

      // Calculate calls to meetings ratio
      const averageCallsToMeeting = meetingAnalytics.totalMeetings > 0 ? 
        callAnalytics.totalCalls / meetingAnalytics.totalMeetings : 0;

      return {
        totalDialed: callAnalytics.totalCalls,
        totalAnswered: callAnalytics.answeredCalls,
        totalNotAnswered: callAnalytics.missedCalls + callAnalytics.voicemailCalls,
        totalInterested: 0, // Will be calculated based on call outcomes
        totalNotInterested: 0, // Will be calculated based on call outcomes
        totalCallbacks: callAnalytics.callbacksScheduled,
        totalMeetingsBooked: callAnalytics.meetingsScheduled,
        totalMeetingsAttended: meetingAnalytics.attendedMeetings,
        averageCallsToMeeting: Math.round(averageCallsToMeeting * 100) / 100,
        aiRatings: {
          averageCallQuality: Math.round(averageCallQuality * 100) / 100,
          averageLeadQuality: 0, // To be implemented
          averageVoiceAssistant: 0 // To be implemented
        },
        locationAnalysis: meetingAnalytics.meetingsByLocation,
        dailyTrends: callAnalytics.callsByDay.map(day => ({
          date: day.date,
          calls: day.calls,
          meetings: 0 // Will be joined with meeting data
        }))
      };
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      throw error;
    }
  }

  // Helper methods
  private static groupByField(items: any[], field: string): Array<{ [key: string]: any; count: number }> {
    const grouped = items.reduce((acc, item) => {
      const value = item[field] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([key, count]) => ({
      [field === 'call_outcome' ? 'outcome' : field]: key,
      count: count as number
    }));
  }

  private static groupCallsByTimeInterval(calls: any[], interval: string): Array<{ date: string; calls: number; answered: number }> {
    const grouped = calls.reduce((acc, call) => {
      const date = new Date(call.start_time);
      let key: string;

      switch (interval) {
        case 'hourly':
          key = date.toISOString().substring(0, 13) + ':00:00Z';
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = date.toISOString().substring(0, 7) + '-01';
          break;
        default: // daily
          key = date.toISOString().split('T')[0];
          break;
      }

      if (!acc[key]) {
        acc[key] = { calls: 0, answered: 0 };
      }
      acc[key].calls++;
      if (call.call_outcome === 'answered') {
        acc[key].answered++;
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, data]: [string, any]) => ({
        date,
        calls: data.calls,
        answered: data.answered
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static groupCallsByHour(calls: any[]): Array<{ hour: number; calls: number }> {
    const grouped = calls.reduce((acc, call) => {
      const hour = new Date(call.start_time).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      calls: grouped[hour] || 0
    }));
  }

  private static groupMeetingsByDay(meetings: any[]): Array<{ date: string; meetings: number; attended: number }> {
    const grouped = meetings.reduce((acc, meeting) => {
      const date = new Date(meeting.scheduled_time).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { meetings: 0, attended: 0 };
      }
      acc[date].meetings++;
      if (meeting.outcome === 'attended') {
        acc[date].attended++;
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, data]: [string, any]) => ({
        date,
        meetings: data.meetings,
        attended: data.attended
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}