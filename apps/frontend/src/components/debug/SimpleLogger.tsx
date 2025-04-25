'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { logger, LogEntry } from '@/lib/services/logger'
import { X, Download, RefreshCw, AlertCircle, Info, Bug } from 'lucide-react'

interface SimpleLoggerProps {
  maxLogs?: number;
  autoScroll?: boolean;
  showTimestamps?: boolean;
  showLevels?: boolean;
  showModules?: boolean;
  defaultExpanded?: boolean;
  title?: string;
  height?: string;
}

export function SimpleLogger({
  maxLogs = 100,
  autoScroll = true,
  showTimestamps = true,
  showLevels = true,
  showModules = true,
  defaultExpanded = false,
  title = 'Application Logs',
  height = '300px'
}: SimpleLoggerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Get initial logs
    setLogs(logger.getLogs().slice(-maxLogs));

    // Subscribe to new logs
    const unsubscribe = logger.subscribe((entry) => {
      setLogs(prevLogs => {
        const newLogs = [...prevLogs, entry];
        // Keep only the most recent logs up to maxLogs
        return newLogs.slice(-maxLogs);
      });
    });

    // Log component mount
    logger.info('SimpleLogger component mounted', 'SimpleLogger');

    return () => {
      unsubscribe();
      logger.info('SimpleLogger component unmounted', 'SimpleLogger');
    };
  }, [maxLogs]);

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    logger.info('Logs cleared by user', 'SimpleLogger');
  };

  const handleExportLogs = () => {
    const logsJson = logger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logger.info('Logs exported by user', 'SimpleLogger');
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getLogClass = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500 border-l-red-500';
      case 'warn':
        return 'text-yellow-500 border-l-yellow-500';
      case 'info':
        return 'text-blue-500 border-l-blue-500';
      case 'debug':
        return 'text-gray-500 border-l-gray-500';
      default:
        return '';
    }
  };

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setExpanded(true)} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Bug className="h-4 w-4" />
          Show Logs
          {logs.filter(log => log.level === 'error').length > 0 && (
            <Badge variant="destructive" className="ml-1">
              {logs.filter(log => log.level === 'error').length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex">
              <Button
                variant={filter === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('all')}
                className="h-8 rounded-r-none"
              >
                All
              </Button>
              <Button
                variant={filter === 'error' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('error')}
                className="h-8 rounded-none border-l-0"
              >
                Errors
              </Button>
              <Button
                variant={filter === 'warn' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('warn')}
                className="h-8 rounded-none border-l-0"
              >
                Warnings
              </Button>
              <Button
                variant={filter === 'info' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('info')}
                className="h-8 rounded-none border-l-0"
              >
                Info
              </Button>
              <Button
                variant={filter === 'debug' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('debug')}
                className="h-8 rounded-l-none border-l-0"
              >
                Debug
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearLogs}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExportLogs}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setExpanded(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={`h-[${height}]`} scrollToBottom={autoScroll}>
          <div className="space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No logs to display
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className={`text-xs p-1 border-l-2 ${getLogClass(log.level)}`}
                >
                  <div className="flex items-start">
                    <div className="mr-1">
                      {getLogIcon(log.level)}
                    </div>
                    <div className="flex-1">
                      {showTimestamps && (
                        <span className="text-muted-foreground mr-2">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                      {showLevels && (
                        <span className={`font-medium mr-2 ${getLogClass(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      )}
                      {showModules && (
                        <span className="bg-muted text-muted-foreground px-1 rounded mr-2">
                          {log.module}
                        </span>
                      )}
                      <span>{log.message}</span>
                    </div>
                  </div>
                  {log.data && (
                    <div className="ml-5 mt-1 p-1 bg-muted rounded text-muted-foreground">
                      {typeof log.data === 'object' 
                        ? JSON.stringify(log.data, null, 2) 
                        : String(log.data)
                      }
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
