import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { vapiService } from '@/lib/services/vapi'
import { supabase } from '@/lib/services/supabase'

/**
 * POST /api/calls/csv
 * Process a CSV file and initiate bulk calls
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const csvFile = formData.get('file') as File
    const metadataFields = formData.get('metadataFields') as string
    const commonMetadata = formData.get('metadata') as string
    const batchSize = formData.get('batchSize') as string

    if (!csvFile) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      )
    }

    // Parse metadata fields
    let metadataFieldsArray: string[] = []
    if (metadataFields) {
      try {
        metadataFieldsArray = JSON.parse(metadataFields)
      } catch (e) {
        console.error('Error parsing metadata fields:', e)
      }
    }

    // Parse common metadata
    let metadata = {}
    if (commonMetadata) {
      try {
        metadata = JSON.parse(commonMetadata)
      } catch (e) {
        console.error('Error parsing common metadata:', e)
      }
    }

    // Process CSV file with enhanced validation
    const { phoneNumbers, metadata: csvMetadata, validationResults } = await vapiService.processCsvForBulkCalls(
      csvFile,
      metadataFieldsArray
    )

    // Log validation results
    console.log('CSV validation results:', {
      total: validationResults.total,
      valid: validationResults.valid,
      invalid: validationResults.invalid,
      errorCount: validationResults.errors.length
    })

    // If there are validation errors, include them in the response
    if (validationResults.invalid > 0) {
      console.warn(`CSV has ${validationResults.invalid} invalid entries out of ${validationResults.total} total`)
    }

    if (phoneNumbers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid phone numbers found in CSV',
        validationResults
      }, { status: 400 })
    }

    // Add common metadata
    const callMetadata = {
      ...metadata,
      call_type: 'outbound',
      bulk_call: true,
      csv_import: true,
      initiated_at: new Date().toISOString(),
      csv_filename: csvFile.name,
      csv_validation: {
        total: validationResults.total,
        valid: validationResults.valid,
        invalid: validationResults.invalid
      }
    }

    // Initiate bulk calls with VAPI using the enhanced method with individual metadata
    const bulkCallResult = await vapiService.initiateBulkCalls(
      phoneNumbers,
      callMetadata,
      csvMetadata
    )

    // Store successful calls in Supabase
    if (bulkCallResult.successful.length > 0) {
      const callsToInsert = bulkCallResult.successful.map(call => {
        const phoneNumber = call.to || ''
        return {
          call_id: call.id,
          phone_number: phoneNumber,
          call_type: 'Outbound',
          call_status: 'initiated',
          start_time: new Date().toISOString(),
          metadata: {
            ...callMetadata,
            ...csvMetadata[phoneNumber],
            vapi_call_id: call.id
          }
        }
      })

      const { error } = await supabase
        .from('calls')
        .insert(callsToInsert)

      if (error) {
        console.error('Error storing bulk call data from CSV:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${validationResults.total} numbers (${validationResults.valid} valid, ${validationResults.invalid} invalid), initiated ${bulkCallResult.successCount} calls successfully, ${bulkCallResult.failureCount} failed`,
      result: bulkCallResult,
      validationResults: {
        total: validationResults.total,
        valid: validationResults.valid,
        invalid: validationResults.invalid,
        errors: validationResults.errors.slice(0, 10) // Only return first 10 errors to keep response size reasonable
      }
    })
  } catch (error) {
    console.error('Error processing CSV for bulk calls:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process CSV and initiate calls'
    }, { status: 500 })
  }
}
