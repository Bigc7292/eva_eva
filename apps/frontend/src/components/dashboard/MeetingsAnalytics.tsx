import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Calendar, MapPin, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface MeetingsAnalyticsProps {
  totalMeetings: number;
  offplanMeetings: number;
  secondaryMeetings: number;
  costPerMeeting: number;
  totalCost: number;
}

export function MeetingsAnalytics({
  totalMeetings = 0,
  offplanMeetings = 0,
  secondaryMeetings = 0,
  costPerMeeting = 0,
  totalCost = 0
}: MeetingsAnalyticsProps) {
  // Calculate percentages
  const offplanPercentage = totalMeetings > 0 ? (offplanMeetings / totalMeetings) * 100 : 0;
  const secondaryPercentage = totalMeetings > 0 ? (secondaryMeetings / totalMeetings) * 100 : 0;

  // Data for pie chart
  const data = [
    { name: 'Offplan', value: offplanMeetings, color: '#4f46e5' },
    { name: 'Secondary', value: secondaryMeetings, color: '#10b981' }
  ];

  // Filter out zero values
  const chartData = data.filter(item => item.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMeetings}</div>
            {totalMeetings > 0 ? (
              <div className="text-xs text-muted-foreground mt-1">
                <span>Total scheduled meetings</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                <span>No meetings scheduled yet</span>
              </div>
            )}
            <Progress className="mt-2" value={totalMeetings > 0 ? 100 : 0} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Cost Per Meeting</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${costPerMeeting.toFixed(2)}</div>
            {costPerMeeting > 0 ? (
              <div className="text-xs text-muted-foreground mt-1">
                <span>Average cost per scheduled meeting</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                <span>No cost data available</span>
              </div>
            )}
            <Progress className="mt-2" value={costPerMeeting > 0 ? 100 : 0} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalCost.toFixed(2)}</div>
            {totalCost > 0 ? (
              <div className="text-xs text-muted-foreground mt-1">
                <span>Total cost for all meetings</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                <span>No cost data available</span>
              </div>
            )}
            <Progress className="mt-2" value={totalCost > 0 ? 100 : 0} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meeting Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} meetings`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No meeting data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meeting Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Offplan Meetings</span>
                  <span className="text-sm font-medium">{offplanMeetings}</span>
                </div>
                <Progress value={offplanPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{offplanPercentage.toFixed(1)}% of total meetings</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Secondary Meetings</span>
                  <span className="text-sm font-medium">{secondaryMeetings}</span>
                </div>
                <Progress value={secondaryPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{secondaryPercentage.toFixed(1)}% of total meetings</p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cost Breakdown</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">Offplan Cost</p>
                    <p className="text-sm font-medium">${(offplanMeetings * costPerMeeting).toFixed(2)}</p>
                  </div>
                  <div className="bg-muted p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">Secondary Cost</p>
                    <p className="text-sm font-medium">${(secondaryMeetings * costPerMeeting).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
