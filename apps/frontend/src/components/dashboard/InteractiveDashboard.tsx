'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PhoneIcon, UsersIcon, CalendarIcon, BarChart3, TrendingUp, Award, Target, Clock } from '@/components/ui/icons'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar, ComposedChart
} from 'recharts'

interface InteractiveDashboardProps {
  callAnalytics?: any
  leadAnalytics?: any
  meetingAnalytics?: any
}

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  pink: '#EC4899',
  teal: '#14B8A6'
}

export function InteractiveDashboard({ callAnalytics, leadAnalytics, meetingAnalytics }: InteractiveDashboardProps) {
  const [activeMetric, setActiveMetric] = useState('calls')
  const [animationClass, setAnimationClass] = useState('')
  const [realTimeData, setRealTimeData] = useState({
    activeCalls: 0,
    queuedCalls: 0,
    agentsOnline: 5,
    lastUpdate: new Date()
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        activeCalls: Math.floor(Math.random() * 8) + 2,
        queuedCalls: Math.floor(Math.random() * 5),
        lastUpdate: new Date()
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Enhanced metric cards with animations
  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color, 
    trend, 
    onClick,
    isActive = false 
  }: {
    title: string
    value: number | string
    change?: number
    icon: any
    color: string
    trend?: 'up' | 'down' | 'stable'
    onClick?: () => void
    isActive?: boolean
  }) => (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${
        isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon 
          className={`h-6 w-6 transition-colors duration-300`} 
          style={{ color: isActive ? COLORS.primary : color }}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`mr-1 h-3 w-3 ${change < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(change)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Sample data for enhanced charts
  const callTrendData = [
    { time: '9 AM', calls: 24, answered: 18, missed: 6 },
    { time: '10 AM', calls: 31, answered: 25, missed: 6 },
    { time: '11 AM', calls: 45, answered: 38, missed: 7 },
    { time: '12 PM', calls: 52, answered: 44, missed: 8 },
    { time: '1 PM', calls: 38, answered: 32, missed: 6 },
    { time: '2 PM', calls: 41, answered: 35, missed: 6 },
    { time: '3 PM', calls: 47, answered: 40, missed: 7 },
    { time: '4 PM', calls: 43, answered: 37, missed: 6 }
  ]

  const performanceData = [
    { agent: 'Sarah Johnson', calls: 87, conversion: 24, rating: 4.8, color: COLORS.primary },
    { agent: 'Mike Chen', calls: 76, conversion: 19, rating: 4.6, color: COLORS.secondary },
    { agent: 'Emma Davis', calls: 82, conversion: 22, rating: 4.7, color: COLORS.purple },
    { agent: 'James Wilson', calls: 69, conversion: 16, rating: 4.4, color: COLORS.indigo },
    { agent: 'Lisa Anderson', calls: 91, conversion: 26, rating: 4.9, color: COLORS.pink }
  ]

  const outcomeData = [
    { name: 'Meeting Scheduled', value: 156, color: COLORS.secondary },
    { name: 'Callback Requested', value: 89, color: COLORS.warning },
    { name: 'Not Interested', value: 203, color: COLORS.danger },
    { name: 'No Answer', value: 124, color: COLORS.primary }
  ]

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar */}
      <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Status</span>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-green-600">
                  {realTimeData.activeCalls} Active Calls
                </Badge>
                <Badge variant="outline" className="text-yellow-600">
                  {realTimeData.queuedCalls} Queued
                </Badge>
                <Badge variant="outline" className="text-blue-600">
                  {realTimeData.agentsOnline} Agents Online
                </Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Last updated: {realTimeData.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Calls Today"
          value={callAnalytics?.totalCalls || 245}
          change={12}
          icon={PhoneIcon}
          color={COLORS.primary}
          trend="up"
          onClick={() => setActiveMetric('calls')}
          isActive={activeMetric === 'calls'}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${(callAnalytics?.answerRate || 76).toFixed(1)}%`}
          change={3.2}
          icon={Target}
          color={COLORS.secondary}
          trend="up"
          onClick={() => setActiveMetric('conversion')}
          isActive={activeMetric === 'conversion'}
        />
        <MetricCard
          title="Meetings Scheduled"
          value={meetingAnalytics?.totalMeetings || 23}
          change={8}
          icon={CalendarIcon}
          color={COLORS.purple}
          trend="up"
          onClick={() => setActiveMetric('meetings')}
          isActive={activeMetric === 'meetings'}
        />
        <MetricCard
          title="Team Performance"
          value="94.2"
          change={1.5}
          icon={Award}
          color={COLORS.warning}
          trend="up"
          onClick={() => setActiveMetric('performance')}
          isActive={activeMetric === 'performance'}
        />
      </div>

      {/* Interactive Chart Tabs */}
      <Tabs value={activeMetric} onValueChange={setActiveMetric} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calls">Call Analytics</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Trends</TabsTrigger>
          <TabsTrigger value="meetings">Meeting Analytics</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Hourly Call Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={callTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="calls" 
                      stackId="1"
                      stroke={COLORS.primary} 
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                    />
                    <Bar dataKey="answered" fill={COLORS.secondary} />
                    <Bar dataKey="missed" fill={COLORS.danger} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={outcomeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {outcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { stage: 'Calls Made', count: 572, percentage: 100 },
                  { stage: 'Answered', count: 435, percentage: 76 },
                  { stage: 'Interested', count: 218, percentage: 50 },
                  { stage: 'Meetings Scheduled', count: 87, percentage: 40 },
                  { stage: 'Meetings Attended', count: 62, percentage: 71 }
                ].map((stage, index) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{stage.stage}</span>
                      <span className="text-sm text-muted-foreground">
                        {stage.count} ({stage.percentage}%)
                      </span>
                    </div>
                    <Progress 
                      value={stage.percentage} 
                      className="h-3"
                      style={{
                        '--progress-foreground': `hsl(${200 + index * 30}, 70%, 50%)`
                      } as any}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Scheduling Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={callTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="answered" 
                      stroke={COLORS.secondary} 
                      fill={COLORS.secondary}
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meeting Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[
                      { name: 'Success Rate', value: 71, fill: COLORS.secondary }
                    ]}>
                      <RadialBar
                        label={{ position: 'insideStart', fill: '#fff' }}
                        background
                        clockWise
                        dataKey="value"
                      />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold">
                        71%
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((agent, index) => (
                  <div key={agent.agent} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: agent.color }}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{agent.agent}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.calls} calls • {agent.conversion} meetings • ⭐ {agent.rating}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{((agent.conversion / agent.calls) * 100).toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">conversion</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}