'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from 'lucide-react'
import { databaseService } from '@/services/database'
import { useToast } from '@/components/ui/use-toast'
import Papa from 'papaparse'

interface CsvRow {
  [key: string]: string
}

interface MappedContact {
  name: string
  phone: string
  email: string
  location?: string
  gender?: string
  propertyInterest?: string
  budgetRange?: string
  source?: string
  notes?: string
}

export function CsvImport() {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [previewData, setPreviewData] = useState<MappedContact[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(null)
    
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV file')
      return
    }
    
    setFile(selectedFile)
    parseCSV(selectedFile)
  }

  const parseCSV = (file: File) => {
    setIsLoading(true)
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`)
          setIsLoading(false)
          return
        }
        
        const data = results.data as CsvRow[]
        if (data.length === 0) {
          setError('The CSV file is empty')
          setIsLoading(false)
          return
        }
        
        // Get headers from the first row
        const headers = Object.keys(data[0])
        
        // Create initial mapping suggestions
        const initialMapping: Record<string, string> = {}
        
        // Try to automatically map common field names
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase()
          
          if (lowerHeader.includes('name')) {
            initialMapping[header] = 'name'
          } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile') || lowerHeader.includes('cell')) {
            initialMapping[header] = 'phone'
          } else if (lowerHeader.includes('email')) {
            initialMapping[header] = 'email'
          } else if (lowerHeader.includes('location') || lowerHeader.includes('city') || lowerHeader.includes('address')) {
            initialMapping[header] = 'location'
          } else if (lowerHeader.includes('gender') || lowerHeader.includes('sex')) {
            initialMapping[header] = 'gender'
          } else if (lowerHeader.includes('interest') || lowerHeader.includes('property')) {
            initialMapping[header] = 'propertyInterest'
          } else if (lowerHeader.includes('budget') || lowerHeader.includes('price')) {
            initialMapping[header] = 'budgetRange'
          } else if (lowerHeader.includes('source') || lowerHeader.includes('channel')) {
            initialMapping[header] = 'source'
          } else if (lowerHeader.includes('note') || lowerHeader.includes('comment')) {
            initialMapping[header] = 'notes'
          }
        })
        
        setCsvData(data)
        setHeaders(headers)
        setMapping(initialMapping)
        updatePreview(data, initialMapping)
        setIsLoading(false)
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`)
        setIsLoading(false)
      }
    })
  }

  const updatePreview = (data: CsvRow[], mapping: Record<string, string>) => {
    // Create a preview of the first 5 rows with the current mapping
    const preview = data.slice(0, 5).map(row => {
      const mappedContact: MappedContact = {
        name: '',
        phone: '',
        email: ''
      }
      
      Object.entries(mapping).forEach(([csvField, contactField]) => {
        if (contactField && row[csvField]) {
          mappedContact[contactField as keyof MappedContact] = row[csvField]
        }
      })
      
      return mappedContact
    })
    
    setPreviewData(preview)
  }

  const handleMappingChange = (csvField: string, contactField: string) => {
    const newMapping = { ...mapping, [csvField]: contactField }
    setMapping(newMapping)
    updatePreview(csvData, newMapping)
  }

  const handleImport = async () => {
    setError(null)
    setSuccess(null)
    
    // Validate that required fields are mapped
    if (!Object.values(mapping).includes('name')) {
      setError('Name field must be mapped')
      return
    }
    
    if (!Object.values(mapping).includes('phone')) {
      setError('Phone field must be mapped')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Map CSV data to contacts
      const contacts = csvData.map(row => {
        const contact: MappedContact = {
          name: '',
          phone: '',
          email: ''
        }
        
        Object.entries(mapping).forEach(([csvField, contactField]) => {
          if (contactField && row[csvField]) {
            contact[contactField as keyof MappedContact] = row[csvField]
          }
        })
        
        return contact
      })
      
      // Filter out contacts with missing required fields
      const validContacts = contacts.filter(contact => contact.name && contact.phone)
      
      if (validContacts.length === 0) {
        setError('No valid contacts found in the CSV')
        setIsLoading(false)
        return
      }
      
      // Save contacts to database
      const now = new Date().toISOString()
      
      for (const contact of validContacts) {
        const leadId = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const crmId = `CRM-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        
        const lead = {
          id: leadId,
          crmId,
          name: contact.name,
          phone: contact.phone,
          email: contact.email || '',
          gender: contact.gender || '',
          location: contact.location || '',
          propertyInterest: contact.propertyInterest || 'Not specified',
          investmentType: 'Not specified',
          budgetRange: contact.budgetRange || 'Not specified',
          preferredAreas: [],
          status: 'New',
          priority: 'Medium',
          rating: 0,
          aiSentiment: 0,
          aiNotes: '',
          source: contact.source || 'CSV Import',
          notes: contact.notes || 'Imported from CSV',
          createdAt: now,
          updatedAt: now,
          interactions: [],
          totalCalls: 0,
          lastContactDate: now,
          nextFollowUp: null,
          assignedAgent: null
        }
        
        await databaseService.saveLead(lead)
      }
      
      setSuccess(`Successfully imported ${validContacts.length} contacts`)
      toast({
        title: 'Import Successful',
        description: `${validContacts.length} contacts have been imported`,
        variant: 'default'
      })
      
      // Reset form
      setFile(null)
      setCsvData([])
      setHeaders([])
      setMapping({})
      setPreviewData([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error importing contacts:', error)
      setError('An error occurred while importing contacts')
    } finally {
      setIsLoading(false)
    }
  }

  const contactFields = [
    { value: '', label: 'Select field...' },
    { value: 'name', label: 'Name' },
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'location', label: 'Location' },
    { value: 'gender', label: 'Gender' },
    { value: 'propertyInterest', label: 'Property Interest' },
    { value: 'budgetRange', label: 'Budget Range' },
    { value: 'source', label: 'Source' },
    { value: 'notes', label: 'Notes' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Contacts from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file to import contacts into the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              The CSV file should contain at least name and phone number columns
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {headers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Map CSV Fields to Contact Fields</h3>
              <div className="grid gap-4">
                {headers.map(header => (
                  <div key={header} className="grid grid-cols-2 gap-4 items-center">
                    <div className="text-sm font-medium">{header}</div>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={mapping[header] || ''}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      disabled={isLoading}
                    >
                      {contactFields.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preview (First 5 Rows)</h3>
              <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((contact, index) => (
                      <TableRow key={index}>
                        <TableCell>{contact.name || '-'}</TableCell>
                        <TableCell>{contact.phone || '-'}</TableCell>
                        <TableCell>{contact.email || '-'}</TableCell>
                        <TableCell>{contact.location || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {headers.length > 0 && (
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null)
              setCsvData([])
              setHeaders([])
              setMapping({})
              setPreviewData([])
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !Object.values(mapping).includes('name') || !Object.values(mapping).includes('phone')}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Import Contacts
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
