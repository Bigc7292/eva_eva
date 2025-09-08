/**
 * Webhook Logger Utility
 * 
 * This module provides utilities for logging and monitoring webhook events.
 */

import { recordWebhookEvent } from '@/components/debug/WebhookMonitor'
import { vapiLogger, twilioLogger, supabaseLogger, calendarLogger, emailLogger } from '@/lib/services/logger'

type WebhookService = 'VAPI' | 'Twilio' | 'Supabase' | 'Calendar' | 'Email' | 'Other'

/**
 * Log a webhook event
 */
export function logWebhookEvent(
  service: WebhookService,
  eventType: string,
  payload: any,
  processed: boolean = false,
  processingResult?: any,
  error?: any
) {
  const logger = getLoggerForService(service)
  
  if (error) {
    logger.error(`Error processing ${service} webhook: ${eventType}`, {
      eventType,
      payload,
      error
    })
  } else if (processed) {
    logger.info(`Processed ${service} webhook: ${eventType}`, {
      eventType,
      payload,
      processingResult
    })
  } else {
    logger.info(`Received ${service} webhook: ${eventType}`, {
      eventType,
      payload
    })
  }
  
  // Record the webhook event for the monitor
  recordWebhookEvent({
    service,
    eventType,
    payload,
    processed,
    processingResult,
    error
  })
}

/**
 * Create a webhook handler with logging
 */
export function createWebhookHandler(
  service: WebhookService,
  handler: (eventType: string, payload: any) => Promise<any>
) {
  return async (eventType: string, payload: any) => {
    // Log the received webhook
    logWebhookEvent(service, eventType, payload)
    
    try {
      // Process the webhook
      const result = await handler(eventType, payload)
      
      // Log the successful processing
      logWebhookEvent(service, eventType, payload, true, result)
      
      return result
    } catch (error) {
      // Log the error
      logWebhookEvent(service, eventType, payload, false, undefined, error)
      
      throw error
    }
  }
}

/**
 * Get the appropriate logger for a service
 */
function getLoggerForService(service: WebhookService) {
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

// Create service-specific webhook handlers
export const vapiWebhookHandler = (handler: (eventType: string, payload: any) => Promise<any>) => 
  createWebhookHandler('VAPI', handler)

export const twilioWebhookHandler = (handler: (eventType: string, payload: any) => Promise<any>) => 
  createWebhookHandler('Twilio', handler)

export const supabaseWebhookHandler = (handler: (eventType: string, payload: any) => Promise<any>) => 
  createWebhookHandler('Supabase', handler)

export const calendarWebhookHandler = (handler: (eventType: string, payload: any) => Promise<any>) => 
  createWebhookHandler('Calendar', handler)

export const emailWebhookHandler = (handler: (eventType: string, payload: any) => Promise<any>) => 
  createWebhookHandler('Email', handler)
