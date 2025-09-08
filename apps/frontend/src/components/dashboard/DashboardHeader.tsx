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
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')

      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')

      if (leadsError || callsError) throw leadsError || callsError

      // Calculate real statistics
      const totalLeads = leadsData?.length || 0
      const successfulCalls = callsData?.filter(call => call.status === 'completed')?.length || 0
      const conversionRate = callsData?.length ? (successfulCalls / callsData.length) * 100 : 0
      
      setStats({
        totalLeads,
        conversionRate,
        revenue: 0, // TODO: Add revenue calculation when available
        agentScore: 0, // TODO: Add agent score calculation when available
        changes: {
          leads: 0,
          conversion: 0,
          revenue: 0,
          agentScore: 0
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
