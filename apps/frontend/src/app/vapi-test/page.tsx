'use client';

import { useState } from 'react';
import { TestVapiCall } from '@/components/vapi/TestVapiCall';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function VapiTestPage() {
  const [vapiConfig, setVapiConfig] = useState({
    publicKey: process.env.NEXT_PUBLIC_VAPI_API_KEY || '',
    privateKey: process.env.NEXT_PRIVATE_VAPI_API_KEY || '',
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '',
    phoneNumberId: process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID || ''
  });
  const { toast } = useToast();

  const checkVapiConfig = async () => {
    try {
      const response = await fetch('/api/vapi/config');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check Vapi configuration');
      }

      toast({
        title: 'Vapi Configuration',
        description: 'Configuration checked successfully',
      });

      setVapiConfig({
        publicKey: data.publicKey || '',
        privateKey: data.privateKey ? '***' : '',
        assistantId: data.assistantId || '',
        phoneNumberId: data.phoneNumberId || ''
      });
    } catch (error) {
      console.error('Error checking Vapi configuration:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check Vapi configuration',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Vapi AI Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vapi Configuration</CardTitle>
            <CardDescription>
              Current Vapi API configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Public API Key:</div>
                <div className="font-mono text-sm">
                  {vapiConfig.publicKey ? `${vapiConfig.publicKey.substring(0, 8)}...` : 'Not configured'}
                </div>
                
                <div className="font-medium">Private API Key:</div>
                <div className="font-mono text-sm">
                  {vapiConfig.privateKey ? `${vapiConfig.privateKey === '***' ? '***' : vapiConfig.privateKey.substring(0, 8)}...` : 'Not configured'}
                </div>
                
                <div className="font-medium">Assistant ID:</div>
                <div className="font-mono text-sm">
                  {vapiConfig.assistantId ? `${vapiConfig.assistantId.substring(0, 8)}...` : 'Not configured'}
                </div>
                
                <div className="font-medium">Phone Number ID:</div>
                <div className="font-mono text-sm">
                  {vapiConfig.phoneNumberId ? `${vapiConfig.phoneNumberId.substring(0, 8)}...` : 'Not configured'}
                </div>
              </div>
              
              <Button onClick={checkVapiConfig}>
                Refresh Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <TestVapiCall />
      </div>
      
      <div className="mt-8">
        <Tabs defaultValue="calls">
          <TabsList>
            <TabsTrigger value="calls">Recent Calls</TabsTrigger>
            <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
                <CardDescription>
                  Recent calls made using Vapi AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No recent calls found. Make a test call to see the results here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Events</CardTitle>
                <CardDescription>
                  Recent webhook events received from Vapi AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No webhook events found. Configure webhooks in Vapi dashboard to receive events here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
