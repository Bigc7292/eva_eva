'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function TestVapiCall() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCall = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setCallId(null);
    setCallStatus(null);

    try {
      const response = await fetch('/api/vapi/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate call');
      }

      setCallId(data.id);
      setCallStatus(data.status);

      toast({
        title: 'Call Initiated',
        description: `Call ID: ${data.id}`,
      });

      // Poll for call status updates
      if (data.id) {
        pollCallStatus(data.id);
      }
    } catch (err) {
      console.error('Error initiating call:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to initiate call',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const pollCallStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/vapi/call/status?id=${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get call status');
      }

      setCallStatus(data.status);

      // Continue polling if call is not completed
      if (['queued', 'in-progress', 'ringing'].includes(data.status)) {
        setTimeout(() => pollCallStatus(id), 5000);
      } else {
        toast({
          title: 'Call Status Updated',
          description: `Status: ${data.status}`,
        });
      }
    } catch (err) {
      console.error('Error polling call status:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Vapi Call</CardTitle>
        <CardDescription>
          Make a test call using Vapi AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone Number</Label>
            <div className="flex space-x-2">
              <Input
                id="phone-number"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button onClick={handleCall} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calling...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the phone number with country code (e.g., +971 for UAE)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {callId && (
            <div className="p-3 bg-muted rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Call ID:</span>
                <span className="font-mono">{callId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className={`font-medium ${
                  callStatus === 'completed' ? 'text-green-600' :
                  callStatus === 'failed' ? 'text-red-600' :
                  'text-amber-600'
                }`}>
                  {callStatus || 'Unknown'}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Using Vapi Assistant ID: {process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID?.substring(0, 8)}...
        </p>
      </CardFooter>
    </Card>
  );
}
