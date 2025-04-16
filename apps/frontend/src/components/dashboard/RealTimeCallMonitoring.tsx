'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PhoneIcon } from '@/components/ui/icons'

interface AgentPerformanceProps {
  name: string
  score: number
  calls: number
  conversionRate: number
}

const AgentPerformance = ({ name, score, calls, conversionRate }: AgentPerformanceProps) => {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <PhoneIcon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{calls} calls today</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">{score}/100</p>
        <p className="text-xs text-muted-foreground">{conversionRate}% conversion</p>
      </div>
    </div>
  )
}

export function RealTimeCallMonitoring() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Active Calls</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center mb-4">
            Real-time call data will be displayed here when calls are active.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            No active calls at the moment. Start a call to see real-time metrics.
          </p>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Call Sentiment Analysis</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center mb-4">
            Call sentiment analysis will be displayed here when data is available.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Complete calls will be analyzed for sentiment and displayed in this panel.
          </p>
        </div>
      </Card>
    </div>
  )
}
