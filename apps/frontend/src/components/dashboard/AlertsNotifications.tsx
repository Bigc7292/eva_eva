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
  const [alerts, setAlerts] = useState<Alert[]>([])

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
          0 New
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-muted-foreground text-center mb-4">
          System alerts and notifications will appear here when available.
        </p>
        <p className="text-sm text-muted-foreground text-center">
          No new alerts at this time.
        </p>
      </div>
    </Card>
  )
}
