'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  RefreshCw, 
  Download, 
  BarChart as BarChartIcon, 
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
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
  Bar
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface EnhancedCallTrendsWidgetProps {
  data?: Array<{
    date: string;
    calls: number;
  }>;
  dailyTrends?: Record<string, number>;
}

export function EnhancedCallTrendsWidget({ data: initialData, dailyTrends }: EnhancedCallTrendsWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('daily');
  const [trendData, setTrendData] = useState<Array<{
    date: string;
    calls: number;
    weekday: string;
  }>>([]);
  const [weeklyData, setWeeklyData] = useState<Array<{
    week: string;
    calls: number;
  }>>([]);
  const [monthlyData, setMonthlyData] = useState<Array<{
    month: string;
    calls: number;
  }>>([]);

  // Generate sample trend data if none provided
  const generateTrendData = useCallback(() => {
    if (initialData && initialData.length > 0) {
      return initialData.map(item => ({
        ...item,
        weekday: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
      }));
    }

    if (dailyTrends && Object.keys(dailyTrends).length > 0) {
      return Object.entries(dailyTrends).map(([date, calls]) => ({
        date,
        calls,
        weekday: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      }));
    }

    const today = new Date();
    const data = [];
    
    // Generate past data (last 30 days)
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Create some realistic patterns with weekend dips
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Base value with some randomness
      let value = isWeekend ? 
        Math.floor(Math.random() * 5) + 2 : 
        Math.floor(Math.random() * 15) + 8;
      
      // Add a trend (increasing over time)
      value += Math.floor(i / 10);
      
      data.push({
        date: date.toISOString().split('T')[0],
        calls: value,
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    
    return data;
  }, [initialData, dailyTrends]);

  // Generate weekly data from daily data
  const generateWeeklyData = useCallback((dailyData) => {
    const weekMap = new Map();
    
    dailyData.forEach(day => {
      const date = new Date(day.date);
      // Get the week number (approximate by dividing by 7)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (weekMap.has(weekKey)) {
        weekMap.set(weekKey, weekMap.get(weekKey) + day.calls);
      } else {
        weekMap.set(weekKey, day.calls);
      }
    });
    
    return Array.from(weekMap.entries()).map(([week, calls]) => ({
      week: `Week of ${new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      calls
    }));
  }, []);

  // Generate monthly data from daily data
  const generateMonthlyData = useCallback((dailyData) => {
    const monthMap = new Map();
    
    dailyData.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (monthMap.has(monthKey)) {
        monthMap.set(monthKey, monthMap.get(monthKey) + day.calls);
      } else {
        monthMap.set(monthKey, day.calls);
      }
    });
    
    return Array.from(monthMap.entries()).map(([monthKey, calls]) => {
      const [year, month] = monthKey.split('-');
      return {
        month: new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        calls
      };
    });
  }, []);

  useEffect(() => {
    // Generate data on component mount
    const daily = generateTrendData();
    setTrendData(daily);
    setWeeklyData(generateWeeklyData(daily));
    setMonthlyData(generateMonthlyData(daily));
  }, [generateTrendData, generateWeeklyData, generateMonthlyData]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const daily = generateTrendData();
      setTrendData(daily);
      setWeeklyData(generateWeeklyData(daily));
      setMonthlyData(generateMonthlyData(daily));
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content based on active tab
    let csvContent = '';
    let filename = '';
    
    if (activeTab === 'daily') {
      const headers = ['Date', 'Weekday', 'Calls'];
      csvContent = [
        headers.join(','),
        ...trendData.map(row => 
          [
            row.date, 
            row.weekday,
            row.calls
          ].join(',')
        )
      ].join('\n');
      filename = `daily_call_trends_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'weekly') {
      const headers = ['Week', 'Calls'];
      csvContent = [
        headers.join(','),
        ...weeklyData.map(row => 
          [
            row.week, 
            row.calls
          ].join(',')
        )
      ].join('\n');
      filename = `weekly_call_trends_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Month', 'Calls'];
      csvContent = [
        headers.join(','),
        ...monthlyData.map(row => 
          [
            row.month, 
            row.calls
          ].join(',')
        )
      ].join('\n');
      filename = `monthly_call_trends_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Calculate trend metrics
  const calculateTrendMetrics = () => {
    if (trendData.length < 2) return { trend: 0, average: 0 };
    
    const recentData = trendData.slice(-7);
    const olderData = trendData.slice(-14, -7);
    
    const recentTotal = recentData.reduce((sum, item) => sum + item.calls, 0);
    const olderTotal = olderData.reduce((sum, item) => sum + item.calls, 0);
    
    const recentAvg = recentTotal / recentData.length;
    const olderAvg = olderTotal / olderData.length;
    
    const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    
    return {
      trend,
      average: recentAvg
    };
  };

  const metrics = calculateTrendMetrics();

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-blue-100 dark:from-teal-950 dark:to-blue-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Call Trends</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-teal-600 dark:text-teal-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </Button>
            <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" onValueChange={setActiveTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="daily" className="flex-1">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1">
              <BarChartIcon className="h-3.5 w-3.5 mr-1" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1">
              <LineChart className="h-3.5 w-3.5 mr-1" />
              Monthly
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{Math.round(metrics.average)}</div>
                <div className="text-xs text-muted-foreground">
                  Average daily calls
                </div>
              </div>
              <div className={`flex items-center ${metrics.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.trend >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                <span className="font-medium">{Math.abs(metrics.trend).toFixed(1)}%</span>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={trendData.slice(-14)}>
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
                    <Line 
                      type="monotone" 
                      dataKey="calls" 
                      stroke="#0d9488" 
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Calls"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="weekly">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">
                  {weeklyData.length > 0 ? weeklyData[weeklyData.length - 1].calls : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Last week's calls
                </div>
              </div>
              <div className="flex items-center text-blue-500">
                <BarChartIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Weekly breakdown</span>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="week" 
                      tick={{fontSize: 10}}
                    />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Bar 
                      dataKey="calls" 
                      fill="#0d9488" 
                      name="Calls"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="monthly">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">
                  {monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].calls : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  This month's calls
                </div>
              </div>
              <div className="flex items-center text-teal-500">
                <LineChart className="h-4 w-4 mr-1" />
                <span className="font-medium">Monthly trend</span>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{fontSize: 10}}
                    />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Bar 
                      dataKey="calls" 
                      fill="#0d9488" 
                      name="Calls"
                    />
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
