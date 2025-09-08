import * as XLSX from 'xlsx'
import type { CallMetrics } from '@/types/analytics'

export const excelExport = {
  generateWorkbook(metrics: CallMetrics) {
    const wb = XLSX.utils.book_new()

    // Overview Sheet
    const overviewData = [
      ['Metric', 'Value'],
      ['Total Calls', metrics.total],
      ['Outbound Calls', metrics.outbound],
      ['Inbound Calls', metrics.inbound],
      ['Average Duration (min)', Math.round(metrics.avgDuration / 60)],
      ['Conversion Rate (%)', metrics.conversionRate.toFixed(1)]
    ]
    const overviewWS = XLSX.utils.aoa_to_sheet(overviewData)
    XLSX.utils.book_append_sheet(wb, overviewWS, 'Overview')

    // Daily Trends Sheet
    const trendsData = [
      ['Date', 'Number of Calls'],
      ...Object.entries(metrics.dailyTrends)
    ]
    const trendsWS = XLSX.utils.aoa_to_sheet(trendsData)
    XLSX.utils.book_append_sheet(wb, trendsWS, 'Daily Trends')

    // Property Types Sheet
    const propertyData = [
      ['Property Type', 'Number of Leads'],
      ...Object.entries(metrics.byPropertyType)
    ]
    const propertyWS = XLSX.utils.aoa_to_sheet(propertyData)
    XLSX.utils.book_append_sheet(wb, propertyWS, 'Property Types')

    // Call Quality Sheet
    const qualityData = [
      ['Quality Level', 'Count'],
      ['Excellent', metrics.callQuality.excellent],
      ['Good', metrics.callQuality.good],
      ['Poor', metrics.callQuality.poor]
    ]
    const qualityWS = XLSX.utils.aoa_to_sheet(qualityData)
    XLSX.utils.book_append_sheet(wb, qualityWS, 'Call Quality')

    return wb
  },

  downloadExcel(metrics: CallMetrics) {
    const wb = this.generateWorkbook(metrics)
    const fileName = `call_metrics_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // Generate buffer and create download
    XLSX.writeFile(wb, fileName)
  }
} 