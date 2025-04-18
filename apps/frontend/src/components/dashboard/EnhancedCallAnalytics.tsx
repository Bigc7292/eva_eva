'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Clock, 
  BarChart, 
  PieChart, 
  LineChart, 
  Users, 
  RefreshCw,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOutgoing,
  VoicemailIcon,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration, formatNumber, formatPercent } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';

interface EnhancedAnalyticsData {
  total_calls: number;
  successful_calls: number;
  unsuccessful_calls: number;
  unknown_outcome_calls: number;
  avg_call_duration: number;
  max_call_duration: number;
  min_call_duration: number;
  avg_call_latency: number;
  call_picked_up_rate: number;
  call_successful_rate: number;
  dial_no_answer_count: number;
  customer_hangup_count: number;
  agent_hangup_count: number;
  voicemail_count: number;
  dial_failed_count: number;
  voicemail_rate: number;
  inbound_calls: number;
  outbound_calls: number;
  unknown_direction_calls: number;
}

interface DailyAnalyticsData {
  call_date: string;
  total_calls: number;
  successful_calls: number;
  unsuccessful_calls: number;
  avg_call_duration: number;
  call_picked_up_rate: number;
  call_successful_rate: number;
}

interface AgentAnalyticsData {
  agent_id: string;
  agent_name: string;
  total_calls: number;
  successful_calls: number;
  unsuccessful_calls: number;
  avg_call_duration: number;
  call_picked_up_rate: number;
  call_successful_rate: number;
  voicemail_count: number;
  voicemail_rate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export function EnhancedCallAnalytics() {
  const [loading, setLoading] = useState(true);
  const [enhancedData, setEnhancedData] = useState<EnhancedAnalyticsData | null>(null);
  const [dailyData, setDailyData] = useState<DailyAnalyticsData[]>([]);
  const [agentData, setAgentData] = useState<AgentAnalyticsData[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all analytics data in parallel
      const [enhancedResponse, dailyResponse, agentResponse] = await Promise.all([
        fetch('http://localhost:3004/api/analytics/enhanced'),
        fetch('http://localhost:3004/api/analytics/by-day'),
        fetch('http://localhost:3004/api/analytics/by-agent')
      ]);

      if (!enhancedResponse.ok || !dailyResponse.ok || !agentResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const enhancedResult = await enhancedResponse.json();
      const dailyResult = await dailyResponse.json();
      const agentResult = await agentResponse.json();

      setEnhancedData(enhancedResult);
      setDailyData(dailyResult);
      setAgentData(agentResult);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up polling for real-time updates (every 60 seconds)
    const intervalId = setInterval(fetchData, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchData();
    toast({
      title: 'Refreshing',
      description: 'Analytics data is being updated...',
    });
  };

  // Prepare data for charts
  const callCountsData = enhancedData ? [
    { name: 'Successful', value: enhancedData.successful_calls },
    { name: 'Unsuccessful', value: enhancedData.unsuccessful_calls },
    { name: 'Unknown', value: enhancedData.unknown_outcome_calls }
  ] : [];

  const disconnectionData = enhancedData ? [
    { name: 'No Answer', value: enhancedData.dial_no_answer_count },
    { name: 'Customer Hangup', value: enhancedData.customer_hangup_count },
    { name: 'Agent Hangup', value: enhancedData.agent_hangup_count },
    { name: 'Voicemail', value: enhancedData.voicemail_count },
    { name: 'Dial Failed', value: enhancedData.dial_failed_count }
  ] : [];

  const callDirectionData = enhancedData ? [
    { name: 'Inbound', value: enhancedData.inbound_calls },
    { name: 'Outbound', value: enhancedData.outbound_calls },
    { name: 'Unknown', value: enhancedData.unknown_direction_calls }
  ] : [];

  // Format daily data for line chart
  const formattedDailyData = dailyData.map(day => ({
    ...day,
    call_date: new Date(day.call_date).toLocaleDateString(),
  })).reverse();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Enhanced Call Analytics</h2>
        <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="call-counts">Call Counts</TabsTrigger>
          <TabsTrigger value="call-quality">Call Quality</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatNumber(enhancedData?.total_calls || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Calls</CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatNumber(enhancedData?.successful_calls || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? '' : formatPercent(enhancedData?.call_successful_rate || 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unsuccessful Calls</CardTitle>
                <PhoneOff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatNumber(enhancedData?.unsuccessful_calls || 0)}
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
                  {loading ? 'Loading...' : formatDuration(enhancedData?.avg_call_duration || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Call Picked Up Rate</CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatPercent(enhancedData?.call_picked_up_rate || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Voicemail Rate</CardTitle>
                <VoicemailIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatPercent(enhancedData?.voicemail_rate || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Outcomes</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={callCountsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {callCountsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Call Direction</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={callDirectionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {callDirectionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Call Counts Tab */}
        <TabsContent value="call-counts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Calls</CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatNumber(enhancedData?.successful_calls || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unsuccessful Calls</CardTitle>
                <PhoneOff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatNumber(enhancedData?.unsuccessful_calls || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unknown Outcome</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatNumber(enhancedData?.unknown_outcome_calls || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Call Counts by Outcome</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callCountsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatNumber(value as number)} />
                    <Legend />
                    <Bar dataKey="value" name="Calls" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Disconnection Reasons</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={disconnectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatNumber(value as number)} />
                    <Legend />
                    <Bar dataKey="value" name="Calls" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Call Quality Tab */}
        <TabsContent value="call-quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Call Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatDuration(enhancedData?.avg_call_duration || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Call Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatDuration(enhancedData?.max_call_duration || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : `${(enhancedData?.avg_call_latency || 0).toFixed(2)}s`}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Call Picked Up Rate</CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatPercent(enhancedData?.call_picked_up_rate || 0)}
                </div>
                <div className="h-4 w-full bg-gray-200 rounded-full mt-2">
                  <div 
                    className="h-4 bg-green-500 rounded-full" 
                    style={{ width: `${enhancedData?.call_picked_up_rate || 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Call Successful Rate</CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : formatPercent(enhancedData?.call_successful_rate || 0)}
                </div>
                <div className="h-4 w-full bg-gray-200 rounded-full mt-2">
                  <div 
                    className="h-4 bg-blue-500 rounded-full" 
                    style={{ width: `${enhancedData?.call_successful_rate || 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedDailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="call_date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="total_calls" 
                      name="Total Calls" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="successful_calls" 
                      name="Successful Calls" 
                      stroke="#82ca9d" 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="call_picked_up_rate" 
                      name="Picked Up Rate (%)" 
                      stroke="#ff7300" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Call Duration Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedDailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="call_date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value} seconds`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avg_call_duration" 
                      name="Avg Call Duration (seconds)" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p>Loading agent data...</p>
            </div>
          ) : agentData.length === 0 ? (
            <Card>
              <CardContent className="py-4">
                <p className="text-center text-muted-foreground">No agent data available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Agent</th>
                          <th className="text-left py-2 px-2">Total Calls</th>
                          <th className="text-left py-2 px-2">Successful</th>
                          <th className="text-left py-2 px-2">Success Rate</th>
                          <th className="text-left py-2 px-2">Avg Duration</th>
                          <th className="text-left py-2 px-2">Voicemail Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentData.map((agent) => (
                          <tr key={agent.agent_id} className="border-b">
                            <td className="py-2 px-2">{agent.agent_name}</td>
                            <td className="py-2 px-2">{formatNumber(agent.total_calls)}</td>
                            <td className="py-2 px-2">{formatNumber(agent.successful_calls)}</td>
                            <td className="py-2 px-2">{formatPercent(agent.call_successful_rate)}</td>
                            <td className="py-2 px-2">{formatDuration(agent.avg_call_duration)}</td>
                            <td className="py-2 px-2">{formatPercent(agent.voicemail_rate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Agent Call Counts</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agent_name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_calls" name="Total Calls" fill="#8884d8" />
                      <Bar dataKey="successful_calls" name="Successful Calls" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
