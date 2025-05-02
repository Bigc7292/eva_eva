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
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${
          trend === 'up' ? 'bg-green-100 text-green-600' :
          trend === 'down' ? 'bg-red-100 text-red-600' :
          'bg-blue-100 text-blue-600'
        }`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-center">
        {trend === 'up' ? (
          <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
        ) : trend === 'down' ? (
          <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
        ) : null}
        <span className={`text-sm ${
          trend === 'up' ? 'text-green-600' :
          trend === 'down' ? 'text-red-600' :
          'text-muted-foreground'
        }`}>
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
