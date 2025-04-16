import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCalls } from '@/hooks/use-calls';
import { format } from 'date-fns';
import { Clock, Phone, Mail, User } from 'lucide-react';

const callStatusColors: Record<'Completed' | 'Missed' | 'Voicemail', 'destructive' | 'secondary' | 'default'> = {
  Completed: 'default',
  Missed: 'destructive',
  Voicemail: 'secondary',
};

const callTypeIcons: Record<'Inbound' | 'Outbound', React.ReactNode> = {
  Inbound: <Phone className="h-4 w-4" />,
  Outbound: <Phone className="h-4 w-4 rotate-180" />,
};

export function LiveCalls() {
  const { calls, isLoading, refreshCalls } = useCalls();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Live Calls</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshCalls}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            Loading...
          </div>
        ) : (
          <div className="space-y-2">
            {calls.map((call: ReturnType<typeof useCalls>['calls'][number]) => (
              <div
                key={call.id}
                className="flex items-center p-3 border-b border-border"
              >
                <div className="flex items-center space-x-2">
                  {callTypeIcons[call.call_type as 'Inbound' | 'Outbound']}
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {call.lead_name ?? 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {call.lead_phone}
                    </p>
                  </div>
                </div>
                <div className="ml-auto flex items-center space-x-2">
                  <Badge
                    variant={callStatusColors[call.call_status as 'Completed' | 'Missed' | 'Voicemail']}
                    className="whitespace-nowrap"
                  >
                    {call.call_status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {format(new Date(call.timestamp), 'HH:mm')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    <Mail className="mr-1 h-3 w-3" />
                    {call.call_duration ? `${Math.floor(call.call_duration / 60)}m ${call.call_duration % 60}s` : '0m 0s'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    <User className="mr-1 h-3 w-3" />
                    {call.agent_name ?? 'Unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
