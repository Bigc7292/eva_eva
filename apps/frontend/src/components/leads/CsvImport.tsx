'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Upload, Check, AlertCircle, X } from 'lucide-react'
import { databaseService } from '@/services/database'
import { Lead } from '@/lib/dummy-data'
import { useToast } from '@/components/ui/use-toast'

export function CsvImport() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importedLeads, setImportedLeads] = useState<Lead[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadStatus('idle')
      setShowPreview(false)
    }
  }

  const parseCSV = (text: string): string[][] => {
    // Simple CSV parser
    const lines = text.split('\\n').filter(line => line.trim() !== '')
    return lines.map(line => {
      // Handle quoted values with commas inside
      const result = []
      let inQuote = false
      let currentValue = ''
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
          inQuote = !inQuote
        } else if (char === ',' && !inQuote) {
          result.push(currentValue)
          currentValue = ''
        } else {
          currentValue += char
        }
      }
      
      result.push(currentValue)
      return result
    })
  }

  const convertToLeads = (data: string[][]): Lead[] => {
    // Assume first row is headers
    const headers = data[0].map(h => h.trim().toLowerCase())
    
    // Map CSV columns to lead properties
    const nameIndex = headers.findIndex(h => h === 'name' || h === 'full name')
    const emailIndex = headers.findIndex(h => h === 'email' || h === 'email address')
    const phoneIndex = headers.findIndex(h => h === 'phone' || h === 'phone number' || h === 'mobile')
    const locationIndex = headers.findIndex(h => h === 'location' || h === 'city' || h === 'address')
    const genderIndex = headers.findIndex(h => h === 'gender')
    const propertyInterestIndex = headers.findIndex(h => h === 'property interest' || h === 'property type')
    const budgetIndex = headers.findIndex(h => h === 'budget' || h === 'budget range')
    const sourceIndex = headers.findIndex(h => h === 'source' || h === 'lead source')
    
    // Convert rows to leads
    return data.slice(1).map((row, index) => {
      const now = new Date().toISOString()
      const id = `lead-import-${Date.now()}-${index}`
      const crmId = `CRM-${Math.floor(Math.random() * 10000)}`
      
      return {
        id,
        crmId,
        name: nameIndex >= 0 && row[nameIndex] ? row[nameIndex].trim() : '',
        email: emailIndex >= 0 && row[emailIndex] ? row[emailIndex].trim() : '',
        phone: phoneIndex >= 0 && row[phoneIndex] ? row[phoneIndex].trim() : '',
        location: locationIndex >= 0 && row[locationIndex] ? row[locationIndex].trim() : '',
        gender: genderIndex >= 0 && row[genderIndex] ? row[genderIndex].trim() : '',
        propertyInterest: propertyInterestIndex >= 0 && row[propertyInterestIndex] ? row[propertyInterestIndex].trim() : 'Not specified',
        investmentType: 'Not specified',
        budgetRange: budgetIndex >= 0 && row[budgetIndex] ? row[budgetIndex].trim() : 'Not specified',
        preferredAreas: [],
        status: 'New',
        priority: 'Medium',
        rating: 0,
        aiSentiment: 0,
        aiNotes: '',
        source: sourceIndex >= 0 && row[sourceIndex] ? row[sourceIndex].trim() : 'CSV Import',
        notes: 'Imported from CSV',
        createdAt: now,
        updatedAt: now,
        interactions: [],
        totalCalls: 0,
        lastContactDate: now,
        nextFollowUp: null,
        assignedAgent: null
      }
    })
  }

  const handlePreview = async () => {
    if (!file) return
    
    setIsUploading(true)
    
    try {
      const text = await file.text()
      const parsedData = parseCSV(text)
      const leads = convertToLeads(parsedData)
      
      setImportedLeads(leads)
      setShowPreview(true)
      setIsUploading(false)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      setUploadStatus('error')
      setIsUploading(false)
      
      toast({
        title: 'Error parsing CSV',
        description: 'Please check the file format and try again.',
        variant: 'destructive'
      })
    }
  }

  const handleImport = () => {
    if (importedLeads.length === 0) return
    
    setIsUploading(true)
    
    try {
      // Save leads to database
      importedLeads.forEach(lead => {
        databaseService.saveLead(lead)
      })
      
      setUploadStatus('success')
      setIsUploading(false)
      setShowPreview(false)
      
      toast({
        title: 'Import successful',
        description: `${importedLeads.length} leads imported successfully.`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Error importing leads:', error)
      setUploadStatus('error')
      setIsUploading(false)
      
      toast({
        title: 'Error importing leads',
        description: 'An error occurred while importing leads.',
        variant: 'destructive'
      })
    }
  }

  const handleCancel = () => {
    setFile(null)
    setImportedLeads([])
    setShowPreview(false)
    setUploadStatus('idle')
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Import Leads from CSV</h3>
      
      <div className="space-y-4">
        {!showPreview ? (
          <>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button 
                onClick={handlePreview}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
            </div>
            
            {uploadStatus === 'error' && (
              <div className="bg-red-100 text-red-800 p-3 rounded-md flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Error parsing CSV file. Please check the format and try again.
              </div>
            )}
            
            <div className="bg-muted p-3 rounded-md">
              <h4 className="font-medium mb-2">CSV Format</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Your CSV file should have the following columns:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Name (required)</li>
                <li>Email (required)</li>
                <li>Phone (required)</li>
                <li>Location (optional)</li>
                <li>Gender (optional)</li>
                <li>Property Interest (optional)</li>
                <li>Budget (optional)</li>
                <li>Source (optional)</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-100 text-green-800 p-3 rounded-md flex items-center">
              <Check className="h-4 w-4 mr-2" />
              Found {importedLeads.length} leads in the CSV file.
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left text-sm font-medium">Name</th>
                    <th className="p-2 text-left text-sm font-medium">Email</th>
                    <th className="p-2 text-left text-sm font-medium">Phone</th>
                    <th className="p-2 text-left text-sm font-medium">Location</th>
                    <th className="p-2 text-left text-sm font-medium">Property Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {importedLeads.slice(0, 5).map((lead, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 text-sm">{lead.name}</td>
                      <td className="p-2 text-sm">{lead.email}</td>
                      <td className="p-2 text-sm">{lead.phone}</td>
                      <td className="p-2 text-sm">{lead.location}</td>
                      <td className="p-2 text-sm">{lead.propertyInterest}</td>
                    </tr>
                  ))}
                  {importedLeads.length > 5 && (
                    <tr className="border-t">
                      <td colSpan={5} className="p-2 text-sm text-center text-muted-foreground">
                        And {importedLeads.length - 5} more leads...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Import {importedLeads.length} Leads
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
