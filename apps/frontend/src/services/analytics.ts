import type { CallMetrics, DateRange } from '@/types/analytics'
import { format } from 'date-fns'
import { excelExport } from '@/utils/excel'
import { dummyCalls, dummyCallAnalytics, dummyLeadAnalytics, CallAnalytics, LeadAnalytics } from '@/lib/dummy-data'
import { simpleLogger } from '@/components/debug/SimpleLogger'

export const analyticsService = {
  async getCallMetrics(dateRange: DateRange): Promise<CallMetrics> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600))

    // Filter calls by date range
    const data = dummyCalls.filter(call => {
      const callDate = new Date(call.timestamp)
      return callDate >= dateRange.start && callDate <= dateRange.end
    })

    return {
      total: data.length,
      outbound: data.filter(c => c.callType === 'Outbound').length,
      inbound: data.filter(c => c.callType === 'Inbound').length,
      avgDuration: this.calculateAvgDuration(data),
      conversionRate: 0.35, // Dummy conversion rate
      byPropertyType: this.groupByPropertyType(data),
      dailyTrends: this.getDailyTrends(data),
      // Additional metrics
      byLocation: this.groupByLocation(data),
      byBudget: this.groupByBudget(data),
      callQuality: this.analyzeCallQuality(data)
    }
  },

  // Export functionality
  async exportMetrics(dateRange: DateRange, format: 'csv' | 'excel') {
    const metrics = await this.getCallMetrics(dateRange)

    if (format === 'csv') {
      return this.generateCSV(metrics)
    } else {
      return excelExport.downloadExcel(metrics)
    }
  },

  // Get dashboard stats
  async getDashboardStats() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 700))

    return {
      totalLeads: dummyLeadAnalytics.totalLeads,
      newLeadsToday: dummyLeadAnalytics.newLeadsToday,
      totalCalls: dummyCallAnalytics.totalCalls,
      missedCalls: dummyCallAnalytics.missedCalls,
      completedCalls: dummyCallAnalytics.completedCalls,
      averageCallDuration: dummyCallAnalytics.averageCallDuration,
      leadsConversionRate: dummyLeadAnalytics.leadsConversionRate,
      callsByDay: dummyCallAnalytics.callsByDay,
      leadsByStatus: dummyLeadAnalytics.leadsByStatus,
      callsByType: dummyCallAnalytics.callsByType
    }
  },

  // Get call analytics
  async getCallAnalytics(): Promise<CallAnalytics> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600))
    return dummyCallAnalytics
  },

  // Get lead analytics
  async getLeadAnalytics(): Promise<LeadAnalytics> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return dummyLeadAnalytics
  },

  // Additional analysis methods
  analyzeCallQuality(calls: any[]) {
    return calls.reduce((acc, call) => {
      const duration = call.callDuration || 0
      if (duration > 300) acc.excellent++
      else if (duration > 120) acc.good++
      else acc.poor++
      return acc
    }, { excellent: 0, good: 0, poor: 0 })
  },

  groupByLocation(calls: any[]) {
    return dummyLeads.reduce((acc, lead) => {
      acc[lead.location] = (acc[lead.location] || 0) + 1
      return acc
    }, {})
  },

  groupByBudget(calls: any[]) {
    return dummyLeads.reduce((acc, lead) => {
      acc[lead.budgetRange] = (acc[lead.budgetRange] || 0) + 1
      return acc
    }, {})
  },

  private generateCSV(metrics: CallMetrics): string {
    // Implementation for CSV generation
    const rows = [
      ['Date', 'Total Calls', 'Outbound', 'Inbound', 'Conversion Rate'],
      ...Object.entries(metrics.dailyTrends).map(([date, count]) => [
        date,
        count,
        metrics.outbound,
        metrics.inbound,
        metrics.conversionRate
      ])
    ]
    return rows.map(row => row.join(',')).join('\n')
  },

  calculateAvgDuration(calls) {
    const completedCalls = calls.filter(c => c.callStatus === 'Completed' && c.callDuration)
    if (!completedCalls.length) return 0
    return completedCalls.reduce((acc, c) => acc + c.callDuration, 0) / completedCalls.length
  },

  groupByPropertyType(calls) {
    return dummyLeads.reduce((acc, lead) => {
      const type = lead.propertyInterest || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
  },

  getDailyTrends(calls) {
    // Group calls by date and count
    return calls.reduce((acc, call) => {
      const date = new Date(call.timestamp).toLocaleDateString()
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})
  }
}