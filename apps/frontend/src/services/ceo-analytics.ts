import { supabase } from '@/lib/services/supabase'

export interface CEOAnalytics {
  overview: {
    totalCalls: number
    totalLeads: number
    totalMeetings: number
    totalRevenue: number
    answerRate: number
    conversionRate: number
    averageCallDuration: number
    activeAgents: number
  }
  callMetrics: {
    dailyCalls: Array<{ date: string; calls: number; answered: number; missed: number }>
    callsByOutcome: Array<{ outcome: string; count: number; percentage: number }>
    callsByHour: Array<{ hour: number; calls: number }>
    callsByAgent: Array<{ agent: string; calls: number; answered: number; conversion: number }>
  }
  leadMetrics: {
    leadsBySource: Array<{ source: string; count: number; percentage: number }>
    leadsByStatus: Array<{ status: string; count: number; percentage: number }>
    leadsByQuality: Array<{ quality: string; count: number; percentage: number }>
    leadConversionFunnel: Array<{ stage: string; count: number; conversionRate: number }>
  }
  meetingMetrics: {
    meetingsScheduled: number
    meetingsAttended: number
    meetingAttendanceRate: number
    meetingsByOutcome: Array<{ outcome: string; count: number }>
    meetingsByAgent: Array<{ agent: string; scheduled: number; attended: number }>
  }
  locationAnalytics: {
    callsByLocation: Array<{ location: string; calls: number; leads: number }>
    topPerformingLocations: Array<{ location: string; conversionRate: number; revenue: number }>
    locationTrends: Array<{ location: string; trend: 'up' | 'down' | 'stable'; change: number }>
  }
  aiRatings: {
    averageCallRating: number
    averageLeadRating: number
    averageVoiceAssistantRating: number
    ratingDistribution: Array<{ rating: number; count: number }>
    topPerformingAgents: Array<{ agent: string; rating: number; calls: number }>
  }
  timeAnalytics: {
    bestPerformingHours: Array<{ hour: number; answerRate: number; conversionRate: number }>
    bestPerformingDays: Array<{ day: string; calls: number; conversions: number }>
    seasonalTrends: Array<{ month: string; calls: number; revenue: number }>
  }
  revenueMetrics: {
    totalRevenue: number
    monthlyRevenue: Array<{ month: string; revenue: number; target: number }>
    revenueBySource: Array<{ source: string; revenue: number; percentage: number }>
    averageDealSize: number
    salesFunnelData: Array<{ stage: string; value: number; count: number }>
  }
}

export const ceoAnalyticsService = {
  async getComprehensiveAnalytics(dateRange?: { start: Date; end: Date }): Promise<CEOAnalytics> {
    try {
      const [
        overview,
        callMetrics,
        leadMetrics,
        meetingMetrics,
        locationAnalytics,
        aiRatings,
        timeAnalytics,
        revenueMetrics
      ] = await Promise.all([
        this.getOverviewMetrics(dateRange),
        this.getCallMetrics(dateRange),
        this.getLeadMetrics(dateRange),
        this.getMeetingMetrics(dateRange),
        this.getLocationAnalytics(dateRange),
        this.getAIRatings(dateRange),
        this.getTimeAnalytics(dateRange),
        this.getRevenueMetrics(dateRange)
      ])

      return {
        overview,
        callMetrics,
        leadMetrics,
        meetingMetrics,
        locationAnalytics,
        aiRatings,
        timeAnalytics,
        revenueMetrics
      }
    } catch (error) {
      console.error('Error fetching CEO analytics:', error)
      throw error
    }
  },

  async getOverviewMetrics(dateRange?: { start: Date; end: Date }) {
    try {
      let dateFilter = ''
      if (dateRange) {
        dateFilter = `AND created_at >= '${dateRange.start.toISOString()}' AND created_at <= '${dateRange.end.toISOString()}'`
      }

      // Get total calls
      const { data: callsData } = await supabase
        .from('enhanced_calls')
        .select('*')
        .gte('timestamp', dateRange?.start?.toISOString() || '2024-01-01')
        .lte('timestamp', dateRange?.end?.toISOString() || new Date().toISOString())

      // Get total leads
      const { data: leadsData } = await supabase
        .from('enhanced_leads')
        .select('*')
        .gte('created_at', dateRange?.start?.toISOString() || '2024-01-01')
        .lte('created_at', dateRange?.end?.toISOString() || new Date().toISOString())

      // Get meetings
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('*')
        .gte('scheduled_date', dateRange?.start?.toISOString() || '2024-01-01')
        .lte('scheduled_date', dateRange?.end?.toISOString() || new Date().toISOString())

      // Get active agents
      const { data: agentsData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'agent')

      const totalCalls = callsData?.length || 0
      const answeredCalls = callsData?.filter(call => call.call_status === 'answered' || call.call_status === 'completed').length || 0
      const totalDuration = callsData?.reduce((sum, call) => sum + (call.call_duration || 0), 0) || 0

      const totalLeads = leadsData?.length || 0
      const convertedLeads = leadsData?.filter(lead => lead.status === 'converted' || lead.status === 'booked').length || 0

      return {
        totalCalls,
        totalLeads,
        totalMeetings: meetingsData?.length || 0,
        totalRevenue: 0, // Calculate from closed deals
        answerRate: totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        averageCallDuration: totalCalls > 0 ? totalDuration / totalCalls : 0,
        activeAgents: agentsData?.length || 0
      }
    } catch (error) {
      console.error('Error fetching overview metrics:', error)
      return {
        totalCalls: 0,
        totalLeads: 0,
        totalMeetings: 0,
        totalRevenue: 0,
        answerRate: 0,
        conversionRate: 0,
        averageCallDuration: 0,
        activeAgents: 0
      }
    }
  },

  async getCallMetrics(dateRange?: { start: Date; end: Date }) {
    try {
      const { data: callsData } = await supabase
        .from('enhanced_calls')
        .select('*')
        .gte('timestamp', dateRange?.start?.toISOString() || '2024-01-01')
        .lte('timestamp', dateRange?.end?.toISOString() || new Date().toISOString())
        .order('timestamp', { ascending: true })

      // Daily calls
      const dailyCalls = this.groupCallsByDate(callsData || [])

      // Calls by outcome
      const outcomeGroups = this.groupBy(callsData || [], 'call_outcome')
      const totalCalls = callsData?.length || 1
      const callsByOutcome = Object.entries(outcomeGroups).map(([outcome, calls]) => ({
        outcome: outcome || 'Unknown',
        count: calls.length,
        percentage: (calls.length / totalCalls) * 100
      }))

      // Calls by hour
      const callsByHour = this.groupCallsByHour(callsData || [])

      // Calls by agent
      const agentGroups = this.groupBy(callsData || [], 'metadata.agent_id')
      const callsByAgent = Object.entries(agentGroups).map(([agent, calls]) => {
        const answered = calls.filter(call => call.call_status === 'answered' || call.call_status === 'completed')
        return {
          agent: agent || 'Unknown',
          calls: calls.length,
          answered: answered.length,
          conversion: calls.length > 0 ? (answered.length / calls.length) * 100 : 0
        }
      })

      return {
        dailyCalls,
        callsByOutcome,
        callsByHour,
        callsByAgent
      }
    } catch (error) {
      console.error('Error fetching call metrics:', error)
      return {
        dailyCalls: [],
        callsByOutcome: [],
        callsByHour: [],
        callsByAgent: []
      }
    }
  },

  async getLeadMetrics(dateRange?: { start: Date; end: Date }) {
    try {
      const { data: leadsData } = await supabase
        .from('enhanced_leads')
        .select('*')
        .gte('created_at', dateRange?.start?.toISOString() || '2024-01-01')
        .lte('created_at', dateRange?.end?.toISOString() || new Date().toISOString())

      const totalLeads = leadsData?.length || 1

      // Leads by source
      const sourceGroups = this.groupBy(leadsData || [], 'source')
      const leadsBySource = Object.entries(sourceGroups).map(([source, leads]) => ({
        source: source || 'Unknown',
        count: leads.length,
        percentage: (leads.length / totalLeads) * 100
      }))

      // Leads by status
      const statusGroups = this.groupBy(leadsData || [], 'status')
      const leadsByStatus = Object.entries(statusGroups).map(([status, leads]) => ({
        status: status || 'Unknown',
        count: leads.length,
        percentage: (leads.length / totalLeads) * 100
      }))

      // Leads by quality
      const qualityGroups = this.groupBy(leadsData || [], 'lead_quality')
      const leadsByQuality = Object.entries(qualityGroups).map(([quality, leads]) => ({
        quality: quality || 'Unknown',
        count: leads.length,
        percentage: (leads.length / totalLeads) * 100
      }))

      // Conversion funnel
      const leadConversionFunnel = [
        { stage: 'Generated', count: totalLeads, conversionRate: 100 },
        { stage: 'Contacted', count: leadsData?.filter(l => l.total_calls > 0).length || 0, conversionRate: 0 },
        { stage: 'Interested', count: leadsData?.filter(l => l.status === 'interested').length || 0, conversionRate: 0 },
        { stage: 'Meeting Scheduled', count: leadsData?.filter(l => l.successful_meetings > 0).length || 0, conversionRate: 0 },
        { stage: 'Converted', count: leadsData?.filter(l => l.status === 'converted').length || 0, conversionRate: 0 }
      ]

      // Calculate conversion rates
      leadConversionFunnel.forEach((stage, index) => {
        if (index > 0) {
          stage.conversionRate = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0
        }
      })

      return {
        leadsBySource,
        leadsByStatus,
        leadsByQuality,
        leadConversionFunnel
      }
    } catch (error) {
      console.error('Error fetching lead metrics:', error)
      return {
        leadsBySource: [],
        leadsByStatus: [],
        leadsByQuality: [],
        leadConversionFunnel: []
      }
    }
  },

  async getMeetingMetrics(dateRange?: { start: Date; end: Date }) {
    try {
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('*')
        .gte('scheduled_date', dateRange?.start?.toISOString() || '2024-01-01')
        .lte('scheduled_date', dateRange?.end?.toISOString() || new Date().toISOString())

      const meetingsScheduled = meetingsData?.length || 0
      const meetingsAttended = meetingsData?.filter(m => m.status === 'attended').length || 0

      const outcomeGroups = this.groupBy(meetingsData || [], 'outcome')
      const meetingsByOutcome = Object.entries(outcomeGroups).map(([outcome, meetings]) => ({
        outcome: outcome || 'Unknown',
        count: meetings.length
      }))

      const agentGroups = this.groupBy(meetingsData || [], 'agent_id')
      const meetingsByAgent = Object.entries(agentGroups).map(([agent, meetings]) => ({
        agent: agent || 'Unknown',
        scheduled: meetings.length,
        attended: meetings.filter(m => m.status === 'attended').length
      }))

      return {
        meetingsScheduled,
        meetingsAttended,
        meetingAttendanceRate: meetingsScheduled > 0 ? (meetingsAttended / meetingsScheduled) * 100 : 0,
        meetingsByOutcome,
        meetingsByAgent
      }
    } catch (error) {
      console.error('Error fetching meeting metrics:', error)
      return {
        meetingsScheduled: 0,
        meetingsAttended: 0,
        meetingAttendanceRate: 0,
        meetingsByOutcome: [],
        meetingsByAgent: []
      }
    }
  },

  async getLocationAnalytics(dateRange?: { start: Date; end: Date }) {
    try {
      const { data: leadsData } = await supabase
        .from('enhanced_leads')
        .select('*')
        .gte('created_at', dateRange?.start?.toISOString() || '2024-01-01')
        .lte('created_at', dateRange?.end?.toISOString() || new Date().toISOString())

      const { data: callsData } = await supabase
        .from('enhanced_calls')
        .select('*')
        .gte('timestamp', dateRange?.start?.toISOString() || '2024-01-01')
        .lte('timestamp', dateRange?.end?.toISOString() || new Date().toISOString())

      // Group by location
      const locationGroups = this.groupBy(leadsData || [], 'location')
      const callsByLocation = Object.entries(locationGroups).map(([location, leads]) => {
        const locationCalls = callsData?.filter(call => 
          leads.some(lead => lead.lead_id === call.metadata?.lead_id)
        ) || []
        
        return {
          location: location || 'Unknown',
          calls: locationCalls.length,
          leads: leads.length
        }
      })

      // Top performing locations
      const topPerformingLocations = callsByLocation
        .map(loc => ({
          location: loc.location,
          conversionRate: loc.leads > 0 ? (loc.calls / loc.leads) * 100 : 0,
          revenue: 0 // Calculate from deals
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10)

      return {
        callsByLocation,
        topPerformingLocations,
        locationTrends: [] // Implement trend analysis
      }
    } catch (error) {
      console.error('Error fetching location analytics:', error)
      return {
        callsByLocation: [],
        topPerformingLocations: [],
        locationTrends: []
      }
    }
  },

  async getAIRatings(dateRange?: { start: Date; end: Date }) {
    try {
      // This would integrate with your AI rating system
      // For now, returning mock data structure
      return {
        averageCallRating: 4.2,
        averageLeadRating: 3.8,
        averageVoiceAssistantRating: 4.5,
        ratingDistribution: [
          { rating: 1, count: 5 },
          { rating: 2, count: 12 },
          { rating: 3, count: 25 },
          { rating: 4, count: 45 },
          { rating: 5, count: 67 }
        ],
        topPerformingAgents: []
      }
    } catch (error) {
      console.error('Error fetching AI ratings:', error)
      return {
        averageCallRating: 0,
        averageLeadRating: 0,
        averageVoiceAssistantRating: 0,
        ratingDistribution: [],
        topPerformingAgents: []
      }
    }
  },

  async getTimeAnalytics(dateRange?: { start: Date; end: Date }) {
    try {
      const { data: callsData } = await supabase
        .from('enhanced_calls')
        .select('*')
        .gte('timestamp', dateRange?.start?.toISOString() || '2024-01-01')
        .lte('timestamp', dateRange?.end?.toISOString() || new Date().toISOString())

      const hourlyPerformance = this.analyzeHourlyPerformance(callsData || [])
      const dailyPerformance = this.analyzeDailyPerformance(callsData || [])

      return {
        bestPerformingHours: hourlyPerformance,
        bestPerformingDays: dailyPerformance,
        seasonalTrends: []
      }
    } catch (error) {
      console.error('Error fetching time analytics:', error)
      return {
        bestPerformingHours: [],
        bestPerformingDays: [],
        seasonalTrends: []
      }
    }
  },

  async getRevenueMetrics(dateRange?: { start: Date; end: Date }) {
    try {
      // This would integrate with your revenue tracking
      // For now, returning structure for implementation
      return {
        totalRevenue: 0,
        monthlyRevenue: [],
        revenueBySource: [],
        averageDealSize: 0,
        salesFunnelData: []
      }
    } catch (error) {
      console.error('Error fetching revenue metrics:', error)
      return {
        totalRevenue: 0,
        monthlyRevenue: [],
        revenueBySource: [],
        averageDealSize: 0,
        salesFunnelData: []
      }
    }
  },

  // Helper functions
  groupBy<T>(array: T[], key: string): Record<string, T[]> {
    return array.reduce((groups: Record<string, T[]>, item: T) => {
      const value = this.getNestedValue(item, key) || 'Unknown'
      groups[value] = groups[value] || []
      groups[value].push(item)
      return groups
    }, {})
  },

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  },

  groupCallsByDate(calls: any[]) {
    const grouped = calls.reduce((acc, call) => {
      const date = new Date(call.timestamp).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, calls: 0, answered: 0, missed: 0 }
      }
      acc[date].calls++
      if (call.call_status === 'answered' || call.call_status === 'completed') {
        acc[date].answered++
      } else {
        acc[date].missed++
      }
      return acc
    }, {})

    return Object.values(grouped)
  },

  groupCallsByHour(calls: any[]) {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, calls: 0 }))
    
    calls.forEach(call => {
      const hour = new Date(call.timestamp).getHours()
      hourly[hour].calls++
    })

    return hourly
  },

  analyzeHourlyPerformance(calls: any[]) {
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      totalCalls: 0,
      answeredCalls: 0,
      answerRate: 0,
      conversionRate: 0
    }))

    calls.forEach(call => {
      const hour = new Date(call.timestamp).getHours()
      hourlyStats[hour].totalCalls++
      if (call.call_status === 'answered' || call.call_status === 'completed') {
        hourlyStats[hour].answeredCalls++
      }
    })

    hourlyStats.forEach(stat => {
      stat.answerRate = stat.totalCalls > 0 ? (stat.answeredCalls / stat.totalCalls) * 100 : 0
      stat.conversionRate = stat.answerRate // Simplified for now
    })

    return hourlyStats.sort((a, b) => b.answerRate - a.answerRate).slice(0, 10)
  },

  analyzeDailyPerformance(calls: any[]) {
    const dailyStats = {}
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    days.forEach(day => {
      dailyStats[day] = { day, calls: 0, conversions: 0 }
    })

    calls.forEach(call => {
      const dayName = days[new Date(call.timestamp).getDay()]
      dailyStats[dayName].calls++
      if (call.call_outcome === 'interested' || call.call_outcome === 'meeting_scheduled') {
        dailyStats[dayName].conversions++
      }
    })

    return Object.values(dailyStats)
  }
}