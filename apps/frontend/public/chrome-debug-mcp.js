/**
 * Chrome Console MCP Debug Tool - Browser Compatible Version
 * Captures browser console errors and feeds them to the AI for automatic fixing
 */

class ChromeDebugMCP {
  constructor() {
    this.errorLog = [];
    this.maxErrors = 50; // Keep last 50 errors
    this.setupConsoleCapture();
  }

  setupConsoleCapture() {
    // Override console methods to capture errors
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      this.captureError('ERROR', args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.captureError('WARN', args);
      originalWarn.apply(console, args);
    };

    console.log = (...args) => {
      // Only capture logs that look like errors
      const message = args.join(' ');
      if (this.isErrorLikeMessage(message)) {
        this.captureError('LOG', args);
      }
      originalLog.apply(console, args);
    };
  }

  captureError(level, args) {
    const timestamp = new Date().toISOString();
    const message = args.join(' ');
    
    const errorEntry = {
      timestamp,
      level,
      message,
      stack: this.getStackTrace(),
      url: window?.location?.href || 'unknown',
      userAgent: navigator?.userAgent || 'unknown'
    };

    this.errorLog.push(errorEntry);
    
    // Keep only the last maxErrors entries
    if (this.errorLog.length > this.maxErrors) {
      this.errorLog = this.errorLog.slice(-this.maxErrors);
    }
    
    this.saveToLocalStorage();
    this.sendToMCP(errorEntry);
  }

  isErrorLikeMessage(message) {
    const errorKeywords = [
      'error', 'failed', 'exception', 'undefined', 'null',
      'cannot', 'unable', 'invalid', 'missing', 'not found',
      '404', '500', 'timeout', 'rejected', 'denied'
    ];
    
    return errorKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  getStackTrace() {
    try {
      throw new Error();
    } catch (e) {
      return e.stack?.split('\n').slice(3, 8) || [];
    }
  }

  saveToLocalStorage() {
    try {
      const data = {
        lastUpdated: new Date().toISOString(),
        totalErrors: this.errorLog.length,
        errors: this.errorLog.slice(-this.maxErrors) // Keep last maxErrors errors
      };
      
      localStorage.setItem('chromeDebugMCP', JSON.stringify(data));
    } catch (e) {
      // Silent fail to avoid recursive errors
    }
  }

  async sendToMCP(errorEntry) {
    // This would integrate with your MCP setup
    try {
      const mcpPayload = {
        type: 'debug_error',
        timestamp: errorEntry.timestamp,
        data: {
          level: errorEntry.level,
          message: errorEntry.message,
          stack: errorEntry.stack,
          context: {
            url: errorEntry.url,
            userAgent: errorEntry.userAgent,
            appState: this.getAppState()
          }
        }
      };

      // Send to MCP server (you'd implement this based on your MCP setup)
      console.log('🐛 MCP Debug Data:', mcpPayload);
      
    } catch (e) {
      console.error('Failed to send to MCP:', e);
    }
  }

  getAppState() {
    // Capture current app state for context
    return {
      pathname: window?.location?.pathname,
      hash: window?.location?.hash,
      localStorage: this.safeGetLocalStorage(),
      sessionStorage: this.safeGetSessionStorage(),
      cookies: document?.cookie || '',
      timestamp: new Date().toISOString()
    };
  }

  safeGetLocalStorage() {
    try {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        storage[key] = localStorage.getItem(key);
      }
      return storage;
    } catch (e) {
      return {};
    }
  }

  safeGetSessionStorage() {
    try {
      const storage = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        storage[key] = sessionStorage.getItem(key);
      }
      return storage;
    } catch (e) {
      return {};
    }
  }

  // Method to get current error summary for MCP
  getErrorSummary() {
    const recent = this.errorLog.slice(-10);
    const errorCounts = {};
    
    recent.forEach(error => {
      const key = error.message.substring(0, 100);
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      recentErrors: recent.length,
      topErrors: Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([message, count]) => ({ message, count }))
    };
  }

  // Clear error log
  clearLog() {
    this.errorLog = [];
    this.saveToLocalStorage();
  }
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  window.chromeDebugMCP = new ChromeDebugMCP();
  console.log('🐛 Chrome Debug MCP initialized - Browser Compatible Version');
}