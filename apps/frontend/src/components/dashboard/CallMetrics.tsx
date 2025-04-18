import { Card } from '@/components/ui/card'
import { Phone, TrendingUp, Clock, Star, PhoneCall, PhoneOff, Calendar, DollarSign } from 'lucide-react'

interface CallMetricsProps {
  metrics: {
    total: number
    answered?: number
    missed?: number
    voicemail?: number
    failed?: number
    outbound?: number
    inbound?: number
    avgDuration: number
    answerRate?: number
    conversionRate?: number
    meetingsScheduled?: number
    callbacksScheduled?: number
  }
}

export function CallMetrics({ metrics }: CallMetricsProps) {
  // Safely format numbers with fallbacks
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0m 0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-medium">Total Calls</h3>
        </div>
        <p className="text-2xl font-bold">{metrics.total || 0}</p>
        <div className="text-xs text-muted-foreground">
          {metrics.outbound !== undefined && metrics.inbound !== undefined ? (
            <>Out: {metrics.outbound} | In: {metrics.inbound}</>
          ) : (
            <>Calls tracked in system</>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-green-500" />
          <h3 className="text-sm font-medium">Answered Calls</h3>
        </div>
        <p className="text-2xl font-bold">{metrics.answered || 0}</p>
        <div className="text-xs text-muted-foreground">
          Answer rate: {formatPercentage(metrics.answerRate)}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <PhoneOff className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-medium">Missed Calls</h3>
        </div>
        <p className="text-2xl font-bold">{metrics.missed || 0}</p>
        <div className="text-xs text-muted-foreground">
          Failed: {metrics.failed || 0} | Voicemail: {metrics.voicemail || 0}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-medium">Avg Duration</h3>
        </div>
        <p className="text-2xl font-bold">
          {formatDuration(metrics.avgDuration)}
        </p>
        <div className="text-xs text-muted-foreground">
          For answered calls only
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-medium">Meetings Booked</h3>
        </div>
        <p className="text-2xl font-bold">{metrics.meetingsScheduled || 0}</p>
        <div className="text-xs text-muted-foreground">
          Callbacks: {metrics.callbacksScheduled || 0}
        </div>
      </Card>
    </div>
  )
}