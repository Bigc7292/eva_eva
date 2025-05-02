'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ArrowDown, ArrowUp, DollarSign, Target, Users } from 'lucide-react'
import { supabase } from '@/lib/services/supabase'

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

interface DashboardStats {
  totalLeads: number
  conversionRate: number
  revenue: number
  agentScore: number
  changes: {
    leads: number
    conversion: number
    revenue: number
    agentScore: number
  }
}

const MetricCard = ({ title, value, change, icon, trend = 'neutral' }: MetricCardProps) => {
  // Define gradient classes based on trend
  const gradientClass =
    trend === 'up' ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800' :
    trend === 'down' ? 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800' :
    'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800';

  // Define icon background classes based on trend
  const iconBgClass =
    trend === 'up' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
    trend === 'down' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' :
    'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';

  // Define text color classes based on trend
  const textColorClass =
    trend === 'up' ? 'text-green-600 dark:text-green-400' :
    trend === 'down' ? 'text-red-600 dark:text-red-400' :
    'text-blue-600 dark:text-blue-400';

  return (
    <Card className={`p-4 shadow-sm hover:shadow-md transition-all duration-300 ${gradientClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-full ${iconBgClass} flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center">
        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${iconBgClass} mr-2`}>
          {trend === 'up' ? (
            <ArrowUp className="h-3 w-3" />
          ) : trend === 'down' ? (
            <ArrowDown className="h-3 w-3" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-current" />
          )}
        </div>
        <span className={`text-sm font-medium ${textColorClass}`}>
          {change > 0 ? '+' : ''}{change}% from last period
        </span>
      </div>
    </Card>
  )
}

export function DashboardHeader() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    conversionRate: 0,
    revenue: 0,
    agentScore: 0,
    changes: {
      leads: 0,
      conversion: 0,
      revenue: 0,
      agentScore: 0
    }
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch contacts count
      const { count: totalLeads, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })

      if (contactsError) throw contactsError

      // Fetch calls data
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')

      if (callsError) throw callsError

      // Calculate call statistics
      const totalCalls = callsData?.length || 0
      const answeredCalls = callsData?.filter(call => {
        const status = String(call.call_status || '').toLowerCase();
        return status === 'completed' || status === 'answered' || status === 'ended';
      })?.length || 0

      const conversionRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0

      // Calculate agent score based on call metrics
      const callsWithTranscript = callsData?.filter(call => call.transcript)?.length || 0
      const callsWithSummary = callsData?.filter(call => call.summary)?.length || 0
      const callsWithRecording = callsData?.filter(call => call.recording_url || call.audio_url)?.length || 0

      const agentScore = totalCalls > 0
        ? Math.round(((answeredCalls / totalCalls) * 0.5 +
           (callsWithTranscript / totalCalls) * 0.2 +
           (callsWithSummary / totalCalls) * 0.2 +
           (callsWithRecording / totalCalls) * 0.1) * 100)
        : 0

      // Calculate estimated revenue (placeholder)
      const avgDealValue = 250000 // $250k average deal value
      const conversionToSale = 0.1 // 10% of conversions become sales
      const estimatedRevenue = (answeredCalls * conversionToSale * avgDealValue) / 1000000 // in millions

      setStats({
        totalLeads: totalLeads || 0,
        conversionRate,
        revenue: estimatedRevenue,
        agentScore,
        changes: {
          leads: 5, // Placeholder for now
          conversion: 2, // Placeholder for now
          revenue: 3, // Placeholder for now
          agentScore: 8 // Placeholder for now
        }
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Leads Generated"
        value={stats.totalLeads.toString()}
        change={stats.changes.leads}
        icon={<Users className="h-6 w-6" />}
        trend={stats.changes.leads > 0 ? 'up' : stats.changes.leads < 0 ? 'down' : 'neutral'}
      />
      <MetricCard
        title="Conversion Rate"
        value={`${stats.conversionRate.toFixed(1)}%`}
        change={stats.changes.conversion}
        icon={<Target className="h-6 w-6" />}
        trend={stats.changes.conversion > 0 ? 'up' : stats.changes.conversion < 0 ? 'down' : 'neutral'}
      />
      <MetricCard
        title="Revenue Impact"
        value={`$${stats.revenue.toFixed(1)}M`}
        change={stats.changes.revenue}
        icon={<DollarSign className="h-6 w-6" />}
        trend={stats.changes.revenue > 0 ? 'up' : stats.changes.revenue < 0 ? 'down' : 'neutral'}
      />
      <MetricCard
        title="AI Agent Performance"
        value={`${stats.agentScore}/100`}
        change={stats.changes.agentScore}
        icon={<Users className="h-6 w-6" />}
        trend={stats.changes.agentScore > 0 ? 'up' : stats.changes.agentScore < 0 ? 'down' : 'neutral'}
      />
    </div>
  )
}
