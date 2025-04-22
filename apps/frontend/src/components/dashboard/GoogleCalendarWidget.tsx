import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, RefreshCw } from 'lucide-react';

interface GoogleCalendarWidgetProps {
  calendarId?: string;
  maxEvents?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
}

export function GoogleCalendarWidget({ 
  calendarId = 'primary', 
  maxEvents = 5 
}: GoogleCalendarWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Sample events for demonstration
  const sampleEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Property Viewing - Marina Towers',
      start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      location: 'Dubai Marina'
    },
    {
      id: '2',
      title: 'Client Meeting - Ahmed Al-Mansoori',
      start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
      location: 'Dubai Office'
    },
    {
      id: '3',
      title: 'Property Handover - Palm Residence',
      start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      location: 'Palm Jumeirah'
    }
  ];

  useEffect(() => {
    // In a real implementation, we would fetch events from Google Calendar API
    // For now, we'll use sample data
    setEvents(sampleEvents);
    setLoading(false);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    // In a real implementation, we would fetch events from Google Calendar API
    setTimeout(() => {
      setEvents(sampleEvents);
      setLoading(false);
    }, 1000);
  };

  const handleAuth = () => {
    // In a real implementation, we would redirect to Google OAuth
    setIsAuthenticated(true);
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

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Google Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={loading || !isAuthenticated}
            >
              <RefreshCw className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-sm text-center mb-4">Connect your Google Calendar to view upcoming meetings</p>
            <Button onClick={handleAuth} className="bg-indigo-600 hover:bg-indigo-700">
              <Calendar className="mr-2 h-4 w-4" />
              Connect Calendar
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No upcoming events found
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Upcoming Events</h3>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="bg-white dark:bg-indigo-900/50 rounded-md p-2 shadow-sm">
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(event.start)}
                  </div>
                  {event.location && (
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-1"></span>
                      {event.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Button variant="link" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 p-0">
                <ExternalLink className="h-3 w-3 mr-1" />
                Open in Google Calendar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
