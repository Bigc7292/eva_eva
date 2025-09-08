/**
 * Enhanced Supabase Client with Logging
 * 
 * This module wraps the Supabase client with logging functionality
 * to track database operations for debugging purposes.
 */

import { supabase } from '@/lib/supabase'
import { supabaseLogger } from '@/lib/services/logger'
import { recordDatabaseOperation } from '@/components/debug/DatabaseMonitor'

// Create a proxy to intercept Supabase method calls
export const enhancedSupabase = new Proxy(supabase, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver)
    
    // If the property is a function, wrap it with logging
    if (typeof value === 'function') {
      return function(...args: any[]) {
        supabaseLogger.debug(`Calling Supabase method: ${String(prop)}`, args)
        return value.apply(this, args)
      }
    }
    
    // If the property is 'from', intercept it to track table operations
    if (prop === 'from') {
      return function(table: string) {
        const fromResult = value.call(target, table)
        
        // Create a proxy for the result of the 'from' method
        return new Proxy(fromResult, {
          get(fromTarget, fromProp, fromReceiver) {
            const fromValue = Reflect.get(fromTarget, fromProp, fromReceiver)
            
            // If the property is a function (like select, insert, update, etc.), wrap it
            if (typeof fromValue === 'function') {
              return function(...fromArgs: any[]) {
                const operation = String(fromProp).toUpperCase()
                const startTime = performance.now()
                
                supabaseLogger.info(`${operation} operation on table: ${table}`, { args: fromArgs })
                
                const result = fromValue.apply(this, fromArgs)
                
                // If the result is a Promise, intercept it to log the result
                if (result && typeof result.then === 'function') {
                  return result.then((data: any) => {
                    const endTime = performance.now()
                    const duration = Math.round(endTime - startTime)
                    
                    // Record the database operation for the monitor
                    recordDatabaseOperation({
                      table,
                      operation: operation as any,
                      duration,
                      query: { args: fromArgs },
                      result: data,
                      rowCount: data?.data?.length || 0
                    })
                    
                    if (data.error) {
                      supabaseLogger.error(`Error in ${operation} operation on table: ${table}`, data.error)
                    } else {
                      supabaseLogger.info(`Completed ${operation} operation on table: ${table}`, {
                        duration,
                        rowCount: data?.data?.length || 0
                      })
                    }
                    
                    return data
                  }).catch((error: any) => {
                    const endTime = performance.now()
                    const duration = Math.round(endTime - startTime)
                    
                    // Record the database operation with error
                    recordDatabaseOperation({
                      table,
                      operation: operation as any,
                      duration,
                      query: { args: fromArgs },
                      error
                    })
                    
                    supabaseLogger.error(`Error in ${operation} operation on table: ${table}`, error)
                    throw error
                  })
                }
                
                return result
              }
            }
            
            return fromValue
          }
        })
      }
    }
    
    return value
  }
})

export default enhancedSupabase
