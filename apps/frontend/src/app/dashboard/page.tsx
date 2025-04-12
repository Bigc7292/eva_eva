'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { RealTimeCallMonitoring } from '@/components/dashboard/RealTimeCallMonitoring'
import { LeadPerformance } from '@/components/dashboard/LeadPerformance'
import { SalesFunnel } from '@/components/dashboard/SalesFunnel'
import { CustomerFeedback } from '@/components/dashboard/CustomerFeedback'
import { AgentPerformance } from '@/components/dashboard/AgentPerformance'
import { AlertsNotifications } from '@/components/dashboard/AlertsNotifications'
import { HistoricalAnalytics } from '@/components/dashboard/HistoricalAnalytics'
import { SocialMediaIntegration } from '@/components/dashboard/SocialMediaIntegration'
import { analyticsService } from '@/services/analytics'
import { dummyCallAnalytics, dummyLeadAnalytics } from '@/lib/dummy-data'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  useEffect(() => {
    loadDashboardData()
  }, [dateRange])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      try {
        const dashboardStats = await analyticsService.getDashboardStats()
        setStats(dashboardStats)
      } catch (apiError) {
        console.error('Error from API, using dummy data:', apiError)
        // Use dummy data if API fails
        setStats({
          totalLeads: 50,
          newLeadsToday: 5,
          totalCalls: 100,
          missedCalls: 15,
          completedCalls: 75,
          averageCallDuration: 180,
          leadsConversionRate: 0.35,
          callsByDay: dummyCallAnalytics.callsByDay,
          leadsByStatus: dummyLeadAnalytics.leadsByStatus,
          callsByType: dummyCallAnalytics.callsByType,
          callsByStatus: dummyCallAnalytics.callsByStatus
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dummy team data
  const teamMembers = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: '/avatars/sarah.jpg',
      calls: 78,
      conversions: 23,
      avgDuration: 340
    },
    {
      id: '2',
      name: 'Michael Chen',
      avatar: '/avatars/michael.jpg',
      calls: 65,
      conversions: 18,
      avgDuration: 290
    },
    {
      id: '3',
      name: 'Aisha Patel',
      avatar: '/avatars/aisha.jpg',
      calls: 92,
      conversions: 31,
      avgDuration: 380
    },
    {
      id: '4',
      name: 'David Kim',
      avatar: '/avatars/david.jpg',
      calls: 54,
      conversions: 15,
      avgDuration: 270
    }
  ]

  if (loading || !stats) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Dashboard" description="Your CRM analytics overview" />
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="w-full h-32 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Call Analytics CRM Dashboard" description="Real-time analytics and insights" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Export</Button>
          <Button variant="outline" size="sm">Customize</Button>
          <Button size="sm">Refresh</Button>
        </div>
      </div>

      <div className="flex justify-end">
        <p className="text-xs text-muted-foreground">Data refreshes every 5 seconds • Last updated: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Top-Level Overview */}
      <DashboardHeader />

      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Content - 2/3 width */}
        <div className="space-y-4 md:col-span-2">
          {/* Real-Time Call Monitoring */}
          <RealTimeCallMonitoring />

          {/* Sales Funnel Analytics */}
          <SalesFunnel />

          {/* AI Agent Performance Metrics */}
          <AgentPerformance />

          {/* Historical and Predictive Analytics */}
          <HistoricalAnalytics />

          {/* Social Media Integration */}
          <SocialMediaIntegration />
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-4">
          {/* Lead and Campaign Performance */}
          <LeadPerformance />

          {/* Customer Feedback and Satisfaction */}
          <CustomerFeedback />

          {/* Alerts and Notifications */}
          <AlertsNotifications />
        </div>
      </div>
    </div>
  )
}
