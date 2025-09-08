# 🐛 MCP Debug Tools Setup

This directory now contains powerful debugging tools that integrate with MCP to automatically monitor and fix your EVA app.

## 🛠️ Tools Created:

### 1. **Chrome Console MCP Debug Tool** (`chrome-debug-mcp.js`)
- **Purpose**: Captures browser console errors automatically
- **Integration**: Add to your frontend to feed errors to AI
- **Features**:
  - Real-time error capture
  - Stack trace analysis
  - App state context
  - Automatic MCP integration

### 2. **Playwright Health Check** (`playwright-health-check.js`)
- **Purpose**: Monitors app health with smart diagnostics
- **Features**:
  - Periodic health checks
  - Performance monitoring
  - Issue categorization
  - Fix recommendations

### 3. **Playwright MCP Monitor** (`playwright-mcp-monitor.js`)
- **Purpose**: Real-time monitoring using Playwright MCP
- **Features**:
  - Live app inspection
  - Network request monitoring
  - Console error tracking
  - Automatic fix suggestions

## 🚀 Quick Start:

### Method 1: Chrome Console Integration
Add to your frontend `layout.tsx` or main component:
```javascript
// Add to apps/frontend/src/app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script src="/chrome-debug-mcp.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
```

### Method 2: Start Playwright Monitoring
```bash
# Start continuous monitoring
node playwright-mcp-monitor.js start

# Single health check
node playwright-mcp-monitor.js check
```

### Method 3: Basic Health Check
```bash
# Start monitoring
node playwright-health-check.js start

# Check health summary
node playwright-health-check.js summary
```

## 🎯 How It Works:

1. **Error Detection**: Tools monitor your app at `localhost:3004`
2. **Issue Analysis**: AI categorizes problems (API, database, JavaScript, etc.)
3. **Fix Recommendations**: Provides specific commands to resolve issues
4. **MCP Integration**: Feeds data to AI for automatic problem solving

## 📊 Output Examples:

### Health Check Results:
```json
{
  "timestamp": "2025-09-04T...",
  "status": "unhealthy", 
  "issues": [
    {
      "severity": "error",
      "category": "api",
      "message": "API request failed: /api/calls (500)"
    }
  ]
}
```

### Fix Recommendations:
```
🔧 RECOMMENDED FIXES:

1. [HIGH] API endpoints are failing
   Issue: Failed to fetch /api/calls: 500 Internal Server Error
   Commands to try:
     > node test-supabase-connection.js
     > curl -I http://localhost:3004/api/health
     > cd apps/backend && npm start
```

## 🔗 MCP Integration:

The tools create files that MCP can read:
- `debug-log.json` - Console errors
- `health-check-log.json` - Health reports  
- `mcp-fix-recommendations.json` - AI analysis queue

## 🎮 Usage Scenarios:

### Scenario 1: App Won't Start
```bash
node playwright-mcp-monitor.js check
# Output: "App is not accessible - ECONNREFUSED"
# Fix: Run `npm run dev` or `cd apps/frontend && npm start`
```

### Scenario 2: API Errors
```bash
node playwright-mcp-monitor.js start
# Detects: "Failed to fetch /api/calls: 500"
# Recommends: Check Supabase connection, verify environment variables
```

### Scenario 3: Performance Issues
```bash
node playwright-health-check.js summary
# Shows: "Slow load time: 5000ms" 
# Suggests: Optimize build, check for memory leaks
```

## 🔧 Next Steps:

1. **Copy `chrome-debug-mcp.js` to your frontend public folder**
2. **Start monitoring**: `node playwright-mcp-monitor.js start`
3. **Run your app**: `npm run dev`
4. **Watch the magic**: Tools will automatically detect and suggest fixes

## 🎯 Benefits:

- ✅ **Real-time debugging** - Catch issues as they happen
- ✅ **Smart diagnostics** - AI categorizes and prioritizes problems  
- ✅ **Actionable fixes** - Specific commands to resolve issues
- ✅ **Zero configuration** - Works out of the box
- ✅ **MCP ready** - Integrates with your existing MCP setup

Now when you run your app and encounter issues, these tools will automatically capture the problems and provide AI-powered solutions! 🚀