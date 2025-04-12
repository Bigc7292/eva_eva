import { Card } from '@/components/ui/card'
import { Phone, TrendingUp, Clock, Star } from 'lucide-react'

interface CallMetricsProps {
  metrics: {
    total: number
    outbound: number
    inbound: number
    avgDuration: number
    conversionRate: number
  }
}

export function CallMetrics({ metrics }: CallMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <h3 className="text-sm font-medium">Total Calls</h3>
        </div>
        <p className="text-2xl font-bold">{metrics.total}</p>
        <div className="text-xs text-muted-foreground">
          Out: {metrics.outbound} | In: {metrics.inbound}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <h3 className="text-sm font-medium">Avg Duration</h3>
        </div>
        <p className="text-2xl font-bold">
          {Math.round(metrics.avgDuration / 60)}m {metrics.avgDuration % 60}s
        </p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <h3 className="text-sm font-medium">Conversion Rate</h3>
        </div>
        <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
      </Card>
    </div>
  )
} 