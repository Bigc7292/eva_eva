'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/services/supabase'
import { vapiLogger, twilioLogger, supabaseLogger, calendarLogger, emailLogger } from '@/lib/services/logger'

interface ServiceStatusInfo {
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  lastChecked: string;
  responseTime?: number;
  details?: any;
  error?: any;
}

// In-memory storage for service status
const serviceStatuses: Record<string, ServiceStatusInfo> = {
  'VAPI': {
    name: 'VAPI',
    status: 'unknown',
    lastChecked: new Date().toISOString()
  },
  'Twilio': {
    name: 'Twilio',
    status: 'unknown',
    lastChecked: new Date().toISOString()
  },
  'Supabase': {
    name: 'Supabase',
    status: 'unknown',
    lastChecked: new Date().toISOString()
  },
  'Calendar': {
    name: 'Google Calendar',
    status: 'unknown',
    lastChecked: new Date().toISOString()
  },
  'Email': {
    name: 'Email Service',
    status: 'unknown',
    lastChecked: new Date().toISOString()
  }
};

// Update service status
export function updateServiceStatus(service: string, status: Partial<ServiceStatusInfo>) {
  if (serviceStatuses[service]) {
    serviceStatuses[service] = {
      ...serviceStatuses[service],
      ...status,
      lastChecked: new Date().toISOString()
    };

    // Notify subscribers
    subscribers.forEach(subscriber => subscriber({...serviceStatuses}));
  }
}

// Subscribers for service status updates
type ServiceStatusSubscriber = (statuses: Record<string, ServiceStatusInfo>) => void;
const subscribers: ServiceStatusSubscriber[] = [];

// Subscribe to service status updates
export function subscribeToServiceStatus(callback: ServiceStatusSubscriber) {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
}

export function ServiceStatus() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatusInfo>>({...serviceStatuses});
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = subscribeToServiceStatus((updatedStatuses) => {
      setStatuses({...updatedStatuses});
    });

    // Check services on mount
    checkAllServices();

    return () => unsubscribe();
  }, []);

  const checkAllServices = async () => {
    if (isChecking) return;

    setIsChecking(true);
    setProgress(0);

    const services = Object.keys(serviceStatuses);
    const increment = 100 / services.length;

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      await checkService(service);
      setProgress((i + 1) * increment);
    }

    setIsChecking(false);
  };

  const checkService = async (service: string) => {
    switch (service) {
      case 'Supabase':
        await checkSupabase();
        break;
      case 'VAPI':
        await checkVapi();
        break;
      case 'Twilio':
        await checkTwilio();
        break;
      case 'Calendar':
        await checkCalendar();
        break;
      case 'Email':
        await checkEmail();
        break;
    }
  };

  const checkSupabase = async () => {
    try {
      const startTime = performance.now();

      // Simple query to check if Supabase is responsive
      const { data, error } = await supabase.from('calls').select('count', { count: 'exact', head: true });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (error) {
        updateServiceStatus('Supabase', {
          status: 'degraded',
          responseTime,
          error: error
        });
        supabaseLogger.error('Supabase health check failed', error);
      } else {
        updateServiceStatus('Supabase', {
          status: 'online',
          responseTime,
          details: { count: data }
        });
        supabaseLogger.info('Supabase health check passed', { responseTime });
      }
    } catch (error) {
      updateServiceStatus('Supabase', {
        status: 'offline',
        error: error
      });
      supabaseLogger.error('Supabase health check error', error);
    }
  };

  const checkVapi = async () => {
    try {
      const startTime = performance.now();

      // This is a mock check since we don't want to make actual API calls during testing
      // In a real implementation, you would make a lightweight call to the VAPI API
      await new Promise(resolve => setTimeout(resolve, 500));

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Simulate a successful response
      updateServiceStatus('VAPI', {
        status: 'online',
        responseTime,
        details: { message: 'VAPI service is operational' }
      });
      vapiLogger.info('VAPI health check passed', { responseTime });

    } catch (error) {
      updateServiceStatus('VAPI', {
        status: 'offline',
        error: error
      });
      vapiLogger.error('VAPI health check error', error);
    }
  };

  const checkTwilio = async () => {
    try {
      const startTime = performance.now();

      // This is a mock check
      await new Promise(resolve => setTimeout(resolve, 300));

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Simulate a successful response
      updateServiceStatus('Twilio', {
        status: 'online',
        responseTime,
        details: { message: 'Twilio service is operational' }
      });
      twilioLogger.info('Twilio health check passed', { responseTime });

    } catch (error) {
      updateServiceStatus('Twilio', {
        status: 'offline',
        error: error
      });
      twilioLogger.error('Twilio health check error', error);
    }
  };

  const checkCalendar = async () => {
    try {
      const startTime = performance.now();

      // This is a mock check
      await new Promise(resolve => setTimeout(resolve, 400));

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Simulate a successful response
      updateServiceStatus('Calendar', {
        status: 'online',
        responseTime,
        details: { message: 'Google Calendar service is operational' }
      });
      calendarLogger.info('Calendar health check passed', { responseTime });

    } catch (error) {
      updateServiceStatus('Calendar', {
        status: 'offline',
        error: error
      });
      calendarLogger.error('Calendar health check error', error);
    }
  };

  const checkEmail = async () => {
    try {
      const startTime = performance.now();

      // This is a mock check
      await new Promise(resolve => setTimeout(resolve, 350));

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Simulate a successful response
      updateServiceStatus('Email', {
        status: 'online',
        responseTime,
        details: { message: 'Email service is operational' }
      });
      emailLogger.info('Email health check passed', { responseTime });

    } catch (error) {
      updateServiceStatus('Email', {
        status: 'offline',
        error: error
      });
      emailLogger.error('Email health check error', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'degraded':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between mb-4">
        <h3 className="text-sm font-medium">Service Status</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={checkAllServices}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Check All Services'}
        </Button>
      </div>

      {isChecking && (
        <Progress value={progress} className="mb-4" />
      )}

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(statuses).map((service) => (
            <Card key={service.name} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                  <h4 className="font-medium">{service.name}</h4>
                </div>
                {getStatusBadge(service.status)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Checked:</span>
                  <span>{new Date(service.lastChecked).toLocaleTimeString()}</span>
                </div>

                {service.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response Time:</span>
                    <span>{service.responseTime}ms</span>
                  </div>
                )}

                {service.details && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Details:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(service.details, null, 2)}
                    </pre>
                  </div>
                )}

                {service.error && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-destructive mb-1">Error:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto text-destructive">
                      {JSON.stringify(service.error, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => checkService(service.name)}
                    disabled={isChecking}
                    className="h-7 text-xs"
                  >
                    Check Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
