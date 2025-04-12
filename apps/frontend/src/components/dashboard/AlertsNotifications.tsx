'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface Alert {
  id: number
  type: 'error' | 'warning' | 'success' | 'info'
  message: string
  time: string
}

export function AlertsNotifications() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'warning',
      message: 'Call volume dropped by 15% in the last hour',
      time: '10 minutes ago'
    },
    {
      id: 2,
      type: 'success',
      message: 'Monthly lead target reached (1,200/1,200)',
      time: '1 hour ago'
    },
    {
      id: 3,
      type: 'info',
      message: 'New agent "David Kim" added to the system',
      time: '2 hours ago'
    },
    {
      id: 4,
      type: 'error',
      message: 'Agent #3 experiencing technical issues',
      time: '3 hours ago'
    }
  ])
  
  // Simulate a new alert every 30 seconds
  useEffect(() => {
    const possibleAlerts = [
      {
        type: 'warning',
        message: 'Conversion rate below target for Dubai region'
      },
      {
        type: 'info',
        message: 'System maintenance scheduled for tonight'
      },
      {
        type: 'success',
        message: 'Agent Sarah achieved 95% satisfaction score today'
      },
      {
        type: 'error',
        message: 'Integration with CRM system temporarily down'
      }
    ]
    
    const interval = setInterval(() => {
      const randomAlert = possibleAlerts[Math.floor(Math.random() * possibleAlerts.length)]
      setAlerts(prev => [
        {
          id: Date.now(),
          type: randomAlert.type as 'error' | 'warning' | 'success' | 'info',
          message: randomAlert.message,
          time: 'Just now'
        },
        ...prev.slice(0, 4) // Keep only the 5 most recent alerts
      ])
    }, 30000) // Add a new alert every 30 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Alerts & Notifications</h3>
        <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
          {alerts.length} New
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`flex items-start gap-3 p-3 rounded-lg ${
              alert.type === 'error' ? 'bg-red-50' :
              alert.type === 'warning' ? 'bg-yellow-50' :
              alert.type === 'success' ? 'bg-green-50' :
              'bg-blue-50'
            }`}
          >
            {getAlertIcon(alert.type)}
            <div className="flex-1">
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="text-xs text-muted-foreground">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Goal Tracking</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Monthly Lead Target</span>
                <span className="text-sm font-medium">1,200/1,200</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Conversion Rate</span>
                <span className="text-sm font-medium">32.8%/35%</span>
              </div>
              <Progress value={(32.8/35) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Revenue Target</span>
                <span className="text-sm font-medium">$1.2M/$1.5M</span>
              </div>
              <Progress value={(1.2/1.5) * 100} className="h-2" />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">System Health</h4>
          <div className="bg-green-100 text-green-800 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">All Systems Operational</p>
              <p className="text-xs">Last checked: 2 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
