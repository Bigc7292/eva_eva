'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, Calendar, MapPin, DollarSign, CheckCircle, XCircle, Clock, Download, Filter, Search, List, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { MeetingsList } from './MeetingsList';

interface MeetingLocation {
  location: string;
  count: number;
}

interface MeetingType {
  type: string;
  count: number;
}

interface MeetingsAnalyticsProps {
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  scheduledMeetings: number;
  locations: MeetingLocation[];
  types: MeetingType[];
  costPerMeeting: number;
  totalCost: number;
  onFilterChange?: (filters: MeetingFilters) => void;
  onExport?: () => void;
  onViewDetails?: (meetingId: string) => void;
}

interface MeetingFilters {
  dateRange?: { start: Date; end: Date };
  location?: string;
  type?: string;
  status?: string;
}

interface Meeting {
  meeting_id: string;
  contact_id: string;
  meeting_time: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  location: string;
  type: string;
  contact?: {
    name: string;
    phone_number: string;
    email: string;
  };
}

export function MeetingsAnalytics({
  totalMeetings = 0,
  completedMeetings = 0,
  cancelledMeetings = 0,
  scheduledMeetings = 0,
  locations = [],
  types = [],
  costPerMeeting = 0,
  totalCost = 0,
  onFilterChange,
  onExport,
  onViewDetails
}: MeetingsAnalyticsProps) {
  const [filters, setFilters] = useState<MeetingFilters>({});
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sampleMeetings, setSampleMeetings] = useState<Meeting[]>([]);

  // Generate sample meetings data
  useEffect(() => {
    // Only generate sample data if we don't have real data
    const generateSampleMeetings = () => {
      const sampleData: Meeting[] = [
        {
          meeting_id: '1',
          contact_id: '101',
          meeting_time: new Date().toISOString(),
          status: 'Scheduled',
          notes: 'Initial consultation about property options',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          location: 'Dubai Office',
          type: 'Initial Consultation',
          contact: {
            name: 'Ahmed Al-Mansoori',
            phone_number: '+971521000001',
            email: 'ahmed@example.com'
          }
        },
        {
          meeting_id: '2',
          contact_id: '102',
          meeting_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Scheduled',
          notes: 'Property viewing in Downtown Dubai',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          location: 'Client Location',
          type: 'Property Viewing',
          contact: {
            name: 'Fatima Al-Nuaimi',
            phone_number: '+971521000002',
            email: 'fatima@example.com'
          }
        },
        {
          meeting_id: '3',
          contact_id: '103',
          meeting_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Completed',
          notes: 'Contract signing for Palm Jumeirah property',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Abu Dhabi Office',
          type: 'Contract Signing',
          contact: {
            name: 'Mohammed Khan',
            phone_number: '+971521000003',
            email: 'mohammed@example.com'
          }
        },
        {
          meeting_id: '4',
          contact_id: '104',
          meeting_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Cancelled',
          notes: 'Client cancelled due to schedule conflict',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Dubai Office',
          type: 'Initial Consultation',
          contact: {
            name: 'Aisha Al-Blooshi',
            phone_number: '+971521000004',
            email: 'aisha@example.com'
          }
        }
      ];

      setSampleMeetings(sampleData);
    };

    generateSampleMeetings();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: keyof MeetingFilters, value: unknown) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Filter meetings based on current filters
  const filteredMeetings = sampleMeetings.filter(meeting => {
    // Filter by location
    if (filters.location && filters.location !== 'all' && meeting.location !== filters.location) {
      return false;
    }

    // Filter by type
    if (filters.type && filters.type !== 'all' && meeting.type !== filters.type) {
      return false;
    }

    // Filter by status
    if (filters.status && filters.status !== 'all' && meeting.status.toLowerCase() !== filters.status.toLowerCase()) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange?.from && filters.dateRange?.to) {
      const meetingDate = new Date(meeting.meeting_time);
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);

      if (meetingDate < fromDate || meetingDate > toDate) {
        return false;
      }
    }

    return true;
  });

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export functionality
      const data = {
        summary: {
          totalMeetings,
          completedMeetings,
          cancelledMeetings,
          scheduledMeetings,
          costPerMeeting,
          totalCost
        },
        locations,
        types
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `meetings-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  // Calculate percentages
  const completedPercentage = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;
  const cancelledPercentage = totalMeetings > 0 ? (cancelledMeetings / totalMeetings) * 100 : 0;
  const scheduledPercentage = totalMeetings > 0 ? (scheduledMeetings / totalMeetings) * 100 : 0;

  // Data for status pie chart
  const statusData = [
    { name: 'Completed', value: completedMeetings, color: '#10b981' },
    { name: 'Cancelled', value: cancelledMeetings, color: '#ef4444' },
    { name: 'Scheduled', value: scheduledMeetings, color: '#3b82f6' }
  ];

  // Filter out zero values
  const statusChartData = statusData.filter(item => item.value > 0);

  // Prepare location data for chart
  const locationChartData = locations.map(loc => ({
    name: loc.location || 'Unknown',
    value: loc.count,
    color: loc.location === 'Dubai Office' ? '#4f46e5' :
           loc.location === 'Abu Dhabi Office' ? '#10b981' : '#f59e0b'
  }));

  // Prepare type data for chart
  const typeChartData = types.map(type => ({
    name: type.type || 'Unknown',
    value: type.count,
    color: type.type === 'Initial Consultation' ? '#3b82f6' :
           type.type === 'Property Viewing' ? '#10b981' : '#8b5cf6'
  }));

  return (
    <div className="space-y-4">
      {/* Filters and Export */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Meeting Filters</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium mb-2">Date Range</p>
              <DateRangePicker
                onChange={(range) => {
                  // Use a stable reference for the range object
                  const stableRange = {
                    from: range.from ? new Date(range.from) : undefined,
                    to: range.to ? new Date(range.to) : undefined
                  };
                  handleFilterChange('dateRange', stableRange);
                }}
                initialDateRange={{
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  to: new Date()
                }}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Location</p>
              <Select onValueChange={(value) => handleFilterChange('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.location} value={loc.location}>
                      {loc.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Meeting Type</p>
              <Select onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Status</p>
              <Select onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Overview and Meetings List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <List className="h-4 w-4 mr-2" />
            Meetings List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                <span>Total meetings in system</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                <span>No meetings scheduled yet</span>
              </div>
            )}
            <Progress className="mt-2" value={totalMeetings > 0 ? 100 : 0} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Completed Meetings</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedMeetings}</div>
            {completedMeetings > 0 ? (
              <div className="text-xs text-muted-foreground mt-1">
                <span>{completedPercentage.toFixed(1)}% completion rate</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                <span>No completed meetings</span>
              </div>
            )}
            <Progress className="mt-2" value={completedPercentage} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Scheduled Meetings</CardTitle>
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scheduledMeetings}</div>
            {scheduledMeetings > 0 ? (
              <div className="text-xs text-muted-foreground mt-1">
                <span>{scheduledPercentage.toFixed(1)}% of total meetings</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                <span>No upcoming meetings</span>
              </div>
            )}
            <Progress className="mt-2" value={scheduledPercentage} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Cancelled Meetings</CardTitle>
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cancelledMeetings}</div>
            {cancelledMeetings > 0 ? (
              <div className="text-xs text-muted-foreground mt-1">
                <span>{cancelledPercentage.toFixed(1)}% cancellation rate</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                <span>No cancelled meetings</span>
              </div>
            )}
            <Progress className="mt-2" value={cancelledPercentage} />
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
                <span>Average cost per meeting</span>
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
            <CardTitle className="text-base">Meeting Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusChartData.map((entry) => (
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
            <CardTitle className="text-base">Meeting Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {locationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} meetings`, 'Count']} />
                    <Bar dataKey="value">
                      {locationChartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No location data available</p>
                </div>
              )}
            </div>
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
              {typeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeChartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} meetings`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No meeting type data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Completed Meetings Cost</span>
                  <span className="text-sm font-medium">${(completedMeetings * costPerMeeting).toFixed(2)}</span>
                </div>
                <Progress value={completedPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{completedPercentage.toFixed(1)}% of total cost</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Scheduled Meetings Cost</span>
                  <span className="text-sm font-medium">${(scheduledMeetings * costPerMeeting).toFixed(2)}</span>
                </div>
                <Progress value={scheduledPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{scheduledPercentage.toFixed(1)}% of total cost</p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Location Cost Breakdown</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {locationChartData.slice(0, 2).map((location) => (
                    <div key={location.name} className="bg-muted p-2 rounded-md">
                      <p className="text-xs text-muted-foreground">{location.name}</p>
                      <p className="text-sm font-medium">${(location.value * costPerMeeting).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meetings List</CardTitle>
            </CardHeader>
            <CardContent>
              <MeetingsList
                meetings={filteredMeetings}
                onStatusChange={(meetingId, status) => {
                  // Update meeting status in the sample data
                  setSampleMeetings(prevMeetings =>
                    prevMeetings.map(meeting =>
                      meeting.meeting_id === meetingId
                        ? { ...meeting, status }
                        : meeting
                    )
                  );
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
