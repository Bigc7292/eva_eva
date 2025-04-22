import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Award,
  RefreshCw,
  Download,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface LeadSource {
  name: string;
  count: number;
  conversionRate: number;
}

interface EnhancedLeadPerformanceWidgetProps {
  totalLeads?: number;
  convertedLeads?: number;
  sources?: LeadSource[];
}

export function EnhancedLeadPerformanceWidget({
  totalLeads = 0,
  convertedLeads = 0,
  sources = []
}: EnhancedLeadPerformanceWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [conversionData, setConversionData] = useState<Array<{
    date: string;
    leads: number;
    conversions: number;
  }>>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);

  // Generate sample conversion data
  const generateConversionData = useCallback(() => {
    const data = [];
    const today = new Date();

    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      // Create some realistic patterns with weekend dips
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Base values with some randomness
      const leads = isWeekend ?
        Math.floor(Math.random() * 5) + 2 :
        Math.floor(Math.random() * 10) + 5;

      const conversions = Math.floor(leads * (Math.random() * 0.3 + 0.1));

      data.push({
        date: date.toISOString().split('T')[0],
        leads,
        conversions
      });
    }

    return data;
  }, []);

  // Generate sample lead sources
  const generateLeadSources = useCallback(() => {
    if (sources && sources.length > 0) {
      return sources;
    }

    return [
      { name: 'Website', count: 45, conversionRate: 22 },
      { name: 'Social Media', count: 32, conversionRate: 18 },
      { name: 'Direct Call', count: 28, conversionRate: 35 },
      { name: 'Referral', count: 15, conversionRate: 40 },
      { name: 'Email', count: 10, conversionRate: 15 }
    ];
  }, [sources]);

  useEffect(() => {
    // Generate data on component mount only if not already generated
    if (conversionData.length === 0) {
      setConversionData(generateConversionData());
      setLeadSources(generateLeadSources());
    }
  }, [generateConversionData, generateLeadSources, conversionData.length]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setConversionData(generateConversionData());
      setLeadSources(generateLeadSources());
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content based on active tab
    let csvContent = '';
    let filename = '';

    if (activeTab === 'overview') {
      const headers = ['Metric', 'Value'];
      csvContent = [
        headers.join(','),
        ['Total Leads', totalLeads || leadSources.reduce((sum, source) => sum + source.count, 0)].join(','),
        ['Converted Leads', convertedLeads || Math.floor(leadSources.reduce((sum, source) => sum + (source.count * source.conversionRate / 100), 0))].join(','),
        ['Conversion Rate', `${calculateConversionRate().toFixed(1)}%`].join(',')
      ].join('\n');
      filename = `lead_performance_overview_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'trends') {
      const headers = ['Date', 'Leads', 'Conversions', 'Conversion Rate'];
      csvContent = [
        headers.join(','),
        ...conversionData.map(row => {
          const rate = row.leads > 0 ? (row.conversions / row.leads) * 100 : 0;
          return [
            row.date,
            row.leads,
            row.conversions,
            `${rate.toFixed(1)}%`
          ].join(',');
        })
      ].join('\n');
      filename = `lead_conversion_trends_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Source', 'Lead Count', 'Conversion Rate'];
      csvContent = [
        headers.join(','),
        ...leadSources.map(source =>
          [
            source.name,
            source.count,
            `${source.conversionRate.toFixed(1)}%`
          ].join(',')
        )
      ].join('\n');
      filename = `lead_sources_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate conversion rate
  const calculateConversionRate = () => {
    if (totalLeads && convertedLeads) {
      return totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    }

    const totalLeadsCount = leadSources.reduce((sum, source) => sum + source.count, 0);
    const totalConversions = Math.floor(leadSources.reduce((sum, source) => sum + (source.count * source.conversionRate / 100), 0));

    return totalLeadsCount > 0 ? (totalConversions / totalLeadsCount) * 100 : 0;
  };

  // Calculate total leads and conversions
  const calculatedTotalLeads = totalLeads || leadSources.reduce((sum, source) => sum + source.count, 0);
  const calculatedConvertedLeads = convertedLeads || Math.floor(leadSources.reduce((sum, source) => sum + (source.count * source.conversionRate / 100), 0));
  const conversionRate = calculateConversionRate();

  // Sort sources by conversion rate
  const sortedSources = [...leadSources].sort((a, b) => b.conversionRate - a.conversionRate);

  // Colors for the sources bar chart
  const sourceColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Lead Performance</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-amber-600 dark:text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </Button>
            <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="overview" className="flex-1">
              <Target className="h-3.5 w-3.5 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex-1">
              <LineChartIcon className="h-3.5 w-3.5 mr-1" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex-1">
              <Users className="h-3.5 w-3.5 mr-1" />
              Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{calculatedTotalLeads}</div>
                <div className="text-xs text-muted-foreground">
                  Total leads
                </div>
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="font-medium">{conversionRate.toFixed(1)}% conversion</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Converted Leads</span>
                  <span className="text-sm font-medium">{calculatedConvertedLeads} / {calculatedTotalLeads}</span>
                </div>
                <Progress value={conversionRate} className="h-2" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Conversion Rate: {conversionRate.toFixed(1)}%</span>
                  <span>Target: 30%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Top Source</div>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {sortedSources.length > 0 ? sortedSources[0].name : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sortedSources.length > 0 ? `${sortedSources[0].conversionRate}% conversion` : ''}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Avg. Cost per Lead</div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">$24.50</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-500">↓ 12%</span> vs last month
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">
                  {conversionData.length > 0 ? conversionData[conversionData.length - 1].leads : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Recent daily leads
                </div>
              </div>
              <div className="flex items-center text-amber-500">
                <LineChartIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">15-day trend</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{fontSize: 10}}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip
                      formatter={(value) => [Number(value).toFixed(0), '']}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Leads"
                    />
                    <Line
                      type="monotone"
                      dataKey="conversions"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Conversions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sources">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{leadSources.length}</div>
                <div className="text-xs text-muted-foreground">
                  Active lead sources
                </div>
              </div>
              <div className="flex items-center text-blue-500">
                <Users className="h-4 w-4 mr-1" />
                <span className="font-medium">Source breakdown</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={leadSources}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{fontSize: 10}} />
                    <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={60} />
                    <Tooltip formatter={(value, name, props) => {
                      if (name === 'count') return [`${value} leads`, 'Count'];
                      if (name === 'conversionRate') return [`${value}%`, 'Conversion Rate'];
                      return [value, name];
                    }} />
                    <Legend />
                    <Bar dataKey="count" name="Lead Count" radius={[0, 4, 4, 0]}>
                      {leadSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={sourceColors[index % sourceColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
