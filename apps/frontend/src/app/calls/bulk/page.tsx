'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Phone, Upload } from 'lucide-react'
import { CheckCircleIcon, AlertTriangleIcon, ListChecksIcon, LoaderIcon, FileWarningIcon, InfoIcon } from '@/components/ui/icons/custom-icons'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface VapiCall {
  id: string;
  status: string;
  to?: string;
  from?: string;
  direction?: 'inbound' | 'outbound';
}

export default function BulkCallPage() {
  // Manual entry state
  const [phoneNumbers, setPhoneNumbers] = useState('')
  const [notes, setNotes] = useState('')

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [metadataFields, setMetadataFields] = useState('name,email,company')

  // Common state
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 })
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    result?: {
      successful: VapiCall[];
      failed: Array<{phoneNumber: string, error: string}>;
      successCount: number;
      failureCount: number;
      total: number;
    };
    validationResults?: {
      total: number;
      valid: number;
      invalid: number;
      errors: Array<{line: number, error: string}>;
    };
  } | null>(null)

  const { toast } = useToast()

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numbers = phoneNumbers
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0)

    if (numbers.length === 0) {
      toast({
        title: 'No phone numbers',
        description: 'Please enter at least one phone number',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/calls/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumbers: numbers,
          metadata: {
            notes,
            source: 'bulk-call-page-manual'
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Bulk calls initiated successfully',
          result: data.result
        })
        toast({
          title: 'Calls initiated',
          description: `${data.result.successCount} calls initiated successfully`,
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to initiate bulk calls'
        })
        toast({
          title: 'Calls failed',
          description: data.error || 'Failed to initiate bulk calls',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error initiating bulk calls:', error)
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      })
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!csvFile) {
      toast({
        title: 'No CSV file',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setResult(null)
    setProgress({ completed: 0, total: 0, percentage: 0 })

    try {
      const formData = new FormData()
      formData.append('file', csvFile)

      // Add metadata fields if provided
      if (metadataFields) {
        const fields = metadataFields.split(',').map(f => f.trim()).filter(f => f)
        formData.append('metadataFields', JSON.stringify(fields))
      }

      // Add common metadata
      formData.append('metadata', JSON.stringify({
        source: 'bulk-call-page-csv',
        notes
      }))

      // First step: Process and validate the CSV
      toast({
        title: 'Processing CSV',
        description: 'Validating phone numbers and preparing calls...',
      })

      const response = await fetch('/api/calls/csv', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        // Update progress based on validation results
        if (data.validationResults) {
          setProgress({
            completed: 0,
            total: data.validationResults.valid,
            percentage: 0
          })
        }

        setResult({
          success: true,
          message: data.message || 'CSV processed and calls initiated successfully',
          result: data.result,
          validationResults: data.validationResults
        })

        toast({
          title: 'CSV processed',
          description: `${data.result.successCount} calls initiated successfully`,
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to process CSV and initiate calls',
          validationResults: data.validationResults
        })

        toast({
          title: 'CSV processing failed',
          description: data.error || 'Failed to process CSV and initiate calls',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error processing CSV:', error)
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      })

      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Update progress when result changes
  useEffect(() => {
    if (result?.result) {
      const { successCount, failureCount, total } = result.result
      const completed = successCount + failureCount

      setProgress({
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      })
    }
  }, [result])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Make Bulk Calls</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Tabs defaultValue="manual">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Phone Number Entry</CardTitle>
                  <CardDescription>
                    Enter phone numbers manually, one per line
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSubmit} id="manual-form">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumbers">Phone Numbers *</Label>
                        <Textarea
                          id="phoneNumbers"
                          placeholder="+971501234567
+971502345678
+971503456789"
                          value={phoneNumbers}
                          onChange={(e) => setPhoneNumbers(e.target.value)}
                          rows={8}
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          Enter each phone number on a new line with country code
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any notes about these calls"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    form="manual-form"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Initiating Calls...' : 'Make Bulk Calls'}
                    {!loading && <Phone className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="csv">
              <Card>
                <CardHeader>
                  <CardTitle>CSV Upload</CardTitle>
                  <CardDescription>
                    Upload a CSV file with phone numbers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCsvSubmit} id="csv-form">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="csvFile">CSV File *</Label>
                        <div className="border-2 border-dashed rounded-md p-6 text-center">
                          <Input
                            id="csvFile"
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                              if (e.target?.files?.[0]) {
                                setCsvFile(e.target.files[0])
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="csvFile"
                            className="cursor-pointer flex flex-col items-center justify-center"
                          >
                            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                            <span className="text-sm font-medium">
                              {csvFile ? csvFile.name : 'Click to upload CSV file'}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                              CSV file with phone numbers
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="metadataFields">Metadata Fields (Optional)</Label>
                        <Input
                          id="metadataFields"
                          placeholder="name,email,company"
                          value={metadataFields}
                          onChange={(e) => setMetadataFields(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Comma-separated list of column names to include as metadata
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="csvNotes">Notes (Optional)</Label>
                        <Textarea
                          id="csvNotes"
                          placeholder="Add any notes about these calls"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    form="csv-form"
                    disabled={loading || !csvFile}
                    className="w-full"
                  >
                    {loading ? 'Processing CSV...' : 'Upload and Make Calls'}
                    {!loading && <Upload className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>How it works:</strong> This page allows you to initiate multiple calls at once using the VAPI service.
                </p>
                <p>
                  <strong>Manual Entry:</strong> Enter phone numbers one per line with country code.
                </p>
                <p>
                  <strong>CSV Upload:</strong> Upload a CSV file with phone numbers. The system will automatically detect the phone number column.
                </p>
                <p>
                  <strong>Metadata Fields:</strong> For CSV uploads, you can specify which columns to include as metadata.
                </p>
                <p>
                  All calls will be handled by our AI assistant, which will engage with customers and collect information.
                </p>
                <p>
                  Call details, transcripts, and recordings will be available in the Calls section once calls are completed.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Call Status</CardTitle>
              <CardDescription>
                The status of your bulk calls will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-center">
                    <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3">Processing...</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{progress.completed} / {progress.total || '?'}</span>
                    </div>
                    <Progress value={progress.percentage} className="w-full h-2" />
                  </div>
                </div>
              )}

              {!loading && !result && (
                <div className="text-center py-8 text-muted-foreground">
                  No bulk calls initiated yet
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <Alert variant={result.success ? "default" : "destructive"}>
                    {result.success ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <AlertTriangleIcon className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {result.success ? 'Bulk Calls Initiated' : 'Bulk Calls Failed'}
                    </AlertTitle>
                    <AlertDescription>
                      {result.message}
                    </AlertDescription>
                  </Alert>

                  {result.validationResults && (
                    <div className="border rounded-md p-4">
                      <div className="flex items-center mb-2">
                        <InfoIcon className="h-4 w-4 mr-2" />
                        <h3 className="font-medium">CSV Validation Results</h3>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-muted p-2 rounded-md text-center">
                          <div className="text-lg font-bold">{result.validationResults.total}</div>
                          <div className="text-xs">Total Entries</div>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-md text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {result.validationResults.valid}
                          </div>
                          <div className="text-xs">Valid</div>
                        </div>
                        <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-md text-center">
                          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {result.validationResults.invalid}
                          </div>
                          <div className="text-xs">Invalid</div>
                        </div>
                      </div>

                      {result.validationResults?.errors?.length > 0 && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="errors">
                            <AccordionTrigger className="text-sm">
                              <div className="flex items-center">
                                <FileWarningIcon className="h-4 w-4 mr-2 text-amber-500" />
                                <span>View {result.validationResults?.errors?.length} validation errors</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="text-sm space-y-2 mt-2">
                                {result.validationResults?.errors?.map((error, index) => (
                                  <div key={`error-${error.line}-${index}`} className="flex items-start">
                                    <Badge variant="outline" className="mr-2 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300">
                                      Line {error.line}
                                    </Badge>
                                    <span>{error.error}</span>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  )}

                  {result.success && result.result && (
                    <div className="mt-6 space-y-6">
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <ListChecksIcon className="h-4 w-4 mr-2" />
                          Call Summary
                        </h3>

                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-muted p-3 rounded-md">
                            <div className="text-2xl font-bold">{result.result.total}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                          <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-md">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {result.result.successCount}
                            </div>
                            <div className="text-xs text-muted-foreground">Successful</div>
                          </div>
                          <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-md">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {result.result.failureCount}
                            </div>
                            <div className="text-xs text-muted-foreground">Failed</div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Progress
                            value={(result.result.successCount / result.result.total) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>

                      {result.result.successful.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Successful Calls</h3>
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-border">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                    Call ID
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                    Phone Number
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {result.result.successful.slice(0, 5).map((call, index) => (
                                  <tr key={`call-${call.id}-${index}`}>
                                    <td className="px-4 py-2 text-sm">{call.id}</td>
                                    <td className="px-4 py-2 text-sm">{call.to}</td>
                                    <td className="px-4 py-2 text-sm">{call.status}</td>
                                  </tr>
                                ))}
                                {result.result.successful.length > 5 && (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-2 text-sm text-center text-muted-foreground">
                                      + {result.result.successful.length - 5} more calls
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {result.result.failed.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Failed Calls</h3>
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-border">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                    Phone Number
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                    Error
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {result.result.failed.slice(0, 5).map((fail, index) => (
                                  <tr key={`fail-${fail.phoneNumber}-${index}`}>
                                    <td className="px-4 py-2 text-sm">{fail.phoneNumber}</td>
                                    <td className="px-4 py-2 text-sm text-red-500">{fail.error}</td>
                                  </tr>
                                ))}
                                {result.result.failed.length > 5 && (
                                  <tr>
                                    <td colSpan={2} className="px-4 py-2 text-sm text-center text-muted-foreground">
                                      + {result.result.failed.length - 5} more failed calls
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
