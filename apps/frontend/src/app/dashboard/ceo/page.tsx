'use client'

import { useState, useEffect } from 'react'
import { ceoAnalyticsService, CEOAnalytics } from '@/services/ceo-analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'
import { 
  TrendingUp, 
  Phone, 
  Users, 
  Calendar, 
  DollarSign,
  Clock,
  MapPin,
  Star,
  RefreshCcw,
  Download,
  Filter
} from 'lucide-react'
import { format, subDays } from 'date-fns'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export default function CEODashboardPage() {
  const [analytics, setAnalytics] = useState<CEOAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const data = await ceoAnalyticsService.getComprehensiveAnalytics(dateRange)
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading CEO analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100) / 100}%`
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-2">Loading CEO Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex-1 p-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Unable to Load Analytics</h2>
          <p className="text-muted-foreground mb-4">There was an issue loading the dashboard data.</p>
          <Button onClick={loadAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CEO Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics for {format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analytics.overview.answerRate)} answer rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analytics.overview.conversionRate)} conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalMeetings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analytics.meetingMetrics.meetingAttendanceRate)} attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(Math.round(analytics.overview.averageCallDuration))}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.activeAgents} active agents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Call Analytics</TabsTrigger>
          <TabsTrigger value="leads">Lead Analytics</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Daily Calls Trend */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Daily Call Trends</CardTitle>
                <CardDescription>Calls, answers, and misses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.callMetrics.dailyCalls}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="calls" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="Total Calls"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="answered" 
                      stackId="2" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Answered"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="missed" 
                      stackId="3" 
                      stroke="#ffc658" 
                      fill="#ffc658" 
                      name="Missed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Conversion Funnel */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Lead Conversion Funnel</CardTitle>
                <CardDescription>Lead progression through sales stages</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.leadMetrics.leadConversionFunnel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      <LabelList dataKey="conversionRate" position="top" formatter={(value: any) => `${value.toFixed(1)}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Call Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle>Call Outcomes Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.callMetrics.callsByOutcome}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.callMetrics.callsByOutcome.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.leadMetrics.leadsBySource}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percentage }) => `${source}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.leadMetrics.leadsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI Ratings */}
            <Card>
              <CardHeader>
                <CardTitle>AI Performance Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Call Quality</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1 text-sm">{analytics.aiRatings.averageCallRating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lead Quality</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1 text-sm">{analytics.aiRatings.averageLeadRating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Voice Assistant</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1 text-sm">{analytics.aiRatings.averageVoiceAssistantRating.toFixed(1)}</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={analytics.aiRatings.ratingDistribution}>
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Call Analytics Tab */}
        <TabsContent value="calls" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Calls by Hour */}
            <Card>
              <CardHeader>
                <CardTitle>Calls by Hour of Day</CardTitle>
                <CardDescription>Peak calling hours analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.callMetrics.callsByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="calls" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Agent Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Call Performance</CardTitle>
                <CardDescription>Calls and conversion rates by agent</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.callMetrics.callsByAgent}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="calls" fill="#8884d8" name="Total Calls" />
                    <Bar dataKey="answered" fill="#82ca9d" name="Answered" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Best Performing Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Best Performing Hours</CardTitle>
              <CardDescription>Hours with highest answer and conversion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.timeAnalytics.bestPerformingHours.slice(0, 5).map((hour, index) => (
                  <div key={hour.hour} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{hour.hour}:00 - {hour.hour + 1}:00</div>
                        <div className="text-sm text-muted-foreground">{hour.answerRate.toFixed(1)}% answer rate</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatPercentage(hour.answerRate)}</div>
                      <div className="text-sm text-muted-foreground">Answer Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Analytics Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Lead Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.leadMetrics.leadsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.leadMetrics.leadsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Quality Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.leadMetrics.leadsByQuality}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quality" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      <LabelList dataKey="percentage" position="top" formatter={(value: any) => `${value.toFixed(1)}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Meeting Analytics Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Meeting Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle>Meeting Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.meetingMetrics.meetingsByOutcome}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ outcome, count }) => `${outcome}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.meetingMetrics.meetingsByOutcome.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Agent Meeting Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Meeting Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.meetingMetrics.meetingsByAgent}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="scheduled" fill="#8884d8" name="Scheduled" />
                    <Bar dataKey="attended" fill="#82ca9d" name="Attended" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Meeting Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Meetings Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.meetingMetrics.meetingsScheduled}</div>
                <p className="text-muted-foreground">Total meetings scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meetings Attended</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.meetingMetrics.meetingsAttended}</div>
                <p className="text-muted-foreground">Total meetings attended</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatPercentage(analytics.meetingMetrics.meetingAttendanceRate)}</div>
                <p className="text-muted-foreground">Meeting attendance rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Location Analytics Tab */}
        <TabsContent value="location" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Calls by Location */}
            <Card>
              <CardHeader>
                <CardTitle>Calls by Location</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.locationAnalytics.callsByLocation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="calls" fill="#8884d8" name="Calls" />
                    <Bar dataKey="leads" fill="#82ca9d" name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Locations</CardTitle>
                <CardDescription>Locations with highest conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.locationAnalytics.topPerformingLocations.slice(0, 5).map((location, index) => (
                    <div key={location.location} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{location.location}</div>
                          <div className="text-sm text-muted-foreground">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            Location
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatPercentage(location.conversionRate)}</div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {/* Best Performing Days */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Day of Week</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.timeAnalytics.bestPerformingDays}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" fill="#8884d8" name="Calls" />
                  <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Overall Answer Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatPercentage(analytics.overview.answerRate)}</div>
                <p className="text-muted-foreground">Across all calls</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{formatPercentage(analytics.overview.conversionRate)}</div>
                <p className="text-muted-foreground">Lead to meeting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Call Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{analytics.aiRatings.averageCallRating.toFixed(1)}/5</div>
                <p className="text-muted-foreground">AI rating</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{analytics.overview.activeAgents}</div>
                <p className="text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}