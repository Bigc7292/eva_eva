'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bug,
  RefreshCw,
  Download,
  Terminal,
  AlertCircle,
  CheckCircle,
  Info,
  Code,
  Cpu
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  source: string;
  details?: string;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

interface EnhancedDebugPanelWidgetProps {
  logs?: LogEntry[];
  metrics?: SystemMetric[];
}

export function EnhancedDebugPanelWidget({
  logs = [],
  metrics = []
}: EnhancedDebugPanelWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('logs');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'debug'>('all');

  // Generate sample log entries
  const generateLogEntries = useCallback(() => {
    // Use provided logs if available
    const logsAvailable = Array.isArray(logs) && logs.length > 0;
    if (logsAvailable) {
      return [...logs]; // Return a copy to avoid reference issues
    }

    // Otherwise generate sample data
    const levels = ['error', 'warning', 'info', 'debug'];
    const sources = ['API', 'Database', 'Frontend', 'Authentication', 'Network'];
    const messages = [
      'Failed to connect to API endpoint',
      'Database query executed successfully',
      'User authentication successful',
      'Component mounted',
      'Network request timed out',
      'Invalid input detected',
      'Cache updated',
      'Session expired',
      'Data fetched successfully',
      'Configuration loaded'
    ];

    const data = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const time = new Date(now);
      time.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60)); // Random time in last hour

      const level = levels[Math.floor(Math.random() * levels.length)] as 'error' | 'warning' | 'info' | 'debug';
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];

      data.push({
        id: `log-${i}`,
        timestamp: time.toISOString(),
        level,
        message,
        source,
        details: level === 'error' ? 'Stack trace: Error at line 42 in component.tsx' : undefined
      });
    }

    // Sort by time (newest first)
    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []); // Empty dependency array - this function only needs to be created once

  // Generate sample system metrics
  const generateSystemMetrics = useCallback(() => {
    // Use provided metrics if available
    const metricsAvailable = Array.isArray(metrics) && metrics.length > 0;
    if (metricsAvailable) {
      return [...metrics]; // Return a copy to avoid reference issues
    }

    // Otherwise generate sample data
    return [
      {
        name: 'CPU Usage',
        value: Math.floor(Math.random() * 40) + 10,
        unit: '%',
        status: 'good'
      },
      {
        name: 'Memory Usage',
        value: Math.floor(Math.random() * 30) + 60,
        unit: '%',
        status: 'warning'
      },
      {
        name: 'API Response Time',
        value: Math.floor(Math.random() * 200) + 50,
        unit: 'ms',
        status: 'good'
      },
      {
        name: 'Database Connections',
        value: Math.floor(Math.random() * 5) + 3,
        unit: '',
        status: 'good'
      },
      {
        name: 'Error Rate',
        value: Math.floor(Math.random() * 5),
        unit: '%',
        status: 'good'
      },
      {
        name: 'Disk Space',
        value: Math.floor(Math.random() * 10) + 85,
        unit: '%',
        status: 'critical'
      }
    ];
  }, []); // Empty dependency array - this function only needs to be created once

  // Initialize data on component mount
  useEffect(() => {
    setLogEntries(generateLogEntries());
    setSystemMetrics(generateSystemMetrics());
  }, [generateLogEntries, generateSystemMetrics]);

  // Update data when props change
  useEffect(() => {
    if (Array.isArray(logs) && logs.length > 0) {
      setLogEntries([...logs]);
    }
  }, [logs]);

  useEffect(() => {
    if (Array.isArray(metrics) && metrics.length > 0) {
      setSystemMetrics([...metrics]);
    }
  }, [metrics]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLogEntries(generateLogEntries());
      setSystemMetrics(generateSystemMetrics());
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content based on active tab
    let csvContent = '';
    let filename = '';

    if (activeTab === 'logs') {
      const headers = ['Timestamp', 'Level', 'Source', 'Message', 'Details'];
      csvContent = [
        headers.join(','),
        ...filteredLogs.map(log =>
          [
            log.timestamp,
            log.level,
            log.source,
            `"${log.message.replace(/"/g, '""')}"`, // Escape quotes in CSV
            log.details ? `"${log.details.replace(/"/g, '""')}"` : ''
          ].join(',')
        )
      ].join('\n');
      filename = `debug_logs_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Metric', 'Value', 'Unit', 'Status'];
      csvContent = [
        headers.join(','),
        ...systemMetrics.map(metric =>
          [
            metric.name,
            metric.value,
            metric.unit,
            metric.status
          ].join(',')
        )
      ].join('\n');
      filename = `system_metrics_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logs based on selected filter
  const filteredLogs = logEntries.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  // Get log icon based on level
  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Code className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Format time relative to now
  const formatRelativeTime = (timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) {
      return 'Just now';
    }

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    if (diffMins < 24 * 60) {
      return `${Math.floor(diffMins / 60)}h ago`;
    }

    return `${Math.floor(diffMins / (60 * 24))}d ago`;
  };

  // Get status color for metrics
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-gray-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Debug Panel</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Button>
            <Bug className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" onValueChange={setActiveTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="logs" className="flex-1">
              <Terminal className="h-3.5 w-3.5 mr-1" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex-1">
              <Cpu className="h-3.5 w-3.5 mr-1" />
              System Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <div className="flex justify-between items-center mb-2">
              <div className="flex space-x-1">
                <Button
                  variant={filter === 'all' ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'error' ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilter('error')}
                >
                  Errors
                </Button>
                <Button
                  variant={filter === 'warning' ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilter('warning')}
                >
                  Warnings
                </Button>
                <Button
                  variant={filter === 'info' ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilter('info')}
                >
                  Info
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                {filteredLogs.length} entries
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No log entries found</p>
                <p className="text-xs text-muted-foreground">
                  {filter !== 'all' ? `No ${filter} level logs available` : 'No logs have been recorded'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {filteredLogs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getLogIcon(log.level)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">
                            {log.message}
                          </p>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {log.source}
                          </Badge>
                        </div>

                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {log.details}
                          </p>
                        )}

                        <div className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(log.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="metrics">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">
                  {systemMetrics.filter(m => m.status === 'critical').length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Critical alerts
                </div>
              </div>
              <div className="flex items-center text-slate-500">
                <Cpu className="h-4 w-4 mr-1" />
                <span className="font-medium">System health</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
              </div>
            ) : systemMetrics.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No system metrics available</p>
                <p className="text-xs text-muted-foreground">
                  Connect to system monitoring to see metrics
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {systemMetrics.map(metric => (
                  <div key={metric.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(metric.status)} mr-2`} />
                        <span className="text-sm font-medium">{metric.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {metric.value}{metric.unit}
                      </span>
                    </div>
                    <Progress
                      value={metric.name.includes('Usage') || metric.name.includes('Space') ? metric.value : (metric.value / 100) * 100}
                      className="h-1.5"
                      indicatorClassName={
                        metric.status === 'critical' ? "bg-red-500" :
                        metric.status === 'warning' ? "bg-yellow-500" :
                        "bg-green-500"
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
