'use client'

import { Card } from '@/components/ui/card'
import { ArrowDown, ArrowUp, DollarSign, Target, Users } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

const MetricCard = ({ title, value, change, icon, trend = 'neutral' }: MetricCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${
          trend === 'up' ? 'bg-green-100 text-green-600' : 
          trend === 'down' ? 'bg-red-100 text-red-600' : 
          'bg-blue-100 text-blue-600'
        }`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-center">
        {trend === 'up' ? (
          <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
        ) : trend === 'down' ? (
          <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
        ) : null}
        <span className={`text-sm ${
          trend === 'up' ? 'text-green-600' : 
          trend === 'down' ? 'text-red-600' : 
          'text-muted-foreground'
        }`}>
          {change > 0 ? '+' : ''}{change}% from last period
        </span>
      </div>
    </Card>
  )
}

export function DashboardHeader() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard 
        title="Total Leads Generated" 
        value="1,248" 
        change={12.5} 
        icon={<Users className="h-6 w-6" />} 
        trend="up" 
      />
      <MetricCard 
        title="Conversion Rate" 
        value="32.8%" 
        change={-2.4} 
        icon={<Target className="h-6 w-6" />} 
        trend="down" 
      />
      <MetricCard 
        title="Revenue Impact" 
        value="$1.2M" 
        change={8.7} 
        icon={<DollarSign className="h-6 w-6" />} 
        trend="up" 
      />
      <MetricCard 
        title="AI Agent Performance" 
        value="87/100" 
        change={5.3} 
        icon={<Users className="h-6 w-6" />} 
        trend="up" 
      />
    </div>
  )
}
