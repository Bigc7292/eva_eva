'use client'

// Define log levels
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

// Define log entry
interface LogEntry {
  level: LogLevel
  message: string
  details?: Record<string, unknown>
  timestamp?: string
}

// Client logger
export const clientLogger = {
  info: (message: string, details?: Record<string, unknown>) => {
    logToConsole('info', message, details)
    logToApi('info', message, details)
  },
  
  warn: (message: string, details?: Record<string, unknown>) => {
    logToConsole('warn', message, details)
    logToApi('warn', message, details)
  },
  
  error: (message: string, details?: Record<string, unknown>) => {
    logToConsole('error', message, details)
    logToApi('error', message, details)
  },
  
  debug: (message: string, details?: Record<string, unknown>) => {
    logToConsole('debug', message, details)
    logToApi('debug', message, details)
  }
}

// Log to console
function logToConsole(level: LogLevel, message: string, details?: Record<string, unknown>) {
  const formattedMessage = `[CLIENT-LOGGER][${level.toUpperCase()}] ${message}`
  
  switch (level) {
    case 'info':
      console.info(formattedMessage, details || '')
      break
    case 'warn':
      console.warn(formattedMessage, details || '')
      break
    case 'error':
      console.error(formattedMessage, details || '')
      break
    case 'debug':
      console.debug(formattedMessage, details || '')
      break
  }
}

// Log to API
async function logToApi(level: LogLevel, message: string, details?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  
  try {
    const logEntry: LogEntry = {
      level,
      message,
      details,
      timestamp: new Date().toISOString()
    }
    
    // Use fetch to send log to API
    fetch('/api/debug-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logEntry)
    }).catch(error => {
      console.error('Failed to send log to API:', error)
    })
  } catch (error) {
    console.error('Error in logToApi:', error)
  }
}
