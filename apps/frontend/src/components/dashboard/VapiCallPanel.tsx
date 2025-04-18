'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Phone, Upload, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CallResponse {
  id: string;
  name: string;
  status: string;
  type: string;
  customer: {
    number: string;
  };
}

export function VapiCallPanel() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<Array<{ phoneNumber: string }>>([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [callResults, setCallResults] = useState<CallResponse[]>([]);
  const { toast } = useToast();

  const handleSingleCall = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/vapi/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      const data = await response.json();
      
      toast({
        title: 'Call Initiated',
        description: `Call to ${phoneNumber} has been queued`,
      });
      
      setCallResults([data]);
    } catch (error) {
      console.error('Error making call:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate call. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        // Extract phone numbers from CSV
        const phoneNumbers = jsonData.map((row: any) => {
          // Try to find a column that contains phone numbers
          const phoneKey = Object.keys(row).find(key => 
            key.toLowerCase().includes('phone') || 
            key.toLowerCase().includes('mobile') || 
            key.toLowerCase().includes('number')
          );
          
          return { 
            phoneNumber: phoneKey ? row[phoneKey].toString() : null 
          };
        }).filter(item => item.phoneNumber);
        
        setCsvData(phoneNumbers);
        
        toast({
          title: 'CSV Loaded',
          description: `Loaded ${phoneNumbers.length} phone numbers from CSV`,
        });
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse CSV file. Please check the format.',
          variant: 'destructive',
        });
      } finally {
        setCsvLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleBulkCalls = async () => {
    if (csvData.length === 0) {
      toast({
        title: 'Error',
        description: 'Please upload a CSV file with phone numbers first',
        variant: 'destructive',
      });
      return;
    }

    setCsvLoading(true);
    try {
      const response = await fetch('/api/vapi/bulk-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumbers: csvData.map(item => item.phoneNumber),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate bulk calls');
      }

      const data = await response.json();
      
      toast({
        title: 'Bulk Calls Initiated',
        description: `${data.length} calls have been queued`,
      });
      
      setCallResults(data);
    } catch (error) {
      console.error('Error making bulk calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate bulk calls. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make VAPI Calls</CardTitle>
        <CardDescription>
          Initiate calls to leads using VAPI AI voice assistant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="single">Single Call</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Calls</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="phone-number"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Button onClick={handleSingleCall} disabled={loading}>
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
                Enter the phone number with country code (e.g., +1 for US)
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="bulk" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-upload">Upload CSV File</Label>
              <div className="flex space-x-2">
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={csvLoading}
                />
                <Button onClick={handleBulkCalls} disabled={csvLoading || csvData.length === 0}>
                  {csvLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Start Calls
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with phone numbers. The file should have a column with phone numbers.
              </p>
              
              {csvData.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Loaded {csvData.length} phone numbers:</p>
                  <div className="mt-2 p-2 bg-muted rounded-md max-h-32 overflow-y-auto">
                    <ul className="text-sm">
                      {csvData.slice(0, 5).map((item, index) => (
                        <li key={index}>{item.phoneNumber}</li>
                      ))}
                      {csvData.length > 5 && <li>...and {csvData.length - 5} more</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {callResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Call Results</h3>
            <div className="bg-muted p-3 rounded-md max-h-48 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(callResults, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
