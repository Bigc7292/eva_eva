'use client'

import { useState, useEffect } from 'react'
import { getCallAnalytics, getLeadAnalytics } from '@/services/analytics'
import { Card } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { RealTimeCallMonitoring } from '@/components/dashboard/RealTimeCallMonitoring'
import { CallMetrics } from '@/components/dashboard/CallMetrics'
import { CallQualityChart } from '@/components/dashboard/CallQualityChart'
import { LeadPerformance } from '@/components/dashboard/LeadPerformance'
import { TeamPerformance } from '@/components/dashboard/TeamPerformance'
import { CallTrends } from '@/components/dashboard/CallTrends'
import { CustomerFeedback } from '@/components/dashboard/CustomerFeedback'
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector'
import { AlertsNotifications } from '@/components/dashboard/AlertsNotifications'
import { SocialMediaIntegration } from '@/components/dashboard/SocialMediaIntegration'
import { TestCallPanel } from '@/components/dashboard/TestCallPanel'
import { CardHeader } from '@/components/ui/card'
import { CardTitle } from '@/components/ui/card'
import { CardContent } from '@/components/ui/card'
import { DebugPanel } from '@/components/debug/DebugPanel'

interface Call {
  id: string
  call_id: string
  status: string
  start_time: string
  customer_phone: string
  call_type: 'inbound' | 'outbound'
  call_duration: number
  agent_id: string
  agent_name: string
}

interface CallTrendsProps {
  data: Array<{
    date: string
    calls: number
  }>
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
    score: number
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [callAnalytics, setCallAnalytics] = useState<any>(null)
  const [leadAnalytics, setLeadAnalytics] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [callData, leadData] = await Promise.all([
          getCallAnalytics(),
          getLeadAnalytics()
        ])
        setCallAnalytics(callData)
        setLeadAnalytics(leadData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        console.error('Error fetching analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">Your CRM analytics overview</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dashboardStats: DashboardStats = {
    totalLeads: leadAnalytics?.totalLeads || 0,
    conversionRate: callAnalytics?.completedCalls && callAnalytics.totalCalls ? (callAnalytics.completedCalls / callAnalytics.totalCalls) * 100 : 0,
    revenue: 0,
    agentScore: 0,
    changes: {
      leads: 0,
      conversion: 0,
      revenue: 0,
      score: 0
    }
  }

  const callMetrics = {
    total: callAnalytics?.totalCalls || 0,
    outbound: callAnalytics?.outboundCalls || 0,
    inbound: callAnalytics?.inboundCalls || 0,
    avgDuration: callAnalytics?.averageCallDuration || 0,
    conversionRate: callAnalytics?.completedCalls ? (callAnalytics.completedCalls / callAnalytics.totalCalls) * 100 : 0
  }

  const callQuality = {
    excellent: callAnalytics?.calls ? callAnalytics.calls.filter((call: Call) => call.call_duration >= 300).length : 0,
    good: callAnalytics?.calls ? callAnalytics.calls.filter((call: Call) => call.call_duration >= 120 && call.call_duration < 300).length : 0,
    poor: callAnalytics?.calls ? callAnalytics.calls.filter((call: Call) => call.call_duration < 120).length : 0
  }

  const teamMembers = callAnalytics?.callsByAgent ? callAnalytics.callsByAgent.map((agent: any, index: number) => ({
    id: agent.agent_id || `unknown-${index}`,
    name: agent.agent_name || `Unknown Agent ${index + 1}`,
    avatar: `https://ui-avatars.com/api/?name=${agent.agent_name || 'Unknown'}&background=random`,
    calls: agent.calls?.length || 0,
    conversions: agent.calls?.filter((call: Call) => call.status === 'completed')?.length || 0,
    avgDuration: agent.calls?.length ? agent.calls.reduce((acc: number, call: Call) => acc + (call.call_duration || 0), 0) / agent.calls.length : 0
  })) : []

  // The callsByDay data is already in the correct format with date and calls properties
  const callTrendsData = callAnalytics?.callsByDay || []

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <DashboardHeader stats={dashboardStats as DashboardStats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callAnalytics?.totalCalls || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Successful Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callAnalytics?.completedCalls || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Missed Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callAnalytics?.missedCalls || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {callAnalytics?.averageCallDuration ? `${Math.round(callAnalytics.averageCallDuration)}s` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <CallMetrics metrics={callMetrics} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Call Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <CallQualityChart quality={callQuality} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadPerformance />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamPerformance members={teamMembers} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <CallTrends data={callTrendsData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerFeedback />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Real-time Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <RealTimeCallMonitoring />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsNotifications />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Social Media Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <SocialMediaIntegration />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Test Outbound Call</CardTitle>
          </CardHeader>
          <CardContent>
            <TestCallPanel />
          </CardContent>
        </Card>
      </div>

      <DebugPanel />
    </div>
  )
}
