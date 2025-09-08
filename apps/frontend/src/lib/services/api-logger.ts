/**
 * API Logger Utility
 * 
 * This module provides utilities for logging API calls to external services.
 */

import { recordApiCall } from '@/components/debug/ApiMonitor'
import { vapiLogger, twilioLogger, supabaseLogger, calendarLogger, emailLogger } from '@/lib/services/logger'

type ApiService = 'VAPI' | 'Twilio' | 'Supabase' | 'Calendar' | 'Email' | 'Other'

interface LoggedFetchOptions extends RequestInit {
  service?: ApiService
  logRequest?: boolean
  logResponse?: boolean
}

/**
 * Enhanced fetch function with logging
 */
export async function loggedFetch(url: string, options: LoggedFetchOptions = {}) {
  const {
    service = detectService(url),
    logRequest = true,
    logResponse = true,
    ...fetchOptions
  } = options

  const logger = getLoggerForService(service)
  const method = fetchOptions.method || 'GET'
  const startTime = performance.now()
  
  // Log the request
  if (logRequest) {
    logger.info(`${method} request to ${url}`, {
      url,
      method,
      headers: fetchOptions.headers,
      body: fetchOptions.body
    })
  }
  
  try {
    // Make the actual fetch request
    const response = await fetch(url, fetchOptions)
    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)
    
    // Clone the response so we can read it multiple times
    const clonedResponse = response.clone()
    
    // Try to parse the response as JSON
    let responseData
    try {
      responseData = await clonedResponse.json()
    } catch (e) {
      // If it's not JSON, get the text
      responseData = await response.clone().text()
    }
    
    // Log the response
    if (logResponse) {
      logger.info(`${method} response from ${url}`, {
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        duration,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      })
    }
    
    // Record the API call for the monitor
    recordApiCall({
      service,
      method,
      url,
      status: response.status,
      duration,
      request: {
        headers: fetchOptions.headers,
        body: fetchOptions.body
      },
      response: responseData
    })
    
    return response
  } catch (error) {
    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)
    
    // Log the error
    logger.error(`${method} request to ${url} failed`, {
      url,
      method,
      duration,
      error
    })
    
    // Record the API call with error
    recordApiCall({
      service,
      method,
      url,
      status: 0,
      duration,
      request: {
        headers: fetchOptions.headers,
        body: fetchOptions.body
      },
      error
    })
    
    throw error
  }
}

/**
 * Detect the service based on the URL
 */
function detectService(url: string): ApiService {
  const lowerUrl = url.toLowerCase()
  
  if (lowerUrl.includes('vapi.ai') || lowerUrl.includes('vapi')) {
    return 'VAPI'
  }
  
  if (lowerUrl.includes('twilio') || lowerUrl.includes('sip.')) {
    return 'Twilio'
  }
  
  if (lowerUrl.includes('supabase') || lowerUrl.includes('database')) {
    return 'Supabase'
  }
  
  if (lowerUrl.includes('calendar') || lowerUrl.includes('googleapis.com/calendar')) {
    return 'Calendar'
  }
  
  if (lowerUrl.includes('mail') || lowerUrl.includes('smtp') || lowerUrl.includes('email')) {
    return 'Email'
  }
  
  return 'Other'
}

/**
 * Get the appropriate logger for a service
 */
function getLoggerForService(service: ApiService) {
  switch (service) {
    case 'VAPI':
      return vapiLogger
    case 'Twilio':
      return twilioLogger
    case 'Supabase':
      return supabaseLogger
    case 'Calendar':
      return calendarLogger
    case 'Email':
      return emailLogger
    default:
      return vapiLogger
  }
}

/**
 * Create a logged fetch function for a specific service
 */
export function createServiceFetch(service: ApiService) {
  return (url: string, options: Omit<LoggedFetchOptions, 'service'> = {}) => {
    return loggedFetch(url, { ...options, service })
  }
}

// Create service-specific fetch functions
export const vapiFetch = createServiceFetch('VAPI')
export const twilioFetch = createServiceFetch('Twilio')
export const supabaseFetch = createServiceFetch('Supabase')
export const calendarFetch = createServiceFetch('Calendar')
export const emailFetch = createServiceFetch('Email')
