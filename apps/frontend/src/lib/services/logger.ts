/**
 * Centralized Logging Service
 *
 * This service provides a unified way to log messages across the application.
 * It supports different log levels, structured logging, and can be configured
 * to output logs to different destinations (console, storage, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module: string;
  data?: any;
}

interface LogStorage {
  debug: LogEntry[];
  info: LogEntry[];
  warn: LogEntry[];
  error: LogEntry[];
  all: LogEntry[];
}

// In-memory storage for logs
const logStorage: LogStorage = {
  debug: [],
  info: [],
  warn: [],
  error: [],
  all: []
};

// Maximum number of logs to keep in memory
const MAX_LOGS = 1000;

// Subscribers to log events
type LogSubscriber = (entry: LogEntry) => void;
const subscribers: LogSubscriber[] = [];

/**
 * Logger service for application-wide logging
 */
export const logger = {
  /**
   * Log a debug message
   */
  debug: (message: string, module: string, data?: any) => {
    const entry = createLogEntry('debug', message, module, data);
    storeLog(entry);
    console.debug(`[${module}] ${message}`, data || '');
    notifySubscribers(entry);
    return entry;
  },

  /**
   * Log an info message
   */
  info: (message: string, module: string, data?: any) => {
    const entry = createLogEntry('info', message, module, data);
    storeLog(entry);
    console.info(`[${module}] ${message}`, data || '');
    notifySubscribers(entry);
    return entry;
  },

  /**
   * Log a warning message
   */
  warn: (message: string, module: string, data?: any) => {
    const entry = createLogEntry('warn', message, module, data);
    storeLog(entry);
    console.warn(`[${module}] ${message}`, data || '');
    notifySubscribers(entry);
    return entry;
  },

  /**
   * Log an error message
   */
  error: (message: string, module: string, data?: any) => {
    const entry = createLogEntry('error', message, module, data);
    storeLog(entry);
    console.error(`[${module}] ${message}`, data || '');
    notifySubscribers(entry);
    return entry;
  },

  /**
   * Get all logs
   */
  getLogs: (level?: LogLevel) => {
    if (level) {
      return [...logStorage[level]];
    }
    return [...logStorage.all];
  },

  /**
   * Clear all logs
   */
  clearLogs: () => {
    logStorage.debug = [];
    logStorage.info = [];
    logStorage.warn = [];
    logStorage.error = [];
    logStorage.all = [];
  },

  /**
   * Subscribe to log events
   */
  subscribe: (callback: LogSubscriber) => {
    subscribers.push(callback);
    return () => {
      const index = subscribers.indexOf(callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  },

  /**
   * Create a logger instance for a specific module
   */
  createLogger: (module: string) => {
    return {
      debug: (message: string, data?: any) => logger.debug(message, module, data),
      info: (message: string, data?: any) => logger.info(message, module, data),
      warn: (message: string, data?: any) => logger.warn(message, module, data),
      error: (message: string, data?: any) => logger.error(message, module, data)
    };
  },

  /**
   * Export logs as JSON
   */
  exportLogs: () => {
    return JSON.stringify(logStorage.all, null, 2);
  },

  /**
   * Save logs to local storage
   */
  saveLogs: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_logs', JSON.stringify(logStorage.all));
        return true;
      } catch (error) {
        console.error('Failed to save logs to local storage:', error);
        return false;
      }
    }
    return false;
  }
};

/**
 * Create a log entry
 */
function createLogEntry(level: LogLevel, message: string, module: string, data?: any): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    module,
    data
  };
}

/**
 * Store a log entry
 */
function storeLog(entry: LogEntry) {
  // Add to specific level array
  logStorage[entry.level].push(entry);
  if (logStorage[entry.level].length > MAX_LOGS) {
    logStorage[entry.level].shift();
  }

  // Add to all logs array
  logStorage.all.push(entry);
  if (logStorage.all.length > MAX_LOGS * 4) {
    logStorage.all.shift();
  }
}

/**
 * Notify subscribers of a new log entry
 */
function notifySubscribers(entry: LogEntry) {
  subscribers.forEach(subscriber => {
    try {
      subscriber(entry);
    } catch (error) {
      console.error('Error in log subscriber:', error);
    }
  });
}

// Create module-specific loggers for common services
export const vapiLogger = logger.createLogger('VAPI');
export const twilioLogger = logger.createLogger('Twilio');
export const supabaseLogger = logger.createLogger('Supabase');
export const calendarLogger = logger.createLogger('Calendar');
export const emailLogger = logger.createLogger('Email');
