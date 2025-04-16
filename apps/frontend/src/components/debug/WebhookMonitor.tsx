'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WebhookEvent {
  id: string;
  timestamp: string;
  service: 'VAPI' | 'Twilio' | 'Supabase' | 'Calendar' | 'Email' | 'Other';
  eventType: string;
  payload: any;
  processed: boolean;
  processingResult?: any;
  error?: any;
}

// In-memory storage for webhook events
const webhookEvents: WebhookEvent[] = [];
const MAX_WEBHOOK_EVENTS = 100;

// Add a new webhook event
export function recordWebhookEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>) {
  const newEvent: WebhookEvent = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    ...event
  };
  
  webhookEvents.unshift(newEvent);
  
  if (webhookEvents.length > MAX_WEBHOOK_EVENTS) {
    webhookEvents.pop();
  }
  
  // Notify subscribers
  subscribers.forEach(subscriber => subscriber(webhookEvents));
}

// Subscribers for webhook event updates
type WebhookEventSubscriber = (events: WebhookEvent[]) => void;
const subscribers: WebhookEventSubscriber[] = [];

// Subscribe to webhook event updates
export function subscribeToWebhookEvents(callback: WebhookEventSubscriber) {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
}

export function WebhookMonitor() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [activeTab, setActiveTab] = useState<string>('payload');

  useEffect(() => {
    // Initialize with existing events
    setEvents([...webhookEvents]);

    // Subscribe to new events
    const unsubscribe = subscribeToWebhookEvents((updatedEvents) => {
      setEvents([...updatedEvents]);
    });

    return () => unsubscribe();
  }, []);

  const clearEvents = () => {
    webhookEvents.length = 0;
    setEvents([]);
    setSelectedEvent(null);
  };

  const filteredEvents = filter
    ? events.filter(event => event.service === filter)
    : events;

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant={filter === null ? "default" : "outline"} 
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'VAPI' ? "default" : "outline"} 
            onClick={() => setFilter('VAPI')}
          >
            VAPI
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'Twilio' ? "default" : "outline"} 
            onClick={() => setFilter('Twilio')}
          >
            Twilio
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'Supabase' ? "default" : "outline"} 
            onClick={() => setFilter('Supabase')}
          >
            Supabase
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'Calendar' ? "default" : "outline"} 
            onClick={() => setFilter('Calendar')}
          >
            Calendar
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'Email' ? "default" : "outline"} 
            onClick={() => setFilter('Email')}
          >
            Email
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={clearEvents}>
          Clear
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <Card className="p-4 h-full overflow-hidden">
          <h3 className="text-sm font-medium mb-2">Webhook Events</h3>
          <ScrollArea className="h-[calc(100%-30px)]">
            <div className="space-y-2">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No webhook events recorded
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`p-3 border rounded-md cursor-pointer hover:bg-accent/50 ${selectedEvent?.id === event.id ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge variant={event.error ? "destructive" : event.processed ? "default" : "secondary"}>
                          {event.eventType}
                        </Badge>
                        <Badge variant="outline">{event.service}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground">
                        {event.processed ? 'Processed' : 'Pending'}
                        {event.error && ' (Error)'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-4 h-full overflow-hidden">
          <h3 className="text-sm font-medium mb-2">Details</h3>
          {selectedEvent ? (
            <div className="h-[calc(100%-30px)]">
              <div className="mb-2">
                <p className="text-sm font-medium">{selectedEvent.eventType} from {selectedEvent.service}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={selectedEvent.error ? "destructive" : selectedEvent.processed ? "default" : "secondary"}>
                    {selectedEvent.processed ? 'Processed' : 'Pending'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedEvent.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <Tabs defaultValue="payload" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="payload">Payload</TabsTrigger>
                  {selectedEvent.processed && (
                    <TabsTrigger value="result">Result</TabsTrigger>
                  )}
                  {selectedEvent.error && (
                    <TabsTrigger value="error">Error</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="payload" className="mt-2">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(selectedEvent.payload, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                {selectedEvent.processed && (
                  <TabsContent value="result" className="mt-2">
                    <ScrollArea className="h-[calc(100vh-350px)]">
                      <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                        {selectedEvent.processingResult 
                          ? JSON.stringify(selectedEvent.processingResult, null, 2)
                          : 'No processing result available'}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                )}
                {selectedEvent.error && (
                  <TabsContent value="error" className="mt-2">
                    <ScrollArea className="h-[calc(100vh-350px)]">
                      <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto text-red-500">
                        {JSON.stringify(selectedEvent.error, null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100%-30px)]">
              <p className="text-muted-foreground">Select a webhook event to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
