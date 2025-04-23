'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Clock,
  DollarSign,
  Calendar,
  MapPin,
  Building,
  Home,
  Users,
  RefreshCw
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

  // Define fetchData outside of the component to avoid dependency issues
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all metrics in parallel with error handling for each request
      const callPromise = fetch('/api/metrics/calls')
        .then(res => {
          if (!res.ok) {
            console.error('Call metrics API returned status:', res.status);
            return null;
          }
          return res.json();
        })
        .catch(err => {
          console.error('Error fetching call metrics:', err);
          return null;
        });

      const costPromise = fetch('/api/metrics/costs')
        .then(res => {
          if (!res.ok) {
            console.error('Cost metrics API returned status:', res.status);
            return null;
          }
          return res.json();
        })
        .catch(err => {
          console.error('Error fetching cost metrics:', err);
          return null;
        });

      const meetingPromise = fetch('/api/metrics/meetings')
        .then(res => {
          if (!res.ok) {
            console.error('Meeting metrics API returned status:', res.status);
            return null;
          }
          return res.json();
        })
        .catch(err => {
          console.error('Error fetching meeting metrics:', err);
          return null;
        });

      const leadPromise = fetch('/api/leads/segmented')
        .then(res => {
          if (!res.ok) {
            console.error('Lead segmentation API returned status:', res.status);
            return null;
          }
          return res.json();
        })
        .catch(err => {
          console.error('Error fetching lead segmentation:', err);
          return null;
        });

      // Wait for all promises to resolve
      const [callData, costData, meetingData, leadData] = await Promise.all([
        callPromise,
        costPromise,
        meetingPromise,
        leadPromise
      ]);

      console.log('API responses:', {
        callData,
        costData,
        meetingData,
        leadData
      });

      // Set data with fallbacks
      setCallMetrics(callData || {
        total_calls: 0,
        calls_today: 0,
        calls_this_week: 0,
        total_answered: 0,
        answered_today: 0,
        answered_this_week: 0,
        avg_call_duration: 0,
        avg_calls_per_meeting: 0,
        avg_answered_per_day: 0
      });

      setCostMetrics(costData || {
        avg_cost_per_day: 0,
        avg_cost_per_meeting: 0
      });

      setMeetingMetrics(meetingData || {
        total_meetings: 0,
        meetings_today: 0,
        meetings_this_week: 0,
        off_plan_meetings: 0,
        secondary_meetings: 0,
        avg_budget: 0,
        locations: []
      });

      setLeadSegmentation(leadData || {
        summary: [],
        detailed: {
          not_interested: [],
          call_back_later: [],
          no_answer: [],
          booked: [],
          new: []
        }
      });
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
    // Define a local function to avoid dependency issues
    const loadData = async () => {
      try {
        await fetchData();
      } catch (error) {
        console.error('Error in useEffect fetchData:', error);
      }
    };

    loadData();

    // Set up polling for real-time updates (every 30 seconds)
    const intervalId = setInterval(loadData, 30000);

    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <TabsTrigger value="calls">Call Metrics</TabsTrigger>
          <TabsTrigger value="costs">Cost Metrics</TabsTrigger>
          <TabsTrigger value="meetings">Meeting Metrics</TabsTrigger>
          <TabsTrigger value="leads">Lead Segmentation</TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : !callMetrics || (callMetrics.total_calls === 0 && callMetrics.calls_today === 0) ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">No call data available. Make some calls to see metrics here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                <CardTitle className="text-sm font-medium">Avg Calls Per Meeting</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatMetric(callMetrics?.avg_calls_per_meeting)}
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : !costMetrics || (costMetrics.avg_cost_per_day === 0 && costMetrics.avg_cost_per_meeting === 0) ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">No cost data available. Make some calls to see metrics here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : !meetingMetrics || (meetingMetrics.total_meetings === 0 && meetingMetrics.meetings_today === 0) ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">No meeting data available. Schedule some meetings to see metrics here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
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
          )}

          {loading ? null : meetingMetrics?.locations && meetingMetrics.locations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Meeting Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {meetingMetrics.locations.map((location) => (
                    <div key={location.location} className="flex items-center justify-between">
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
          ) : null}
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : !leadSegmentation?.summary || leadSegmentation.summary.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">No lead data available. Add some leads to see segmentation here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {leadSegmentation.summary && leadSegmentation.summary.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {leadSegmentation.summary.map((segment) => (
                    <Card key={segment.status}>
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

              {leadSegmentation?.detailed && Object.entries(leadSegmentation.detailed).some(([_, leads]) => leads.length > 0) && (
                <div className="grid grid-cols-1 gap-4 mt-4">
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
