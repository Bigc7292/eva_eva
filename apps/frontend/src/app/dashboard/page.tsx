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
import { GoogleCalendarWidget } from '@/components/dashboard/GoogleCalendarWidget'
import { PredictiveAnalyticsWidget } from '@/components/dashboard/PredictiveAnalyticsWidget'
import { EnhancedAnalyticsWidget } from '@/components/dashboard/EnhancedAnalyticsWidget'
import { EnhancedCallQualityWidget } from '@/components/dashboard/EnhancedCallQualityWidget'
import { EnhancedCallTrendsWidget } from '@/components/dashboard/EnhancedCallTrendsWidget'
import { EnhancedTeamPerformanceWidget } from '@/components/dashboard/EnhancedTeamPerformanceWidget'
import { EnhancedMeetingStatisticsWidget } from '@/components/dashboard/EnhancedMeetingStatisticsWidget'
import { EnhancedLeadPerformanceWidget } from '@/components/dashboard/EnhancedLeadPerformanceWidget'
import { EnhancedCustomerFeedbackWidget } from '@/components/dashboard/EnhancedCustomerFeedbackWidget'
import { EnhancedAlertsNotificationsWidget } from '@/components/dashboard/EnhancedAlertsNotificationsWidget'
import { EnhancedDebugPanelWidget } from '@/components/dashboard/EnhancedDebugPanelWidget'
import { EnhancedGoogleCalendar } from '@/components/dashboard/EnhancedGoogleCalendar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ArrowUpRight, ArrowDownRight, Phone, PhoneOff, Clock, Users, Calendar, BarChart3, PieChart, TrendingUp, Award, Download, Brain } from 'lucide-react'

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
  metadata?: Record<string, unknown>

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
  const [callAnalytics, setCallAnalytics] = useState<Record<string, unknown> | null>(null)
  const [leadAnalytics, setLeadAnalytics] = useState<Record<string, unknown> | null>(null)
  const [meetingAnalytics, setMeetingAnalytics] = useState<Record<string, unknown> | null>(null)
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
    callAnalytics.agents.map((agent: Record<string, unknown>) => ({
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

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950 dark:to-indigo-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{meetingAnalytics?.scheduled_meetings || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <span>Total scheduled meetings</span>
                </div>
                <Progress className="mt-2" value={meetingAnalytics?.scheduled_meetings ? 100 : 0} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
            <EnhancedAnalyticsWidget />
            <EnhancedCallQualityWidget quality={callQuality} />
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
            <EnhancedCallTrendsWidget data={callTrendsData} />
            <EnhancedTeamPerformanceWidget members={teamMembers} />
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
            <EnhancedGoogleCalendar
              fullHeight={true}
              autoRefresh={true}
              refreshInterval={60000}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EnhancedMeetingStatisticsWidget
              totalMeetings={meetingAnalytics?.total_meetings || 0}
              completedMeetings={meetingAnalytics?.completed_meetings || 0}
              cancelledMeetings={meetingAnalytics?.cancelled_meetings || 0}
              scheduledMeetings={meetingAnalytics?.scheduled_meetings || 0}
            />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Export Options</CardTitle>
                  <p className="text-xs text-muted-foreground">Download meeting data</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Export Format</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-3.5 w-3.5 mr-1" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-3.5 w-3.5 mr-1" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Excel
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Date Range</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">This Week</Button>
                      <Button variant="outline" size="sm" className="flex-1">This Month</Button>
                      <Button variant="outline" size="sm" className="flex-1">Custom</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  totalMeetings={meetingAnalytics?.total_meetings || 0}
                  completedMeetings={meetingAnalytics?.completed_meetings || 0}
                  cancelledMeetings={meetingAnalytics?.cancelled_meetings || 0}
                  scheduledMeetings={meetingAnalytics?.scheduled_meetings || 0}
                  locations={meetingAnalytics?.locations || []}
                  types={meetingAnalytics?.types || []}
                  costPerMeeting={meetingAnalytics?.avg_cost_per_meeting || 0}
                  totalCost={meetingAnalytics?.total_cost || 0}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
            <EnhancedLeadPerformanceWidget />
            <EnhancedCustomerFeedbackWidget />
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
            <EnhancedAlertsNotificationsWidget />
            <EnhancedDebugPanelWidget />
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
