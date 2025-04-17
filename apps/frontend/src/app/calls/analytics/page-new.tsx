'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  Phone,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  AlertCircle
} from 'lucide-react'
import { CheckCircleIcon, LoaderIcon } from '@/components/ui/icons/custom-icons'

export default function CallAnalyticsPage() {
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('7d')
  const { toast } = useToast()
  
  // Format duration in seconds to minutes:seconds
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Simulated analytics data
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive'
      })
      setLoading(false)
    }
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
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading analytics data...</span>
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
                  <div className="text-3xl font-bold">0</div>
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
                  <div className="text-3xl font-bold">0%</div>
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
                  <div className="text-3xl font-bold">0:00</div>
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
                    0 min
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <Tabs defaultValue="daily">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">
                <LineChart className="h-4 w-4 mr-2" />
                Daily Trend
              </TabsTrigger>
              <TabsTrigger value="status">
                <PieChart className="h-4 w-4 mr-2" />
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
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-16 w-16 mb-4 text-muted-foreground" />
                      <p>Chart temporarily unavailable</p>
                      <p className="text-sm text-muted-foreground mt-2">Please install recharts package to view charts</p>
                    </div>
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
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 mb-4 text-muted-foreground" />
                      <p>Chart temporarily unavailable</p>
                      <p className="text-sm text-muted-foreground mt-2">Please install recharts package to view charts</p>
                    </div>
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
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mb-4 text-muted-foreground" />
                      <p>Chart temporarily unavailable</p>
                      <p className="text-sm text-muted-foreground mt-2">Please install recharts package to view charts</p>
                    </div>
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
                    0:00
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Average Duration
                  </div>
                  <div className="text-3xl font-bold">
                    0:00
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Maximum Duration
                  </div>
                  <div className="text-3xl font-bold">
                    0:00
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
