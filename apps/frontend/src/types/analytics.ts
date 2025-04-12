export interface CallMetrics {
  total: number
  outbound: number
  inbound: number
  avgDuration: number
  conversionRate: number
  callQuality: {
    excellent: number
    good: number
    poor: number
  }
  dailyTrends: Record<string, number>
  byPropertyType: Record<string, number>
  teamStats: {
    id: string
    name: string
    avatar: string
    calls: number
    conversions: number
    avgDuration: number
  }[]
  teamSkills: {
    communication: number
    problemSolving: number
    productKnowledge: number
    closingAbility: number
    customerService: number
  }[]
}

export interface DateRange {
  start: Date
  end: Date
}

export type TimeFrame = '7d' | '30d' | '90d' | 'custom' 