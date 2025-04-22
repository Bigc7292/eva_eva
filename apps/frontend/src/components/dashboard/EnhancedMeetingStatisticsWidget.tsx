import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  RefreshCw,
  Download,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EnhancedMeetingStatisticsWidgetProps {
  totalMeetings?: number;
  completedMeetings?: number;
  cancelledMeetings?: number;
  scheduledMeetings?: number;
}

export function EnhancedMeetingStatisticsWidget({
  totalMeetings = 0,
  completedMeetings = 0,
  cancelledMeetings = 0,
  scheduledMeetings = 0
}: EnhancedMeetingStatisticsWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [weeklyData, setWeeklyData] = useState<Array<{
    week: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>>([]);

  // Calculate percentages
  const completedPercentage = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;
  const cancelledPercentage = totalMeetings > 0 ? (cancelledMeetings / totalMeetings) * 100 : 0;
  const scheduledPercentage = totalMeetings > 0 ? (scheduledMeetings / totalMeetings) * 100 : 0;

  // Generate sample weekly data
  const generateWeeklyData = useCallback(() => {
    const data = [];
    const today = new Date();

    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7));

      // Create some realistic patterns
      const baseScheduled = Math.floor(Math.random() * 5) + 5;
      const baseCompleted = Math.floor(baseScheduled * 0.7);
      const baseCancelled = Math.floor(baseScheduled * 0.2);

      data.push({
        week: `Week ${5-i}`,
        scheduled: baseScheduled,
        completed: baseCompleted,
        cancelled: baseCancelled
      });
    }

    return data;
  }, []);

  useEffect(() => {
    // Generate data on component mount only if not already generated
    if (weeklyData.length === 0) {
      setWeeklyData(generateWeeklyData());
    }
  }, [generateWeeklyData, weeklyData.length]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setWeeklyData(generateWeeklyData());
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content based on active tab
    let csvContent = '';
    let filename = '';

    if (activeTab === 'overview') {
      const headers = ['Metric', 'Value', 'Percentage'];
      csvContent = [
        headers.join(','),
        ['Total Meetings', totalMeetings, '100%'].join(','),
        ['Completed Meetings', completedMeetings, `${completedPercentage.toFixed(1)}%`].join(','),
        ['Scheduled Meetings', scheduledMeetings, `${scheduledPercentage.toFixed(1)}%`].join(','),
        ['Cancelled Meetings', cancelledMeetings, `${cancelledPercentage.toFixed(1)}%`].join(',')
      ].join('\n');
      filename = `meeting_statistics_overview_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'trends') {
      const headers = ['Week', 'Scheduled', 'Completed', 'Cancelled'];
      csvContent = [
        headers.join(','),
        ...weeklyData.map(row =>
          [
            row.week,
            row.scheduled,
            row.completed,
            row.cancelled
          ].join(',')
        )
      ].join('\n');
      filename = `meeting_trends_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Status', 'Count', 'Percentage'];
      csvContent = [
        headers.join(','),
        ['Completed', completedMeetings, `${completedPercentage.toFixed(1)}%`].join(','),
        ['Scheduled', scheduledMeetings, `${scheduledPercentage.toFixed(1)}%`].join(','),
        ['Cancelled', cancelledMeetings, `${cancelledPercentage.toFixed(1)}%`].join(',')
      ].join('\n');
      filename = `meeting_distribution_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Data for status pie chart
  const statusData = [
    { name: 'Completed', value: completedMeetings, color: '#10b981' },
    { name: 'Scheduled', value: scheduledMeetings, color: '#3b82f6' },
    { name: 'Cancelled', value: cancelledMeetings, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950 dark:to-purple-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Meeting Statistics</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </Button>
            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="overview" className="flex-1">
              <BarChartIcon className="h-3.5 w-3.5 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex-1">
              <PieChartIcon className="h-3.5 w-3.5 mr-1" />
              Distribution
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex-1">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium">Total Meetings</span>
                </div>
                <div className="text-2xl font-bold">{totalMeetings}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  All meetings in system
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <div className="text-2xl font-bold">{completedMeetings}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {completedPercentage.toFixed(1)}% completion rate
                </div>
                <Progress className="mt-2" value={completedPercentage} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Scheduled</span>
                </div>
                <div className="text-2xl font-bold">{scheduledMeetings}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {scheduledPercentage.toFixed(1)}% of total meetings
                </div>
                <Progress className="mt-2" value={scheduledPercentage} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Cancelled</span>
                </div>
                <div className="text-2xl font-bold">{cancelledMeetings}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {cancelledPercentage.toFixed(1)}% cancellation rate
                </div>
                <Progress className="mt-2" value={cancelledPercentage} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{totalMeetings}</div>
                <div className="text-xs text-muted-foreground">
                  Total meetings
                </div>
              </div>
              <div className="flex items-center text-indigo-500">
                <PieChartIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Status distribution</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : totalMeetings === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No meeting data available</p>
                <p className="text-xs text-muted-foreground">Schedule meetings to see distribution</p>
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={false}
                    >
                      {statusData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} meetings (${((value / totalMeetings) * 100).toFixed(1)}%)`, '']} />
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
                <div className="text-2xl font-bold">
                  {weeklyData.length > 0 ? weeklyData[weeklyData.length - 1].scheduled : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Meetings this week
                </div>
              </div>
              <div className="flex items-center text-blue-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="font-medium">Weekly trends</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Legend wrapperStyle={{fontSize: '10px'}} />
                    <Bar dataKey="scheduled" name="Scheduled" fill="#3b82f6" />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" />
                    <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" />
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
