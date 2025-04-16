'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ApiCall {
  id: string;
  timestamp: string;
  service: 'VAPI' | 'Twilio' | 'Supabase' | 'Calendar' | 'Email' | 'Other';
  method: string;
  url: string;
  status: number;
  duration: number;
  request?: any;
  response?: any;
  error?: any;
}

// In-memory storage for API calls
const apiCalls: ApiCall[] = [];
const MAX_API_CALLS = 100;

// Add a new API call
export function recordApiCall(call: Omit<ApiCall, 'id' | 'timestamp'>) {
  const newCall: ApiCall = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    ...call
  };
  
  apiCalls.unshift(newCall);
  
  if (apiCalls.length > MAX_API_CALLS) {
    apiCalls.pop();
  }
  
  // Notify subscribers
  subscribers.forEach(subscriber => subscriber(apiCalls));
}

// Subscribers for API call updates
type ApiCallSubscriber = (calls: ApiCall[]) => void;
const subscribers: ApiCallSubscriber[] = [];

// Subscribe to API call updates
export function subscribeToApiCalls(callback: ApiCallSubscriber) {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
}

export function ApiMonitor() {
  const [calls, setCalls] = useState<ApiCall[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<ApiCall | null>(null);
  const [activeTab, setActiveTab] = useState<string>('request');

  useEffect(() => {
    // Initialize with existing calls
    setCalls([...apiCalls]);

    // Subscribe to new calls
    const unsubscribe = subscribeToApiCalls((updatedCalls) => {
      setCalls([...updatedCalls]);
    });

    return () => unsubscribe();
  }, []);

  const clearCalls = () => {
    apiCalls.length = 0;
    setCalls([]);
    setSelectedCall(null);
  };

  const filteredCalls = filter
    ? calls.filter(call => call.service === filter)
    : calls;

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
        <Button size="sm" variant="outline" onClick={clearCalls}>
          Clear
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <Card className="p-4 h-full overflow-hidden">
          <h3 className="text-sm font-medium mb-2">API Calls</h3>
          <ScrollArea className="h-[calc(100%-30px)]">
            <div className="space-y-2">
              {filteredCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API calls recorded
                </div>
              ) : (
                filteredCalls.map((call) => (
                  <div 
                    key={call.id} 
                    className={`p-3 border rounded-md cursor-pointer hover:bg-accent/50 ${selectedCall?.id === call.id ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge variant={call.status >= 200 && call.status < 300 ? "default" : "destructive"}>
                          {call.status}
                        </Badge>
                        <Badge variant="outline">{call.method}</Badge>
                        <Badge variant="outline">{call.service}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {call.duration}ms
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-xs truncate">{call.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(call.timestamp).toLocaleTimeString()}
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
          {selectedCall ? (
            <div className="h-[calc(100%-30px)]">
              <div className="mb-2">
                <p className="text-sm font-medium">{selectedCall.method} {selectedCall.url}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={selectedCall.status >= 200 && selectedCall.status < 300 ? "default" : "destructive"}>
                    {selectedCall.status}
                  </Badge>
                  <Badge variant="outline">{selectedCall.service}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedCall.duration}ms
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedCall.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <Tabs defaultValue="request" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                  {selectedCall.error && (
                    <TabsTrigger value="error">Error</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="request" className="mt-2">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      {selectedCall.request 
                        ? JSON.stringify(selectedCall.request, null, 2)
                        : 'No request data available'}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="response" className="mt-2">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      {selectedCall.response 
                        ? JSON.stringify(selectedCall.response, null, 2)
                        : 'No response data available'}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                {selectedCall.error && (
                  <TabsContent value="error" className="mt-2">
                    <ScrollArea className="h-[calc(100vh-350px)]">
                      <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto text-red-500">
                        {JSON.stringify(selectedCall.error, null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100%-30px)]">
              <p className="text-muted-foreground">Select an API call to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
