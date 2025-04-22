import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  RefreshCw,
  Download,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Clock,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EnhancedCallQualityWidgetProps {
  quality: {
    excellent: number;
    good: number;
    poor: number;
  };
}

export function EnhancedCallQualityWidget({ quality }: EnhancedCallQualityWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('distribution');
  const [trendData, setTrendData] = useState<Array<{
    date: string;
    excellent: number;
    good: number;
    poor: number;
    total: number;
  }>>([]);

  // Generate sample trend data
  const generateTrendData = useCallback(() => {
    const today = new Date();
    const data = [];

    // Generate past data (last 14 days)
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      // Create some realistic patterns with weekend dips
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Base values with some randomness
      const excellent = isWeekend ?
        Math.floor(Math.random() * 5) + 2 :
        Math.floor(Math.random() * 10) + 5;

      const good = isWeekend ?
        Math.floor(Math.random() * 8) + 3 :
        Math.floor(Math.random() * 15) + 8;

      const poor = isWeekend ?
        Math.floor(Math.random() * 3) + 1 :
        Math.floor(Math.random() * 5) + 2;

      data.push({
        date: date.toISOString().split('T')[0],
        excellent,
        good,
        poor,
        total: excellent + good + poor
      });
    }

    return data;
  }, []);

  // Prepare pie chart data
  const pieData = [
    { name: 'Excellent (>5m)', value: quality.excellent, color: '#22c55e' },
    { name: 'Good (2-5m)', value: quality.good, color: '#3b82f6' },
    { name: 'Poor (<2m)', value: quality.poor, color: '#ef4444' }
  ];

  // Calculate total calls and percentages
  const totalCalls = quality.excellent + quality.good + quality.poor;
  const excellentPercent = totalCalls > 0 ? (quality.excellent / totalCalls) * 100 : 0;
  const goodPercent = totalCalls > 0 ? (quality.good / totalCalls) * 100 : 0;
  const poorPercent = totalCalls > 0 ? (quality.poor / totalCalls) * 100 : 0;

  useEffect(() => {
    // Generate trend data on component mount
    if (trendData.length === 0) {
      setTrendData(generateTrendData());
    }
  }, [generateTrendData, trendData.length]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTrendData(generateTrendData());
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content based on active tab
    let csvContent = '';
    let filename = '';

    if (activeTab === 'distribution') {
      const headers = ['Quality', 'Count', 'Percentage'];
      csvContent = [
        headers.join(','),
        ['Excellent (>5m)', quality.excellent, `${excellentPercent.toFixed(1)}%`].join(','),
        ['Good (2-5m)', quality.good, `${goodPercent.toFixed(1)}%`].join(','),
        ['Poor (<2m)', quality.poor, `${poorPercent.toFixed(1)}%`].join(',')
      ].join('\n');
      filename = `call_quality_distribution_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'trends') {
      const headers = ['Date', 'Excellent', 'Good', 'Poor', 'Total'];
      csvContent = [
        headers.join(','),
        ...trendData.map(row =>
          [
            row.date,
            row.excellent,
            row.good,
            row.poor,
            row.total
          ].join(',')
        )
      ].join('\n');
      filename = `call_quality_trends_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Metric', 'Value'];
      csvContent = [
        headers.join(','),
        ['Total Calls', totalCalls].join(','),
        ['Excellent Calls', quality.excellent].join(','),
        ['Good Calls', quality.good].join(','),
        ['Poor Calls', quality.poor].join(','),
        ['Excellent Percentage', `${excellentPercent.toFixed(1)}%`].join(','),
        ['Good Percentage', `${goodPercent.toFixed(1)}%`].join(','),
        ['Poor Percentage', `${poorPercent.toFixed(1)}%`].join(',')
      ].join('\n');
      filename = `call_quality_metrics_${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Call Quality</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-blue-600 dark:text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Button>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" onValueChange={setActiveTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="distribution" className="flex-1">
              <PieChartIcon className="h-3.5 w-3.5 mr-1" />
              Distribution
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex-1">
              <LineChart className="h-3.5 w-3.5 mr-1" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex-1">
              <BarChartIcon className="h-3.5 w-3.5 mr-1" />
              Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="distribution">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{totalCalls}</div>
                <div className="text-xs text-muted-foreground">
                  Total analyzed calls
                </div>
              </div>
              <div className="flex items-center text-green-500">
                <ThumbsUp className="h-4 w-4 mr-1" />
                <span className="font-medium">{excellentPercent.toFixed(1)}% Excellent</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="40%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} calls (${((value / totalCalls) * 100).toFixed(1)}%)`, name]} />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{ paddingLeft: '20px' }}
                      iconSize={10}
                      fontSize={12}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{trendData.length > 0 ? trendData[trendData.length - 1].total : 0}</div>
                <div className="text-xs text-muted-foreground">
                  Recent daily call volume
                </div>
              </div>
              <div className="flex items-center text-blue-500">
                <Clock className="h-4 w-4 mr-1" />
                <span className="font-medium">15-day trend</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={trendData}>
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
                      dataKey="excellent"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Excellent"
                    />
                    <Line
                      type="monotone"
                      dataKey="good"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Good"
                    />
                    <Line
                      type="monotone"
                      dataKey="poor"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Poor"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium flex items-center">
                    <ThumbsUp className="h-3.5 w-3.5 mr-1 text-green-500" />
                    Excellent Calls
                  </span>
                  <span className="text-sm font-medium">{quality.excellent} ({excellentPercent.toFixed(1)}%)</span>
                </div>
                <Progress value={excellentPercent} className="h-2 bg-gray-200" indicatorClassName="bg-green-500" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    Good Calls
                  </span>
                  <span className="text-sm font-medium">{quality.good} ({goodPercent.toFixed(1)}%)</span>
                </div>
                <Progress value={goodPercent} className="h-2 bg-gray-200" indicatorClassName="bg-blue-500" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1 text-red-500" />
                    Poor Calls
                  </span>
                  <span className="text-sm font-medium">{quality.poor} ({poorPercent.toFixed(1)}%)</span>
                </div>
                <Progress value={poorPercent} className="h-2 bg-gray-200" indicatorClassName="bg-red-500" />
              </div>

              <div className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground">Excellent Rate</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{excellentPercent.toFixed(1)}%</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground">Poor Rate</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">{poorPercent.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
