'use client'

import { useState, useEffect } from 'react'
import { getCallAnalytics, getLeadAnalytics, getMeetingAnalytics } from '@/services/analytics'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
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
import { TestCallPanel } from '@/components/dashboard/TestCallPanel'
import { DebugPanel } from '@/components/debug/DebugPanel'
import { CallManagementMetrics } from '@/components/dashboard/CallManagementMetrics'
import { VapiCallPanel } from '@/components/dashboard/VapiCallPanel'
import { EnhancedCallAnalytics } from '@/components/dashboard/EnhancedCallAnalytics'
import { MeetingsAnalytics } from '@/components/dashboard/MeetingsAnalytics'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ArrowUpRight, ArrowDownRight, Phone, PhoneOff, Clock, Users, Calendar, BarChart3, PieChart, TrendingUp, Award } from 'lucide-react'

interface Call {
  id: string
  call_id: string
  lead_id: string
  phone_number: string
  call_type: string
  call_status: string
  call_outcome?: string
  timestamp: string
  end_time?: string
  call_duration?: number
  recording_url?: string
  transcript?: string
  summary?: string
  meeting_scheduled?: boolean
  meeting_time?: string
  callback_scheduled?: boolean
  callback_time?: string
  created_at: string
  updated_at: string
  metadata?: any

  // Compatibility fields
  leadId?: string
  leadName?: string
  leadPhone?: string
  callType?: string
  callStatus?: string
  callDuration?: number
  audioUrl?: string
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
  const [meetingAnalytics, setMeetingAnalytics] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [callData, leadData, meetingData] = await Promise.all([
          getCallAnalytics(),
          getLeadAnalytics(),
          getMeetingAnalytics()
        ])
        setCallAnalytics(callData)
        setLeadAnalytics(leadData)
        setMeetingAnalytics(meetingData)
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
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4">
                <Skeleton className="h-6 w-24 mb-2" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-12 w-16 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-[200px] w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-[200px] w-full" />
              </div>
            </CardContent>
          </Card>
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

  // Calculate dashboard stats from our new analytics data
  const dashboardStats: DashboardStats = {
    totalLeads: leadAnalytics?.totalLeads || 0,
    conversionRate: callAnalytics?.answeredCalls && callAnalytics.totalCalls ? (callAnalytics.answeredCalls / callAnalytics.totalCalls) * 100 : 0,
    revenue: 0,
    agentScore: 0,
    changes: {
      leads: 0,
      conversion: 0,
      revenue: 0,
      score: 0
    }
  }

  // Prepare call metrics for display
  const callMetrics = {
    total: callAnalytics?.totalCalls || 0,
    answered: callAnalytics?.answeredCalls || 0,
    missed: callAnalytics?.missedCalls || 0,
    voicemail: callAnalytics?.voicemailCalls || 0,
    failed: callAnalytics?.failedCalls || 0,
    avgDuration: callAnalytics?.averageCallDuration || 0,
    answerRate: callAnalytics?.answerRate || 0,
    meetingsScheduled: callAnalytics?.meetingsScheduled || 0,
    callbacksScheduled: callAnalytics?.callbacksScheduled || 0
  }

  // Categorize calls by duration for quality metrics
  const callQuality = {
    excellent: callAnalytics?.calls ? callAnalytics.calls.filter((call: Call) => call.call_duration && call.call_duration >= 300).length : 0,
    good: callAnalytics?.calls ? callAnalytics.calls.filter((call: Call) => call.call_duration && call.call_duration >= 120 && call.call_duration < 300).length : 0,
    poor: callAnalytics?.calls ? callAnalytics.calls.filter((call: Call) => !call.call_duration || call.call_duration < 120).length : 0
  }

  // Format call status data for charts
  const callStatusData = callAnalytics?.callsByStatus?.map(item => ({
    name: item.status,
    value: item.count
  })) || []

  // Format call outcome data for charts
  const callOutcomeData = callAnalytics?.callsByOutcome?.map(item => ({
    name: item.outcome,
    value: item.count
  })) || []

  // Format team members data based on actual call data
  // Get agent data from the API or use a placeholder if no data is available
  const teamMembers = callAnalytics?.agents?.length > 0 ?
    callAnalytics.agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}`,
      calls: agent.calls || 0,
      conversions: agent.conversions || 0,
      avgDuration: agent.avgDuration || 0
    })) :
    // If no agent data is available, use system data
    [{
      id: 'system',
      name: 'System',
      avatar: 'https://ui-avatars.com/api/?name=System',
      calls: callAnalytics?.totalCalls || 0,
      conversions: callAnalytics?.answeredCalls || 0,
      avgDuration: callAnalytics?.averageCallDuration || 0
    }]

  // The callsByDay data is already in the correct format with date and calls properties
  const callTrendsData = callAnalytics?.callsByDay || []

  return (
    <div className="flex-1 space-y-4 p-4 pt-4 md:p-6 md:pt-6 lg:p-8 lg:pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time analytics for your call center operations</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector onChange={setDateRange} />
          <Button variant="outline" size="sm" className="ml-2">
            <Calendar className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{callAnalytics?.totalCalls || 0}</div>
                {callAnalytics?.totalCalls > 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>Total calls tracked in system</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>No calls tracked yet</span>
                  </div>
                )}
                <Progress className="mt-2" value={callAnalytics?.totalCalls > 0 ? 100 : 0} />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Answered Calls</CardTitle>
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{callAnalytics?.answeredCalls || 0}</div>
                {callAnalytics?.answeredCalls > 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>Answer rate: {((callAnalytics?.answerRate || 0).toFixed(1))}%</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>No answered calls yet</span>
                  </div>
                )}
                <Progress className="mt-2" value={callAnalytics?.answerRate || 0} />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Missed Calls</CardTitle>
                  <PhoneOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{callAnalytics?.missedCalls || 0}</div>
                {callAnalytics?.missedCalls > 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>Missed call rate: {callAnalytics?.totalCalls > 0 ? ((callAnalytics.missedCalls / callAnalytics.totalCalls) * 100).toFixed(1) : 0}%</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>No missed calls</span>
                  </div>
                )}
                <Progress className="mt-2" value={callAnalytics?.totalCalls > 0 ? (callAnalytics.missedCalls / callAnalytics.totalCalls) * 100 : 0} />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {callAnalytics?.averageCallDuration ? `${Math.round(callAnalytics.averageCallDuration)}s` : 'N/A'}
                </div>
                {callAnalytics?.averageCallDuration > 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>Average for answered calls</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>No duration data available</span>
                  </div>
                )}
                <Progress className="mt-2" value={callAnalytics?.averageCallDuration > 0 ? 100 : 0} />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{meetingAnalytics?.totalMeetings || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {meetingAnalytics?.totalMeetings > 0 ? (
                    <span>Total scheduled meetings</span>
                  ) : (
                    <span>No meetings scheduled yet</span>
                  )}
                </div>
                <Progress className="mt-2" value={meetingAnalytics?.totalMeetings > 0 ? 100 : 0} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Call Metrics</CardTitle>
                  <p className="text-xs text-muted-foreground">Detailed call performance metrics</p>
                </div>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CallMetrics metrics={callMetrics} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Call Quality</CardTitle>
                  <p className="text-xs text-muted-foreground">Distribution by call duration</p>
                </div>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CallQualityChart quality={callQuality} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Call Trends</CardTitle>
                  <p className="text-xs text-muted-foreground">Daily call volume over time</p>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CallTrends data={callTrendsData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Team Performance</CardTitle>
                  <p className="text-xs text-muted-foreground">Agent performance metrics</p>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <TeamPerformance members={teamMembers} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Real-time Call Monitoring</CardTitle>
                  <p className="text-xs text-muted-foreground">Live call status and metrics</p>
                </div>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <RealTimeCallMonitoring />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Call Management</CardTitle>
                  <p className="text-xs text-muted-foreground">Manage and monitor active calls</p>
                </div>
              </CardHeader>
              <CardContent>
                <CallManagementMetrics />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Make a Test Call</CardTitle>
                  <p className="text-xs text-muted-foreground">Test the VAPI integration</p>
                </div>
              </CardHeader>
              <CardContent>
                <VapiCallPanel />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Meetings Analytics</CardTitle>
                  <p className="text-xs text-muted-foreground">Detailed metrics on scheduled meetings</p>
                </div>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <MeetingsAnalytics
                  totalMeetings={meetingAnalytics?.totalMeetings || 0}
                  offplanMeetings={meetingAnalytics?.offplanMeetings || 0}
                  secondaryMeetings={meetingAnalytics?.secondaryMeetings || 0}
                  costPerMeeting={meetingAnalytics?.costPerMeeting || 0}
                  totalCost={meetingAnalytics?.totalCost || 0}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Lead Performance</CardTitle>
                  <p className="text-xs text-muted-foreground">Conversion metrics and lead quality</p>
                </div>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <LeadPerformance />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Customer Feedback</CardTitle>
                  <p className="text-xs text-muted-foreground">Sentiment analysis from calls</p>
                </div>
              </CardHeader>
              <CardContent>
                <CustomerFeedback />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Enhanced Call Analytics</CardTitle>
                  <p className="text-xs text-muted-foreground">Advanced metrics and insights</p>
                </div>
              </CardHeader>
              <CardContent>
                <EnhancedCallAnalytics />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Alerts & Notifications</CardTitle>
                  <p className="text-xs text-muted-foreground">System alerts and notifications</p>
                </div>
              </CardHeader>
              <CardContent>
                <AlertsNotifications />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Debug Panel</CardTitle>
                  <p className="text-xs text-muted-foreground">System diagnostics</p>
                </div>
              </CardHeader>
              <CardContent>
                <DebugPanel />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
