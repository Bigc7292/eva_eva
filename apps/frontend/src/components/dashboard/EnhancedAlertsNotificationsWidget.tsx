import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Filter,
  Clock,
  X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  time: string;
  read: boolean;
  source?: string;
}

interface EnhancedAlertsNotificationsWidgetProps {
  alerts?: Alert[];
}

export function EnhancedAlertsNotificationsWidget({ 
  alerts = []
}: EnhancedAlertsNotificationsWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [alertsData, setAlertsData] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Generate sample alerts data
  const generateAlertsData = useCallback(() => {
    if (alerts && alerts.length > 0) {
      return alerts;
    }
    
    const types = ['error', 'warning', 'success', 'info'];
    const sources = ['System', 'API', 'Database', 'User', 'Network'];
    const messages = [
      'New lead created successfully',
      'Failed to connect to API endpoint',
      'Database backup completed',
      'User login attempt failed',
      'Call recording saved successfully',
      'Low disk space warning',
      'New version available',
      'Scheduled maintenance upcoming',
      'API rate limit reached',
      'New user registered'
    ];
    
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 15; i++) {
      const time = new Date(now);
      time.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60 * 24)); // Random time in last 24 hours
      
      const type = types[Math.floor(Math.random() * types.length)] as 'error' | 'warning' | 'success' | 'info';
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      data.push({
        id: `alert-${i}`,
        type,
        message,
        time: time.toISOString(),
        read: Math.random() > 0.3, // 30% chance of being unread
        source
      });
    }
    
    // Sort by time (newest first)
    return data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [alerts]);

  useEffect(() => {
    // Generate data on component mount
    setAlertsData(generateAlertsData());
  }, [generateAlertsData]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAlertsData(generateAlertsData());
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['ID', 'Type', 'Message', 'Time', 'Read', 'Source'];
    const csvContent = [
      headers.join(','),
      ...alertsData.map(alert => 
        [
          alert.id,
          alert.type,
          `"${alert.message.replace(/"/g, '""')}"`, // Escape quotes in CSV
          alert.time,
          alert.read ? 'Yes' : 'No',
          alert.source || 'Unknown'
        ].join(',')
      )
    ].join('\n');
    
    const filename = `alerts_notifications_${new Date().toISOString().split('T')[0]}.csv`;
    
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

  const handleMarkAsRead = (id: string) => {
    setAlertsData(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setAlertsData(prevAlerts => 
      prevAlerts.map(alert => ({ ...alert, read: true }))
    );
  };

  const handleDismiss = (id: string) => {
    setAlertsData(prevAlerts => 
      prevAlerts.filter(alert => alert.id !== id)
    );
  };

  // Filter alerts based on active tab and read/unread filter
  const filteredAlerts = alertsData.filter(alert => {
    if (activeTab !== 'all' && alert.type !== activeTab) {
      return false;
    }
    
    if (filter === 'unread' && alert.read) {
      return false;
    }
    
    return true;
  });

  // Count unread alerts
  const unreadCount = alertsData.filter(alert => !alert.read).length;

  // Get alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5" />;
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
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 24 * 60) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return `${Math.floor(diffMins / (60 * 24))}d ago`;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950 dark:to-indigo-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Alerts & Notifications</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-purple-600 dark:text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </Button>
            <div className="relative">
              <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-2">
            <TabsList>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="error" className="text-xs">Errors</TabsTrigger>
              <TabsTrigger value="warning" className="text-xs">Warnings</TabsTrigger>
              <TabsTrigger value="success" className="text-xs">Success</TabsTrigger>
              <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
              >
                <Filter className="h-3 w-3 mr-1" />
                {filter === 'all' ? 'All' : 'Unread'}
              </Button>
              
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
          
          <TabsContent value="all" className="mt-0">
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No alerts available</p>
                <p className="text-xs text-muted-foreground">
                  {filter === 'unread' ? 'All notifications have been read' : 'You have no notifications'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {filteredAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`flex items-start gap-3 p-2 rounded-lg ${
                        alert.read ? 'bg-transparent' : 'bg-purple-100/50 dark:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium ${!alert.read ? 'font-semibold' : ''}`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-1 ml-2">
                            {!alert.read && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={() => handleMarkAsRead(alert.id)}
                              >
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5" 
                              onClick={() => handleDismiss(alert.id)}
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatRelativeTime(alert.time)}</span>
                          {alert.source && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{alert.source}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="error" className="mt-0">
            {/* Same content structure as "all" tab but filtered for errors */}
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No error alerts</p>
                <p className="text-xs text-muted-foreground">
                  {filter === 'unread' ? 'All error notifications have been read' : 'You have no error notifications'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {filteredAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`flex items-start gap-3 p-2 rounded-lg ${
                        alert.read ? 'bg-transparent' : 'bg-purple-100/50 dark:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium ${!alert.read ? 'font-semibold' : ''}`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-1 ml-2">
                            {!alert.read && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={() => handleMarkAsRead(alert.id)}
                              >
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5" 
                              onClick={() => handleDismiss(alert.id)}
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatRelativeTime(alert.time)}</span>
                          {alert.source && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{alert.source}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          {/* Similar content for warning, success, and info tabs */}
          <TabsContent value="warning" className="mt-0">
            {/* Same structure as above */}
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No warning alerts</p>
                <p className="text-xs text-muted-foreground">
                  {filter === 'unread' ? 'All warning notifications have been read' : 'You have no warning notifications'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {filteredAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`flex items-start gap-3 p-2 rounded-lg ${
                        alert.read ? 'bg-transparent' : 'bg-purple-100/50 dark:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium ${!alert.read ? 'font-semibold' : ''}`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-1 ml-2">
                            {!alert.read && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={() => handleMarkAsRead(alert.id)}
                              >
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5" 
                              onClick={() => handleDismiss(alert.id)}
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatRelativeTime(alert.time)}</span>
                          {alert.source && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{alert.source}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="success" className="mt-0">
            {/* Same structure as above */}
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No success alerts</p>
                <p className="text-xs text-muted-foreground">
                  {filter === 'unread' ? 'All success notifications have been read' : 'You have no success notifications'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {filteredAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`flex items-start gap-3 p-2 rounded-lg ${
                        alert.read ? 'bg-transparent' : 'bg-purple-100/50 dark:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium ${!alert.read ? 'font-semibold' : ''}`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-1 ml-2">
                            {!alert.read && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={() => handleMarkAsRead(alert.id)}
                              >
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5" 
                              onClick={() => handleDismiss(alert.id)}
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatRelativeTime(alert.time)}</span>
                          {alert.source && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{alert.source}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="info" className="mt-0">
            {/* Same structure as above */}
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No info alerts</p>
                <p className="text-xs text-muted-foreground">
                  {filter === 'unread' ? 'All info notifications have been read' : 'You have no info notifications'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {filteredAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`flex items-start gap-3 p-2 rounded-lg ${
                        alert.read ? 'bg-transparent' : 'bg-purple-100/50 dark:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium ${!alert.read ? 'font-semibold' : ''}`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-1 ml-2">
                            {!alert.read && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={() => handleMarkAsRead(alert.id)}
                              >
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5" 
                              onClick={() => handleDismiss(alert.id)}
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatRelativeTime(alert.time)}</span>
                          {alert.source && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{alert.source}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
