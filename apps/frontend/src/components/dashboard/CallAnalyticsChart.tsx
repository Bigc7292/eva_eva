'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { vapiService } from '@/services/vapi-service'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { Button } from '@/components/ui/button'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Define types for chart data
interface ChartDataPoint {
  name: string;
  value: number;
}

interface CallsByDayDataPoint {
  date: string;
  calls: number;
}

export function CallAnalyticsChart() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('daily')
  const [callsByDay, setCallsByDay] = useState<CallsByDayDataPoint[]>([])
  const [callsByType, setCallsByType] = useState<ChartDataPoint[]>([])
  const [callsByStatus, setCallsByStatus] = useState<ChartDataPoint[]>([])
  const [callDurations, setCallDurations] = useState<ChartDataPoint[]>([])
  const [callSentiments, setCallSentiments] = useState<ChartDataPoint[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Define fetchData as a useCallback to avoid dependency issues
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get the date range based on the active tab
      const now = new Date()
      let startDate: Date

      switch (activeTab) {
        case 'daily':
          startDate = subDays(now, 7) // Last 7 days
          break
        case 'weekly':
          startDate = subDays(now, 30) // Last 30 days
          break
        case 'monthly':
          startDate = subDays(now, 90) // Last 90 days
          break
        default:
          startDate = subDays(now, 7)
      }

        // Format dates for API
        const startDateStr = startDate.toISOString()
        const endDateStr = now.toISOString()

        // Get call analytics from Vapi
        const analytics = await vapiService.getCallAnalytics({
          start: startDateStr,
          end: endDateStr
        })

        // Get calls from Vapi
        const calls = await vapiService.getCalls({
          limit: 100,
          createdAtGt: startDateStr
        })

        // Process calls by day
        const callsByDayMap: Record<string, number> = {}
        const days: string[] = []
        const currentDate = new Date(startDate)

        // Initialize all days with 0 calls
        while (currentDate <= now) {
          const dateStr = format(currentDate, 'yyyy-MM-dd')
          callsByDayMap[dateStr] = 0
          days.push(dateStr)
          currentDate.setDate(currentDate.getDate() + 1)
        }

        // Count calls per day
        for (const call of calls) {
          const date = new Date(call.createdAt).toISOString().split('T')[0]
          if (callsByDayMap[date] !== undefined) {
            callsByDayMap[date]++
          }
        }

        // Convert to array for chart
        const callsByDayArray = days.map(day => ({
          date: format(new Date(day), 'MMM dd'),
          calls: callsByDayMap[day]
        }))

        // Process calls by type
        const typeCount = {
          inbound: 0,
          outbound: 0,
          web: 0
        }

        for (const call of calls) {
          if (call.type === 'inboundPhoneCall') typeCount.inbound++
          else if (call.type === 'outboundPhoneCall') typeCount.outbound++
          else if (call.type === 'webCall') typeCount.web++
        }

        const typeData = [
          { name: 'Inbound', value: typeCount.inbound },
          { name: 'Outbound', value: typeCount.outbound },
          { name: 'Web', value: typeCount.web }
        ].filter(item => item.value > 0) // Remove types with 0 calls

        // Process calls by status
        const statusCount = {
          completed: 0,
          failed: 0,
          scheduled: 0,
          inProgress: 0,
          canceled: 0
        }

        for (const call of calls) {
          if (call.status === 'completed') statusCount.completed++
          else if (call.status === 'failed') statusCount.failed++
          else if (call.status === 'scheduled') statusCount.scheduled++
          else if (call.status === 'in-progress') statusCount.inProgress++
          else if (call.status === 'canceled') statusCount.canceled++
        }

        const statusData = [
          { name: 'Completed', value: statusCount.completed },
          { name: 'Failed', value: statusCount.failed },
          { name: 'Scheduled', value: statusCount.scheduled },
          { name: 'In Progress', value: statusCount.inProgress },
          { name: 'Canceled', value: statusCount.canceled }
        ].filter(item => item.value > 0) // Remove statuses with 0 calls

        // Process call durations
        const durations = calls
          .filter(call => call.startedAt && call.endedAt)
          .map(call => {
            const start = new Date(call.startedAt).getTime()
            const end = new Date(call.endedAt).getTime()
            return Math.floor((end - start) / 1000) // Duration in seconds
          })
          .sort((a, b) => a - b)

        // Group durations into buckets
        const durationBuckets: Record<string, number> = {
          '< 1 min': 0,
          '1-2 min': 0,
          '2-5 min': 0,
          '5-10 min': 0,
          '> 10 min': 0
        }

        for (const duration of durations) {
          if (duration < 60) durationBuckets['< 1 min']++
          else if (duration < 120) durationBuckets['1-2 min']++
          else if (duration < 300) durationBuckets['2-5 min']++
          else if (duration < 600) durationBuckets['5-10 min']++
          else durationBuckets['> 10 min']++
        }

        const durationData = Object.entries(durationBuckets).map(([name, value]) => ({ name, value }))

        // Process call sentiments
        const sentiments = {
          positive: 0,
          neutral: 0,
          negative: 0
        }

        for (const call of calls) {
          if (call.analysis?.structuredData?.sentiment) {
            const sentiment = call.analysis.structuredData.sentiment as number
            if (sentiment > 0.6) sentiments.positive++
            else if (sentiment < 0.4) sentiments.negative++
            else sentiments.neutral++
          }
        }

        const sentimentData = [
          { name: 'Positive', value: sentiments.positive },
          { name: 'Neutral', value: sentiments.neutral },
          { name: 'Negative', value: sentiments.negative }
        ].filter(item => item.value > 0) // Remove sentiments with 0 calls

        // Update state with processed data
        setCallsByDay(callsByDayArray)
        setCallsByType(typeData)
        setCallsByStatus(statusData)
        setCallDurations(durationData)
        setCallSentiments(sentimentData)
        setLastUpdated(new Date())

    } catch (err) {
      console.error('Error fetching call analytics:', err)
      setError('Failed to load call analytics data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  // Function to refresh data periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(intervalId)
  }, [fetchData])

  // Fetch data when tab changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Analytics</CardTitle>
          <CardDescription>Error loading analytics</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button
              className="mt-4"
              onClick={() => fetchData()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Call Analytics</CardTitle>
        <CardDescription>
          Detailed analysis of call performance
          <span className="text-xs text-muted-foreground ml-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </CardDescription>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList>
            <TabsTrigger value="daily">Daily (7 days)</TabsTrigger>
            <TabsTrigger value="weekly">Weekly (30 days)</TabsTrigger>
            <TabsTrigger value="monthly">Monthly (90 days)</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Call Volume Chart */}
            <div>
              <h3 className="text-lg font-medium mb-2">Call Volume</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={callsByDay}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="calls" name="Number of Calls" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Call Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Call Types */}
              <div>
                <h3 className="text-lg font-medium mb-2">Call Types</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={callsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {callsByType.map((entry, index) => (
                          <Cell key={`type-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} calls`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Call Status */}
              <div>
                <h3 className="text-lg font-medium mb-2">Call Status</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={callsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {callsByStatus.map((entry, index) => (
                          <Cell key={`status-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} calls`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Call Durations */}
              <div>
                <h3 className="text-lg font-medium mb-2">Call Durations</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={callDurations}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Number of Calls" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Call Sentiments */}
              <div>
                <h3 className="text-lg font-medium mb-2">Call Sentiments</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={callSentiments}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#00C49F" /> {/* Positive */}
                        <Cell fill="#FFBB28" /> {/* Neutral */}
                        <Cell fill="#FF8042" /> {/* Negative */}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} calls`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
