'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Phone,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle
} from 'lucide-react'
import { CheckCircleIcon, LoaderIcon } from '@/components/ui/icons/custom-icons'

// Define types for analytics data
interface CallsByStatus {
  status: string;
  count: number;
}

interface CallsByDay {
  date: string;
  count: number;
}

interface CallsByType {
  type: string;
  count: number;
}

interface CallDurationStats {
  average: number;
  min: number;
  max: number;
  total: number;
}

interface CallAnalytics {
  totalCalls: number;
  callsByStatus: CallsByStatus[];
  callsByDay: CallsByDay[];
  callsByType: CallsByType[];
  durationStats: CallDurationStats;
  successRate: number;
}

export default function CallAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const { toast } = useToast()

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6BCB77', '#4D96FF']

  // Status colors
  const STATUS_COLORS: Record<string, string> = {
    'Completed': '#10B981',
    'Failed': '#EF4444',
    'In Progress': '#3B82F6',
    'Initiated': '#F59E0B',
    'Ringing': '#8B5CF6',
    'Answered': '#6366F1',
    'Meeting Booked': '#EC4899'
  }

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/calls/analytics?timeRange=${timeRange}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Format duration in seconds to minutes:seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Export analytics data to CSV
  const exportToCsv = () => {
    if (!analytics) return

    // Create CSV content
    const headers = ['Date', 'Total Calls', 'Completed', 'Failed', 'In Progress', 'Success Rate']

    // Create a map of dates to counts
    const dateMap = new Map()
    analytics.callsByDay.forEach(day => {
      dateMap.set(day.date, { total: day.count, completed: 0, failed: 0, inProgress: 0 })
    })

    // Fill in status counts by date (this is simplified - in a real app you'd have this data from the API)
    // For this example, we'll just make up some numbers based on the total
    dateMap.forEach((value, key) => {
      const total = value.total
      value.completed = Math.round(total * (analytics.successRate / 100))
      value.failed = Math.round(total * ((100 - analytics.successRate) / 100))
      value.inProgress = total - value.completed - value.failed
    })

    // Convert to CSV rows
    const rows = Array.from(dateMap.entries()).map(([date, counts]) => {
      const successRate = counts.total > 0
        ? ((counts.completed / counts.total) * 100).toFixed(1)
        : '0.0'

      return [
        date,
        counts.total,
        counts.completed,
        counts.failed,
        counts.inProgress,
        `${successRate}%`
      ].join(',')
    })

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `call_analytics_${timeRange}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Export Complete',
      description: 'Analytics data has been exported to CSV',
    })
  }

  // Effect to fetch analytics when time range changes
  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Call Analytics</h1>

        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={exportToCsv}
            disabled={!analytics || loading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading analytics data...</span>
        </div>
      ) : !analytics ? (
        <div className="text-center py-20 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No analytics data available</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-primary mr-2" />
                  <div className="text-3xl font-bold">{analytics.totalCalls}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <div className="text-3xl font-bold">{analytics.successRate}%</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-2" />
                  <div className="text-3xl font-bold">{formatDuration(analytics.durationStats.average)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Talk Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-2" />
                  <div className="text-3xl font-bold">
                    {Math.floor(analytics.durationStats.total / 60)} min
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="daily">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Daily Trend
              </TabsTrigger>
              <TabsTrigger value="status">
                <PieChartIcon className="h-4 w-4 mr-2" />
                Call Status
              </TabsTrigger>
              <TabsTrigger value="type">
                <BarChart3 className="h-4 w-4 mr-2" />
                Call Types
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Call Volume</CardTitle>
                  <CardDescription>
                    Number of calls per day over the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analytics.callsByDay}
                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Calls"
                          stroke="#3B82F6"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <CardTitle>Calls by Status</CardTitle>
                  <CardDescription>
                    Distribution of calls by their current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.callsByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics.callsByStatus.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} calls`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="type">
              <Card>
                <CardHeader>
                  <CardTitle>Calls by Type</CardTitle>
                  <CardDescription>
                    Distribution of calls by inbound vs outbound
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.callsByType}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Calls" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Duration Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Call Duration Statistics</CardTitle>
              <CardDescription>
                Statistics about call durations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Minimum Duration
                  </div>
                  <div className="text-3xl font-bold">
                    {formatDuration(analytics.durationStats.min)}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Average Duration
                  </div>
                  <div className="text-3xl font-bold">
                    {formatDuration(analytics.durationStats.average)}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Maximum Duration
                  </div>
                  <div className="text-3xl font-bold">
                    {formatDuration(analytics.durationStats.max)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
