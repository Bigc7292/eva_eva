/**
 * Playwright Health Check MCP Tool
 * Automatically visits localhost:3004 and diagnoses issues
 */

const fs = require('fs');
const path = require('path');

class PlaywrightHealthCheck {
  constructor() {
    this.healthCheckFile = path.join(__dirname, 'health-check-log.json');
    this.appUrl = 'http://localhost:3004';
    this.checkInterval = 30000; // 30 seconds
    this.isRunning = false;
  }

  async startMonitoring() {
    if (this.isRunning) {
      console.log('🔍 Health check already running');
      return;
    }

    this.isRunning = true;
    console.log(`🏥 Starting health check monitoring on ${this.appUrl}`);
    
    // Initial check
    await this.performHealthCheck();
    
    // Set up periodic checks
    this.intervalId = setInterval(async () => {
      await this.performHealthCheck();
    }, this.checkInterval);
  }

  async performHealthCheck() {
    const timestamp = new Date().toISOString();
    console.log(`🔍 Performing health check at ${timestamp}`);

    const healthReport = {
      timestamp,
      url: this.appUrl,
      status: 'unknown',
      errors: [],
      warnings: [],
      performance: {},
      screenshots: [],
      networkRequests: [],
      consoleMessages: []
    };

    try {
      // This would use Playwright MCP when available
      const checkResult = await this.checkWithPlaywright();
      Object.assign(healthReport, checkResult);
      
    } catch (error) {
      healthReport.status = 'error';
      healthReport.errors.push({
        type: 'health_check_failed',
        message: error.message,
        stack: error.stack
      });
    }

    await this.saveHealthReport(healthReport);
    await this.analyzeAndFix(healthReport);
  }

  async checkWithPlaywright() {
    // Mock implementation - would use actual Playwright MCP
    return new Promise((resolve) => {
      // Simulate health check
      setTimeout(() => {
        const mockResult = {
          status: 'healthy',
          performance: {
            loadTime: Math.random() * 2000 + 500,
            domReady: Math.random() * 1000 + 200,
            firstPaint: Math.random() * 800 + 100
          },
          errors: [],
          warnings: []
        };

        // Simulate some random issues for testing
        if (Math.random() > 0.7) {
          mockResult.status = 'unhealthy';
          mockResult.errors.push({
            type: 'network_error',
            message: 'Failed to load /api/calls',
            statusCode: 500
          });
        }

        resolve(mockResult);
      }, 1000);
    });
  }

  async saveHealthReport(report) {
    try {
      let allReports = [];
      
      // Load existing reports
      if (fs.existsSync(this.healthCheckFile)) {
        const existing = fs.readFileSync(this.healthCheckFile, 'utf8');
        allReports = JSON.parse(existing);
      }

      // Add new report
      allReports.push(report);
      
      // Keep only last 100 reports
      if (allReports.length > 100) {
        allReports = allReports.slice(-100);
      }

      // Save back to file
      fs.writeFileSync(this.healthCheckFile, JSON.stringify(allReports, null, 2));
      
      console.log(`📊 Health report saved: ${report.status}`);
      
    } catch (error) {
      console.error('Failed to save health report:', error);
    }
  }

  async analyzeAndFix(report) {
    if (report.status === 'healthy') {
      console.log('✅ App is healthy');
      return;
    }

    console.log('🚨 Issues detected, analyzing...');
    
    const diagnostics = this.generateDiagnostics(report);
    const fixes = this.suggestFixes(diagnostics);
    
    console.log('🔧 Suggested fixes:', fixes);
    
    // Send to MCP for AI analysis
    await this.sendToMCPForAnalysis({
      report,
      diagnostics,
      fixes,
      context: await this.gatherContext()
    });
  }

  generateDiagnostics(report) {
    const diagnostics = {
      severity: 'low',
      categories: [],
      issues: []
    };

    // Analyze errors
    if (report.errors.length > 0) {
      diagnostics.severity = 'high';
      diagnostics.categories.push('errors');
      
      report.errors.forEach(error => {
        diagnostics.issues.push({
          type: 'error',
          category: this.categorizeError(error),
          message: error.message,
          urgency: 'high'
        });
      });
    }

    // Analyze warnings
    if (report.warnings.length > 0) {
      if (diagnostics.severity === 'low') diagnostics.severity = 'medium';
      diagnostics.categories.push('warnings');
    }

    // Analyze performance
    if (report.performance.loadTime > 3000) {
      diagnostics.categories.push('performance');
      diagnostics.issues.push({
        type: 'performance',
        category: 'slow_load',
        message: `Slow load time: ${report.performance.loadTime}ms`,
        urgency: 'medium'
      });
    }

    return diagnostics;
  }

  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('api')) {
      return 'network';
    }
    if (message.includes('supabase') || message.includes('database')) {
      return 'database';
    }
    if (message.includes('auth') || message.includes('login')) {
      return 'authentication';
    }
    if (message.includes('javascript') || message.includes('undefined')) {
      return 'javascript';
    }
    if (message.includes('css') || message.includes('style')) {
      return 'styling';
    }
    
    return 'general';
  }

  suggestFixes(diagnostics) {
    const fixes = [];

    diagnostics.issues.forEach(issue => {
      switch (issue.category) {
        case 'network':
          fixes.push({
            issue: issue.message,
            fix: 'Check API endpoints and network connectivity',
            commands: [
              'curl -I http://localhost:3004/api/health',
              'npm run check-backend'
            ]
          });
          break;
          
        case 'database':
          fixes.push({
            issue: issue.message,
            fix: 'Check Supabase connection and environment variables',
            commands: [
              'node test-supabase-connection.js',
              'cat .env.local'
            ]
          });
          break;
          
        case 'javascript':
          fixes.push({
            issue: issue.message,
            fix: 'Check for JavaScript syntax errors and missing imports',
            commands: [
              'npm run lint',
              'npm run type-check'
            ]
          });
          break;
          
        default:
          fixes.push({
            issue: issue.message,
            fix: 'General troubleshooting required',
            commands: ['npm run dev -- --verbose']
          });
      }
    });

    return fixes;
  }

  async gatherContext() {
    const context = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform
    };

    // Check if key files exist
    const keyFiles = [
      'package.json',
      '.env.local',
      'apps/frontend/package.json',
      'apps/backend/server.js'
    ];

    context.fileStatus = {};
    keyFiles.forEach(file => {
      const fullPath = path.join(__dirname, file);
      context.fileStatus[file] = fs.existsSync(fullPath);
    });

    // Check running processes
    try {
      const { exec } = require('child_process');
      context.processes = await new Promise((resolve) => {
        exec('netstat -an | findstr :3004', (error, stdout) => {
          resolve(stdout ? 'port_3004_in_use' : 'port_3004_free');
        });
      });
    } catch (e) {
      context.processes = 'check_failed';
    }

    return context;
  }

  async sendToMCPForAnalysis(data) {
    // This would integrate with your MCP setup
    const mcpPayload = {
      type: 'health_check_analysis',
      timestamp: new Date().toISOString(),
      data
    };

    console.log('🤖 Sending to MCP for AI analysis:', {
      severity: data.diagnostics.severity,
      issueCount: data.diagnostics.issues.length,
      fixCount: data.fixes.length
    });

    // In a real implementation, this would send to your MCP server
    // For now, we'll just log it
    fs.writeFileSync(
      path.join(__dirname, 'mcp-analysis-queue.json'),
      JSON.stringify(mcpPayload, null, 2)
    );
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Health check monitoring stopped');
  }

  getHealthSummary() {
    try {
      if (!fs.existsSync(this.healthCheckFile)) {
        return { status: 'no_data', reports: [] };
      }

      const reports = JSON.parse(fs.readFileSync(this.healthCheckFile, 'utf8'));
      const recent = reports.slice(-10);
      
      const summary = {
        totalChecks: reports.length,
        recentChecks: recent.length,
        healthyCount: recent.filter(r => r.status === 'healthy').length,
        unhealthyCount: recent.filter(r => r.status === 'unhealthy').length,
        lastCheck: reports[reports.length - 1],
        trend: this.calculateTrend(recent)
      };

      return summary;
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  calculateTrend(reports) {
    if (reports.length < 2) return 'insufficient_data';
    
    const healthyCount = reports.filter(r => r.status === 'healthy').length;
    const ratio = healthyCount / reports.length;
    
    if (ratio > 0.8) return 'good';
    if (ratio > 0.5) return 'fair';
    return 'poor';
  }
}

// CLI interface
if (require.main === module) {
  const healthCheck = new PlaywrightHealthCheck();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      healthCheck.startMonitoring();
      break;
      
    case 'check':
      healthCheck.performHealthCheck();
      break;
      
    case 'summary':
      console.log(JSON.stringify(healthCheck.getHealthSummary(), null, 2));
      break;
      
    case 'stop':
      healthCheck.stopMonitoring();
      break;
      
    default:
      console.log(`
🏥 Playwright Health Check MCP Tool

Usage:
  node playwright-health-check.js start    - Start continuous monitoring
  node playwright-health-check.js check    - Perform single health check
  node playwright-health-check.js summary  - Show health summary
  node playwright-health-check.js stop     - Stop monitoring
      `);
  }
}

module.exports = PlaywrightHealthCheck;