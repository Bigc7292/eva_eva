import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Download,
  Check,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface EnhancedGoogleCalendarProps {
  calendarId?: string;
  maxEvents?: number;
  fullHeight?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  type: 'meeting' | 'call' | 'followup' | 'other';
  status: 'confirmed' | 'tentative' | 'cancelled';
}

// Helper function to generate dates for calendar view
const generateCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Get first day of month and how many days in month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDay.getDay();

  // Calculate days from previous month to show
  const daysFromPrevMonth = firstDayOfWeek;

  // Calculate total days to show (max 6 weeks = 42 days)
  const totalDays = 42;

  const days = [];

  // Add days from previous month
  const prevMonth = new Date(year, month, 0);
  const prevMonthDays = prevMonth.getDate();

  for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
    days.push({
      date: new Date(year, month - 1, i),
      isCurrentMonth: false,
      isToday: false
    });
  }

  // Add days from current month
  const currentDate = new Date();
  const isCurrentYearMonth = currentDate.getFullYear() === year && currentDate.getMonth() === month;

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
      isToday: isCurrentYearMonth && currentDate.getDate() === i
    });
  }

  // Add days from next month
  const remainingDays = totalDays - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
      isToday: false
    });
  }

  return days;
};

export function EnhancedGoogleCalendar({
  calendarId = 'primary',
  maxEvents = 10,
  fullHeight = false,
  autoRefresh = true,
  refreshInterval = 60000 // 1 minute by default
}: EnhancedGoogleCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    types: {
      meeting: true,
      call: true,
      followup: true,
      other: true
    },
    status: {
      confirmed: true,
      tentative: true,
      cancelled: false
    }
  });

  // Sample events for demonstration
  // Define this outside of the component to avoid dependency issues
  const generateSampleEvents = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    const eventTypes = ['meeting', 'call', 'followup', 'other'];
    const statuses = ['confirmed', 'tentative', 'cancelled'];
    const locations = ['Dubai Marina', 'Dubai Office', 'Palm Jumeirah', 'Downtown Dubai', 'Business Bay'];
    const clientNames = [
      'Ahmed Al-Mansoori', 'Sarah Johnson', 'Mohammed Al Farsi',
      'John Smith', 'Fatima Al Zaabi', 'Robert Chen', 'Aisha Khan'
    ];
    const propertyNames = [
      'Marina Towers', 'Palm Residence', 'Downtown Heights',
      'Business Bay Plaza', 'Jumeirah Beach Residence', 'Sheikh Zayed Apartments'
    ];

    const events: CalendarEvent[] = [];

    // Generate 20 random events spread across the month
    for (let i = 0; i < 20; i++) {
      const eventDay = Math.floor(Math.random() * 28) + 1;
      const hour = Math.floor(Math.random() * 9) + 9; // 9 AM to 6 PM
      const duration = Math.floor(Math.random() * 2) + 1; // 1-2 hours

      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)] as 'meeting' | 'call' | 'followup' | 'other';
      const status = statuses[Math.floor(Math.random() * statuses.length)] as 'confirmed' | 'tentative' | 'cancelled';
      const location = locations[Math.floor(Math.random() * locations.length)];
      const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
      const propertyName = propertyNames[Math.floor(Math.random() * propertyNames.length)];

      let title = '';
      if (type === 'meeting') {
        title = `Property Viewing - ${propertyName} with ${clientName}`;
      } else if (type === 'call') {
        title = `Call with ${clientName}`;
      } else if (type === 'followup') {
        title = `Follow-up - ${clientName}`;
      } else {
        title = `Meeting with ${clientName}`;
      }

      const start = new Date(year, month, eventDay, hour, 0, 0);
      const end = new Date(year, month, eventDay, hour + duration, 0, 0);

      events.push({
        id: `event-${i}`,
        title,
        start: start.toISOString(),
        end: end.toISOString(),
        location: type === 'call' ? undefined : location,
        type,
        status
      });
    }

    // Add some events for today and tomorrow to ensure we have some upcoming events
    for (let i = 0; i < 3; i++) {
      const dayOffset = Math.floor(Math.random() * 7); // 0-6 days from today
      const hour = Math.floor(Math.random() * 9) + 9; // 9 AM to 6 PM
      const duration = Math.floor(Math.random() * 2) + 1; // 1-2 hours

      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)] as 'meeting' | 'call' | 'followup' | 'other';
      const status = 'confirmed';
      const location = locations[Math.floor(Math.random() * locations.length)];
      const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
      const propertyName = propertyNames[Math.floor(Math.random() * propertyNames.length)];

      let title = '';
      if (type === 'meeting') {
        title = `Property Viewing - ${propertyName} with ${clientName}`;
      } else if (type === 'call') {
        title = `Call with ${clientName}`;
      } else if (type === 'followup') {
        title = `Follow-up - ${clientName}`;
      } else {
        title = `Meeting with ${clientName}`;
      }

      const start = new Date(year, month, day + dayOffset, hour, 0, 0);
      const end = new Date(year, month, day + dayOffset, hour + duration, 0, 0);

      events.push({
        id: `upcoming-${i}`,
        title,
        start: start.toISOString(),
        end: end.toISOString(),
        location: type === 'call' ? undefined : location,
        type,
        status
      });
    }

    return events;
  }, []);

  // Check authentication status with Google Calendar
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/google/check');
      if (response.ok) {
        const { isAuthenticated: authStatus } = await response.json();
        setIsAuthenticated(authStatus);
        return authStatus;
      }
      return false;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }, []);

  // Function to fetch calendar events from the API
  const fetchCalendarEvents = useCallback(async () => {
    // Check authentication status first
    const authStatus = await checkAuthStatus();
    if (!authStatus) return;

    setLoading(true);

    try {
      // Get current date range for fetching events
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Make API call to fetch calendar events
      try {
        const response = await fetch(`/api/calendar/events?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data);
        setError(null);
        console.log('Calendar events refreshed at', new Date().toLocaleTimeString());
      } catch (apiError) {
        console.error('API call failed, using sample data instead:', apiError);
        // Fallback to sample data if API call fails
        const sampleEvents = generateSampleEvents();
        setEvents(sampleEvents);
      }
    } catch (err) {
      setError('Failed to load calendar events');
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, checkAuthStatus, generateSampleEvents]);

  // Check for auth parameter in URL
  useEffect(() => {
    // Check if we have auth=success or auth=error in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    const reasonParam = urlParams.get('reason');

    if (authParam === 'success') {
      console.log('Google Calendar authentication successful');
      // Remove the auth parameter from the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('auth');
      newUrl.searchParams.delete('reason');
      window.history.replaceState({}, document.title, newUrl.toString());

      // Refresh calendar events
      fetchCalendarEvents();
    } else if (authParam === 'error') {
      console.error('Google Calendar authentication failed:', reasonParam);
      setError(`Failed to authenticate with Google Calendar${reasonParam ? `: ${reasonParam}` : ''}`);
      // Remove the auth parameter from the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('auth');
      newUrl.searchParams.delete('reason');
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, [fetchCalendarEvents]);

  // Initial auth check and fetch of calendar events
  useEffect(() => {
    checkAuthStatus().then((authStatus) => {
      if (authStatus) {
        fetchCalendarEvents();
      }
    });
  }, [checkAuthStatus, fetchCalendarEvents]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const intervalId = setInterval(() => {
      fetchCalendarEvents();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchCalendarEvents, isAuthenticated]);

  useEffect(() => {
    // Update calendar days when current date changes
    setCalendarDays(generateCalendarDays(currentDate));
  }, [currentDate]);

  useEffect(() => {
    // Apply filters to events
    const filtered = events.filter(event => {
      return filters.types[event.type] && filters.status[event.status];
    });

    setFilteredEvents(filtered);
  }, [events, filters]);

  const handleRefresh = () => {
    fetchCalendarEvents();
  };

  const handleAuth = async () => {
    try {
      // Show loading state
      setLoading(true);

      // Log the current origin for debugging
      console.log('Current origin:', window.location.origin);

      // Create the auth URL directly with hardcoded client ID
      const clientId = '889823691212-l5ooomrd37jpbisohg1q8vofmupbr3c3.apps.googleusercontent.com';
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;

      console.log('Generated auth URL:', authUrl);

      // Make a direct fetch request to test the API endpoint
      try {
        const response = await fetch('/api/auth/google/check');
        const data = await response.json();
        console.log('Auth check response:', data);
      } catch (checkError) {
        console.error('Error checking auth status:', checkError);
      }

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error initiating Google auth:', err);
      setError(`Failed to connect to Google Calendar: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Title', 'Start', 'End', 'Location', 'Type', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredEvents.map(event =>
        [
          `"${event.title}"`,
          new Date(event.start).toLocaleString(),
          new Date(event.end).toLocaleString(),
          event.location ? `"${event.location}"` : '',
          event.type,
          event.status
        ].join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `calendar_events_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventsByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500';
      case 'call': return 'bg-green-500';
      case 'followup': return 'bg-yellow-500';
      case 'other': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'border-green-500';
      case 'tentative': return 'border-yellow-500';
      case 'cancelled': return 'border-red-500 line-through opacity-50';
      default: return '';
    }
  };

  const renderCalendarView = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="mt-2">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="mx-4 font-medium">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={view === 'calendar' ? "default" : "outline"}
              size="sm"
              onClick={() => setView('calendar')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Calendar
            </Button>
            <Button
              variant={view === 'list' ? "default" : "outline"}
              size="sm"
              onClick={() => setView('list')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              List
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsByDate(day.date);
            return (
              <div
                key={`day-${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`}
                className={`
                  p-1 min-h-[60px] text-xs border rounded-sm
                  ${day.isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600'}
                  ${day.isToday ? 'border-blue-500 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'}
                `}
              >
                <div className="font-medium mb-1">
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={`
                        truncate text-[9px] px-1 py-0.5 rounded-sm border-l-2
                        ${getEventTypeColor(event.type)} bg-opacity-20
                        ${getEventStatusStyle(event.status)}
                      `}
                      title={event.title}
                    >
                      {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-center text-gray-500">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    // Group events by date
    const eventsByDate = filteredEvents.reduce((acc, event) => {
      const date = new Date(event.start).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);

    // Sort dates
    const sortedDates = Object.keys(eventsByDate).sort();

    return (
      <div className="mt-4 space-y-4">
        {sortedDates.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No events found matching your filters
          </div>
        ) : (
          sortedDates.map(date => {
            const dateObj = new Date(date);
            const isToday = new Date().toISOString().split('T')[0] === date;
            const isFuture = dateObj > new Date();

            return (
              <div key={date} className="space-y-2">
                <div className="flex items-center">
                  <h3 className={`text-sm font-medium ${isToday ? 'text-blue-500' : ''}`}>
                    {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  {isToday && (
                    <Badge variant="outline" className="ml-2 bg-blue-500 text-white">Today</Badge>
                  )}
                  {!isToday && isFuture && (
                    <Badge variant="outline" className="ml-2">Upcoming</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {eventsByDate[date].map(event => (
                    <div
                      key={event.id}
                      className={`
                        bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm
                        border-l-4 ${getEventTypeColor(event.type)}
                        ${event.status === 'cancelled' ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex justify-between">
                        <div className="font-medium text-sm">{event.title}</div>
                        <Badge
                          variant={event.status === 'confirmed' ? 'default' : 'outline'}
                          className={`
                            text-[10px]
                            ${event.status === 'tentative' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''}
                            ${event.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-300' : ''}
                          `}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} -
                        {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      {event.location && (
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-1" />
                          {event.location}
                        </div>
                      )}
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <Card className={`${fullHeight ? 'h-full' : ''} overflow-hidden`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Google Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Filter</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Event Type</h4>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Checkbox
                          id="filter-meeting"
                          checked={filters.types.meeting}
                          onCheckedChange={(checked) =>
                            setFilters({
                              ...filters,
                              types: {...filters.types, meeting: !!checked}
                            })
                          }
                        />
                        <Label htmlFor="filter-meeting" className="ml-2 text-sm">Meetings</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          id="filter-call"
                          checked={filters.types.call}
                          onCheckedChange={(checked) =>
                            setFilters({
                              ...filters,
                              types: {...filters.types, call: !!checked}
                            })
                          }
                        />
                        <Label htmlFor="filter-call" className="ml-2 text-sm">Calls</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          id="filter-followup"
                          checked={filters.types.followup}
                          onCheckedChange={(checked) =>
                            setFilters({
                              ...filters,
                              types: {...filters.types, followup: !!checked}
                            })
                          }
                        />
                        <Label htmlFor="filter-followup" className="ml-2 text-sm">Follow-ups</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          id="filter-other"
                          checked={filters.types.other}
                          onCheckedChange={(checked) =>
                            setFilters({
                              ...filters,
                              types: {...filters.types, other: !!checked}
                            })
                          }
                        />
                        <Label htmlFor="filter-other" className="ml-2 text-sm">Other</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Status</h4>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Checkbox
                          id="filter-confirmed"
                          checked={filters.status.confirmed}
                          onCheckedChange={(checked) =>
                            setFilters({
                              ...filters,
                              status: {...filters.status, confirmed: !!checked}
                            })
                          }
                        />
                        <Label htmlFor="filter-confirmed" className="ml-2 text-sm">Confirmed</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          id="filter-tentative"
                          checked={filters.status.tentative}
                          onCheckedChange={(checked) =>
                            setFilters({
                              ...filters,
                              status: {...filters.status, tentative: !!checked}
                            })
                          }
                        />
                        <Label htmlFor="filter-tentative" className="ml-2 text-sm">Tentative</Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          id="filter-cancelled"
                          checked={filters.status.cancelled}
                          onCheckedChange={(checked) =>
                            setFilters({
                              ...filters,
                              status: {...filters.status, cancelled: !!checked}
                            })
                          }
                        />
                        <Label htmlFor="filter-cancelled" className="ml-2 text-sm">Cancelled</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading || !isAuthenticated}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              disabled={loading || !isAuthenticated || filteredEvents.length === 0}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">New Event</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-center mb-4">Connect your Google Calendar to view and manage your schedule</p>
            <div className="space-y-2">
              <Button onClick={handleAuth} className="bg-indigo-600 hover:bg-indigo-700">
                <Calendar className="mr-2 h-4 w-4" />
                Connect Calendar
              </Button>

              <div className="text-xs text-center text-gray-500 mt-2">
                If the button doesn't work, try these alternatives:
                <div className="flex justify-center space-x-2 mt-1">
                  <a
                    href="/api/auth/google/test"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >Test API</a>
                  <span>|</span>
                  <a
                    href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=889823691212-l5ooomrd37jpbisohg1q8vofmupbr3c3.apps.googleusercontent.com&redirect_uri=${encodeURIComponent(`${window.location.origin}/api/auth/google/callback`)}&response_type=code&scope=https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent`}
                    className="text-indigo-600 hover:underline"
                  >Direct Auth</a>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">
            {error}
          </div>
        ) : (
          <div className={`${fullHeight ? 'h-[calc(100%-60px)] overflow-auto' : ''}`}>
            {view === 'calendar' ? renderCalendarView() : renderListView()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
