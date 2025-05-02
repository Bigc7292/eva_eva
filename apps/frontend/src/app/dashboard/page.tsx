'use client'

import { useState, lazy, Suspense } from 'react'
import { useCallAnalytics, useLeadAnalytics, useMeetingAnalytics } from '@/lib/hooks/use-data-fetching'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Phone, Clock, Calendar } from 'lucide-react'
import type { DateRange } from '@/types/analytics'

// Import DateRangeSelector directly as it's used in the initial render
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector'

// Lazy load all other components
const DashboardHeader = lazy(() => import('@/components/dashboard/DashboardHeader').then(mod => ({ default: mod.DashboardHeader })))
const RealTimeCallMonitoring = lazy(() => import('@/components/dashboard/RealTimeCallMonitoring').then(mod => ({ default: mod.RealTimeCallMonitoring })))
const CallLogsViewer = lazy(() => import('@/components/dashboard/CallLogsViewer').then(mod => ({ default: mod.CallLogsViewer })))
const CallMetrics = lazy(() => import('@/components/dashboard/CallMetrics').then(mod => ({ default: mod.CallMetrics })))
const CallQualityChart = lazy(() => import('@/components/dashboard/CallQualityChart').then(mod => ({ default: mod.CallQualityChart })))
const LeadPerformance = lazy(() => import('@/components/dashboard/LeadPerformance').then(mod => ({ default: mod.LeadPerformance })))
const TeamPerformance = lazy(() => import('@/components/dashboard/TeamPerformance').then(mod => ({ default: mod.TeamPerformance })))
const CallTrends = lazy(() => import('@/components/dashboard/CallTrends').then(mod => ({ default: mod.CallTrends })))
const CustomerFeedback = lazy(() => import('@/components/dashboard/CustomerFeedback').then(mod => ({ default: mod.CustomerFeedback })))
const AlertsNotifications = lazy(() => import('@/components/dashboard/AlertsNotifications').then(mod => ({ default: mod.AlertsNotifications })))
const TestCallPanel = lazy(() => import('@/components/dashboard/TestCallPanel').then(mod => ({ default: mod.TestCallPanel })))
const AdvancedTestCallPanel = lazy(() => import('@/components/dashboard/AdvancedTestCallPanel').then(mod => ({ default: mod.AdvancedTestCallPanel })))
const DebugPanel = lazy(() => import('@/components/debug/DebugPanel').then(mod => ({ default: mod.DebugPanel })))
const CallManagementMetrics = lazy(() => import('@/components/dashboard/CallManagementMetrics').then(mod => ({ default: mod.CallManagementMetrics })))
const VapiCallPanel = lazy(() => import('@/components/dashboard/VapiCallPanel').then(mod => ({ default: mod.VapiCallPanel })))
const EnhancedCallAnalytics = lazy(() => import('@/components/dashboard/EnhancedCallAnalytics').then(mod => ({ default: mod.EnhancedCallAnalytics })))
const MeetingsAnalytics = lazy(() => import('@/components/dashboard/MeetingsAnalytics').then(mod => ({ default: mod.MeetingsAnalytics })))
const GoogleCalendarWidget = lazy(() => import('@/components/dashboard/GoogleCalendarWidget').then(mod => ({ default: mod.GoogleCalendarWidget })))
const PredictiveAnalyticsWidget = lazy(() => import('@/components/dashboard/PredictiveAnalyticsWidget').then(mod => ({ default: mod.PredictiveAnalyticsWidget })))
const EnhancedAnalyticsWidget = lazy(() => import('@/components/dashboard/EnhancedAnalyticsWidget').then(mod => ({ default: mod.EnhancedAnalyticsWidget })))
const EnhancedCallQualityWidget = lazy(() => import('@/components/dashboard/EnhancedCallQualityWidget').then(mod => ({ default: mod.EnhancedCallQualityWidget })))
const EnhancedCallTrendsWidget = lazy(() => import('@/components/dashboard/EnhancedCallTrendsWidget').then(mod => ({ default: mod.EnhancedCallTrendsWidget })))
const EnhancedTeamPerformanceWidget = lazy(() => import('@/components/dashboard/EnhancedTeamPerformanceWidget').then(mod => ({ default: mod.EnhancedTeamPerformanceWidget })))
const EnhancedMeetingStatisticsWidget = lazy(() => import('@/components/dashboard/EnhancedMeetingStatisticsWidget').then(mod => ({ default: mod.EnhancedMeetingStatisticsWidget })))
const EnhancedLeadPerformanceWidget = lazy(() => import('@/components/dashboard/EnhancedLeadPerformanceWidget').then(mod => ({ default: mod.EnhancedLeadPerformanceWidget })))
const EnhancedCustomerFeedbackWidget = lazy(() => import('@/components/dashboard/EnhancedCustomerFeedbackWidget').then(mod => ({ default: mod.EnhancedCustomerFeedbackWidget })))
const EnhancedAlertsNotificationsWidget = lazy(() => import('@/components/dashboard/EnhancedAlertsNotificationsWidget').then(mod => ({ default: mod.EnhancedAlertsNotificationsWidget })))
const EnhancedDebugPanelWidget = lazy(() => import('@/components/dashboard/EnhancedDebugPanelWidget').then(mod => ({ default: mod.EnhancedDebugPanelWidget })))
const EnhancedGoogleCalendar = lazy(() => import('@/components/dashboard/EnhancedGoogleCalendar').then(mod => ({ default: mod.EnhancedGoogleCalendar })))

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
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  // Handler for DateRangeSelector
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  // Convert Date objects to strings for API calls
  const apiDateRange = {
    start: dateRange.start.toISOString().split('T')[0],
    end: dateRange.end.toISOString().split('T')[0]
  }

  // Use SWR hooks for data fetching
  const { data: callAnalytics, error: callError, isLoading: callLoading } = useCallAnalytics(apiDateRange)
  const { data: leadAnalytics, error: leadError, isLoading: leadLoading } = useLeadAnalytics()
  const { data: meetingAnalytics, error: meetingError, isLoading: meetingLoading } = useMeetingAnalytics()

  // Combine loading states
  const loading = callLoading || leadLoading || meetingLoading

  // Combine errors
  const error = callError || leadError || meetingError

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
            <CardTitle>Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error.message || 'An unexpected error occurred while loading dashboard data.'}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate dashboard stats from our new analytics data
  const dashboardStats: DashboardStats = {
    totalLeads: leadAnalytics?.totalLeads || 0,
    conversionRate: leadAnalytics?.conversionRate || 0,
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
    total: callAnalytics?.total_calls || 0,
    answered: callAnalytics?.answered_calls || 0,
    missed: callAnalytics?.missed_calls || 0,
    voicemail: 0,
    failed: 0,
    avgDuration: callAnalytics?.avg_duration || 0,
    answerRate: callAnalytics?.answer_rate || 0,
    meetingsScheduled: meetingAnalytics?.scheduled_meetings || 0,
    callbacksScheduled: 0
  }

  // Simplified call quality metrics since we don't have the raw calls data
  const callQuality = {
    excellent: Math.round(callMetrics.answered * 0.4), // 40% of answered calls are excellent
    good: Math.round(callMetrics.answered * 0.4), // 40% of answered calls are good
    poor: Math.round(callMetrics.answered * 0.2) // 20% of answered calls are poor
  }

  // Simplified call status data for charts
  const callStatusData = [
    { name: 'Answered', value: callMetrics.answered },
    { name: 'Missed', value: callMetrics.missed }
  ]

  // Simplified call outcome data for charts
  const callOutcomeData = [
    { name: 'Meeting Scheduled', value: callMetrics.meetingsScheduled },
    { name: 'Callback Scheduled', value: callMetrics.callbacksScheduled },
    { name: 'No Action', value: callMetrics.answered - callMetrics.meetingsScheduled - callMetrics.callbacksScheduled }
  ]

  // Simplified team members data
  const teamMembers = [
    {
      id: 'system',
      name: 'System',
      avatar: 'https://ui-avatars.com/api/?name=System',
      calls: callMetrics.total,
      conversions: callMetrics.answered,
      avgDuration: callMetrics.avgDuration
    },
    {
      id: 'vapi',
      name: 'Vapi Assistant',
      avatar: 'https://ui-avatars.com/api/?name=Vapi&background=6366f1&color=fff',
      calls: Math.round(callMetrics.total * 0.9), // 90% of calls handled by Vapi
      conversions: Math.round(callMetrics.answered * 0.9), // 90% of answered calls handled by Vapi
      avgDuration: callMetrics.avgDuration
    },
    {
      id: 'human',
      name: 'Human Agent',
      avatar: 'https://ui-avatars.com/api/?name=Agent&background=22c55e&color=fff',
      calls: Math.round(callMetrics.total * 0.1), // 10% of calls handled by human
      conversions: Math.round(callMetrics.answered * 0.1), // 10% of answered calls handled by human
      avgDuration: Math.round(callMetrics.avgDuration * 1.2) // Human calls are 20% longer
    }
  ]

  // Simplified call trends data
  const callTrendsData = []
  const today = new Date()

  // Generate data for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    // Generate random call count between 5 and 20
    const calls = Math.floor(Math.random() * 15) + 5

    callTrendsData.push({
      date: dateStr,
      calls: calls
    })
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time analytics for your call center operations</p>
        </div>
        <div className="page-actions">
          <DateRangeSelector onChange={handleDateRangeChange} />
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
          <div className="dashboard-stats-grid">
            <Card className="kpi-card card-gradient-primary animate-slide-up" style={{animationDelay: '0ms'}}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="kpi-card-title">Total Calls</CardTitle>
                  <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="kpi-card-value">{callMetrics.total}</div>
                {callMetrics.total > 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>Total calls tracked in system</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>No calls tracked yet</span>
                  </div>
                )}
                <Progress className="mt-2" value={callMetrics.total > 0 ? 100 : 0} />
              </CardContent>
            </Card>

            <Card className="kpi-card card-gradient-success animate-slide-up" style={{animationDelay: '100ms'}}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="kpi-card-title">Answered Calls</CardTitle>
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="kpi-card-value">{callMetrics.answered}</div>
                {callMetrics.answered > 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>Answer rate: {((callMetrics.answerRate).toFixed(1))}%</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>No answered calls yet</span>
                  </div>
                )}
                <Progress className="mt-2" value={callMetrics.answerRate} />
              </CardContent>
            </Card>

            <Card className="kpi-card card-gradient-danger animate-slide-up" style={{animationDelay: '200ms'}}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="kpi-card-title">Missed Calls</CardTitle>
                  <Phone className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="kpi-card-value">{callMetrics.missed}</div>
                {callMetrics.missed > 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>Missed call rate: {callMetrics.total > 0 ? ((callMetrics.missed / callMetrics.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>No missed calls</span>
                  </div>
                )}
                <Progress className="mt-2" value={callMetrics.total > 0 ? (callMetrics.missed / callMetrics.total) * 100 : 0} />
              </CardContent>
            </Card>

            <Card className="kpi-card card-gradient-secondary animate-slide-up" style={{animationDelay: '300ms'}}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="kpi-card-title">Avg Duration</CardTitle>
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="kpi-card-value">
                  {callMetrics.avgDuration ? `${Math.round(callMetrics.avgDuration)}s` : 'N/A'}
                </div>
                {callMetrics.avgDuration > 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>Average for answered calls</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>No duration data available</span>
                  </div>
                )}
                <Progress className="mt-2" value={callMetrics.avgDuration > 0 ? 100 : 0} />
              </CardContent>
            </Card>

            <Card className="kpi-card card-gradient-primary animate-slide-up" style={{animationDelay: '400ms'}}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="kpi-card-title">Meetings Booked</CardTitle>
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="kpi-card-value">{callMetrics.meetingsScheduled}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <span>Total scheduled meetings</span>
                </div>
                <Progress className="mt-2" value={callMetrics.meetingsScheduled ? 100 : 0} />
              </CardContent>
            </Card>
          </div>

          <div className="dashboard-charts-grid">
            <Suspense fallback={<Card className="p-6"><Skeleton className="h-[300px] w-full" /></Card>}>
              <EnhancedAnalyticsWidget />
            </Suspense>
            <Suspense fallback={<Card className="p-6"><Skeleton className="h-[300px] w-full" /></Card>}>
              <EnhancedCallQualityWidget quality={callQuality} />
            </Suspense>
          </div>

          <div className="dashboard-charts-grid">
            <Suspense fallback={<Card className="p-6"><Skeleton className="h-[300px] w-full" /></Card>}>
              <EnhancedCallTrendsWidget data={callTrendsData} />
            </Suspense>
            <Suspense fallback={<Card className="p-6"><Skeleton className="h-[300px] w-full" /></Card>}>
              <EnhancedTeamPerformanceWidget members={teamMembers} />
            </Suspense>
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
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <RealTimeCallMonitoring />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Call Logs</CardTitle>
                  <p className="text-xs text-muted-foreground">Real-time call logs and events</p>
                </div>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <CallLogsViewer />
                </Suspense>
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
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <CallManagementMetrics />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Make a Test Call</CardTitle>
                  <p className="text-xs text-muted-foreground">Test the VAPI integration</p>
                </div>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <VapiCallPanel />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Advanced Test Call</CardTitle>
                  <p className="text-xs text-muted-foreground">Test with custom call settings</p>
                </div>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <AdvancedTestCallPanel />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <div className="grid gap-4">
            <Suspense fallback={<Card className="p-6"><Skeleton className="h-[400px] w-full" /></Card>}>
              <EnhancedGoogleCalendar
                fullHeight={true}
                autoRefresh={true}
                refreshInterval={60000}
              />
            </Suspense>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<Card className="p-6"><Skeleton className="h-[300px] w-full" /></Card>}>
              <EnhancedMeetingStatisticsWidget
                totalMeetings={meetingAnalytics?.total_meetings || 0}
                completedMeetings={meetingAnalytics?.completed_meetings || 0}
                cancelledMeetings={meetingAnalytics?.cancelled_meetings || 0}
                scheduledMeetings={meetingAnalytics?.scheduled_meetings || callMetrics.meetingsScheduled || 0}
              />
            </Suspense>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Export Options</CardTitle>
                  <p className="text-xs text-muted-foreground">Download meeting data</p>
                </div>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Export Format</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
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
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                  <EnhancedCallAnalytics />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
            <Suspense fallback={<Card className="p-6"><Skeleton className="h-[300px] w-full" /></Card>}>
              <EnhancedAlertsNotificationsWidget />
            </Suspense>
            <Suspense fallback={<Card className="p-6"><Skeleton className="h-[300px] w-full" /></Card>}>
              <EnhancedDebugPanelWidget />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
