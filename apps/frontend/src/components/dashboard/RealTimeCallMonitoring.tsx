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
  const [activeCalls, setActiveCalls] = useState(12)
  const [avgDuration, setAvgDuration] = useState('4:32')
  const [sentimentPositive, setSentimentPositive] = useState(65)
  const [sentimentNeutral, setSentimentNeutral] = useState(25)
  const [sentimentNegative, setSentimentNegative] = useState(10)
  
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly fluctuate active calls between 8 and 16
      setActiveCalls(Math.floor(Math.random() * 8) + 8)
      
      // Randomly fluctuate sentiment scores
      const positive = Math.floor(Math.random() * 20) + 55 // 55-75%
      const neutral = Math.floor(Math.random() * 15) + 15 // 15-30%
      const negative = 100 - positive - neutral
      
      setSentimentPositive(positive)
      setSentimentNeutral(neutral)
      setSentimentNegative(negative)
    }, 5000) // Update every 5 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Active Calls</h3>
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{activeCalls}</p>
            <p className="text-sm text-muted-foreground">Live Calls</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{avgDuration}</p>
            <p className="text-sm text-muted-foreground">Avg Duration</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">24</p>
            <p className="text-sm text-muted-foreground">Waiting</p>
          </div>
        </div>
        
        <h4 className="font-medium mb-2">Call Volume by Region</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Dubai</span>
            <span className="text-sm font-medium">42%</span>
          </div>
          <Progress value={42} className="h-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-sm">UK</span>
            <span className="text-sm font-medium">28%</span>
          </div>
          <Progress value={28} className="h-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Global</span>
            <span className="text-sm font-medium">30%</span>
          </div>
          <Progress value={30} className="h-2" />
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Call Sentiment Analysis</h3>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm">Positive</span>
            <span className="text-sm font-medium text-green-600">{sentimentPositive}%</span>
          </div>
          <Progress value={sentimentPositive} className="h-2 bg-gray-200">
            <div className="h-full bg-green-500 rounded-full" />
          </Progress>
          
          <div className="flex justify-between items-center mb-1 mt-2">
            <span className="text-sm">Neutral</span>
            <span className="text-sm font-medium text-blue-600">{sentimentNeutral}%</span>
          </div>
          <Progress value={sentimentNeutral} className="h-2 bg-gray-200">
            <div className="h-full bg-blue-500 rounded-full" />
          </Progress>
          
          <div className="flex justify-between items-center mb-1 mt-2">
            <span className="text-sm">Negative</span>
            <span className="text-sm font-medium text-red-600">{sentimentNegative}%</span>
          </div>
          <Progress value={sentimentNegative} className="h-2 bg-gray-200">
            <div className="h-full bg-red-500 rounded-full" />
          </Progress>
        </div>
        
        <h4 className="font-medium mb-3">Top Performing Agents</h4>
        <div className="space-y-1">
          <AgentPerformance name="Sarah Johnson" score={92} calls={28} conversionRate={38} />
          <AgentPerformance name="Michael Chen" score={88} calls={32} conversionRate={35} />
          <AgentPerformance name="Aisha Patel" score={85} calls={24} conversionRate={33} />
        </div>
      </Card>
    </div>
  )
}
