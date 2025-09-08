'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Clock, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Building, 
  Users, 
  RefreshCw, 
  PhoneCall, 
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber, formatDuration } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface CallMetricsData {
  total_calls: number;
  calls_today: number;
  calls_this_week: number;
  total_answered: number;
  answered_today: number;
  answered_this_week: number;
  avg_call_duration: number;
  avg_calls_per_meeting: number;
  avg_answered_per_day: number;
}

interface CostMetricsData {
  avg_cost_per_day: number;
  avg_cost_per_meeting: number;
}

interface MeetingMetricsData {
  total_meetings: number;
  meetings_today: number;
  meetings_this_week: number;
  off_plan_meetings: number;
  secondary_meetings: number;
  avg_budget: number;
  locations: Array<{
    location: string;
    count: number;
  }>;
}

interface LeadSegmentationData {
  summary: Array<{
    status: string;
    count: number;
  }>;
  detailed: {
    not_interested: Array<LeadData>;
    call_back_later: Array<LeadData>;
    no_answer: Array<LeadData>;
    booked: Array<LeadData>;
    new: Array<LeadData>;
  };
}

interface LeadData {
  lead_id: number;
  name: string;
  phone_number: string;
  email: string;
  status: string;
  last_call_outcome: string;
  total_calls: number;
  budget: number;
  property_interest: string;
  updated_at: string;
  last_call_date: string;
}

export function CallManagementMetrics() {
  const [loading, setLoading] = useState(true);
  const [callMetrics, setCallMetrics] = useState<CallMetricsData | null>(null);
  const [costMetrics, setCostMetrics] = useState<CostMetricsData | null>(null);
  const [meetingMetrics, setMeetingMetrics] = useState<MeetingMetricsData | null>(null);
  const [leadSegmentation, setLeadSegmentation] = useState<LeadSegmentationData | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all metrics in parallel
      const [callResponse, costResponse, meetingResponse, leadResponse] = await Promise.all([
        fetch('http://localhost:3004/api/metrics/calls'),
        fetch('http://localhost:3004/api/metrics/costs'),
        fetch('http://localhost:3004/api/metrics/meetings'),
        fetch('http://localhost:3004/api/leads/segmented')
      ]);

      if (!callResponse.ok || !costResponse.ok || !meetingResponse.ok || !leadResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const callData = await callResponse.json();
      const costData = await costResponse.json();
      const meetingData = await meetingResponse.json();
      const leadData = await leadResponse.json();

      setCallMetrics(callData);
      setCostMetrics(costData);
      setMeetingMetrics(meetingData);
      setLeadSegmentation(leadData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up polling for real-time updates (every 30 seconds)
    const intervalId = setInterval(fetchData, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchData();
    toast({
      title: 'Refreshing',
      description: 'Dashboard data is being updated...',
    });
  };

  // Helper function to format numbers
  const formatMetric = (value: number | undefined, type: 'number' | 'currency' | 'duration' = 'number') => {
    if (value === undefined || value === null) return 'N/A';
    
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    
    if (type === 'duration') {
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      return `${minutes}m ${seconds}s`;
    }
    
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Call Management Metrics</h2>
        <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="calls" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calls">Calendar</TabsTrigger>
          <TabsTrigger value="costs">Cost Metrics</TabsTrigger>
          <TabsTrigger value="meetings">Meeting Metrics</TabsTrigger>
          <TabsTrigger value="leads">Lead Segmentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calls" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls (Week)</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(callMetrics?.calls_this_week)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls (Today)</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(callMetrics?.calls_today)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Answered Calls (Week)</CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(callMetrics?.answered_this_week)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Answered Calls (Today)</CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(callMetrics?.answered_today)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Call Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(callMetrics?.avg_call_duration, 'duration')}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Call Minutes (Week)</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' :
                    (() => {
                      const totalMinutes = callMetrics?.calls_this_week && callMetrics?.avg_call_duration
                        ? Math.round((callMetrics.calls_this_week * callMetrics.avg_call_duration) / 60)
                        : 0;
                      return `${totalMinutes} min`;
                    })()
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Cost Per Day</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(costMetrics?.avg_cost_per_day, 'currency')}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Cost Per Meeting</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(costMetrics?.avg_cost_per_meeting, 'currency')}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="meetings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meetings (Week)</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(meetingMetrics?.meetings_this_week)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meetings (Today)</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(meetingMetrics?.meetings_today)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Off-Plan Properties</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(meetingMetrics?.off_plan_meetings)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Secondary Properties</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(meetingMetrics?.secondary_meetings)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(meetingMetrics?.avg_budget, 'currency')}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {meetingMetrics?.locations && meetingMetrics.locations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Meeting Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {meetingMetrics.locations.map((location, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{location.location}</span>
                      </div>
                      <span className="font-medium">{location.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="leads" className="space-y-4">
          {leadSegmentation?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {leadSegmentation.summary.map((segment, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {segment.status.replace(/_/g, ' ')}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{segment.count}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {leadSegmentation?.detailed && (
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(leadSegmentation.detailed).map(([status, leads]) => (
                leads.length > 0 && (
                  <Card key={status}>
                    <CardHeader>
                      <CardTitle className="capitalize">{status.replace(/_/g, ' ')} Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2">Name</th>
                              <th className="text-left py-2 px-2">Phone</th>
                              <th className="text-left py-2 px-2">Last Call</th>
                              <th className="text-left py-2 px-2">Total Calls</th>
                              <th className="text-left py-2 px-2">Budget</th>
                              <th className="text-left py-2 px-2">Interest</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leads.slice(0, 5).map((lead) => (
                              <tr key={lead.lead_id} className="border-b">
                                <td className="py-2 px-2">{lead.name || 'Unknown'}</td>
                                <td className="py-2 px-2">{lead.phone_number}</td>
                                <td className="py-2 px-2">
                                  {lead.last_call_date 
                                    ? new Date(lead.last_call_date).toLocaleDateString() 
                                    : 'Never'}
                                </td>
                                <td className="py-2 px-2">{lead.total_calls}</td>
                                <td className="py-2 px-2">
                                  {lead.budget ? formatMetric(lead.budget, 'currency') : 'N/A'}
                                </td>
                                <td className="py-2 px-2 capitalize">
                                  {lead.property_interest?.replace(/_/g, ' ') || 'None'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {leads.length > 5 && (
                          <div className="text-center mt-2 text-sm text-muted-foreground">
                            Showing 5 of {leads.length} leads
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
