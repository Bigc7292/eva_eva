import { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { analyticsService } from '@/services/analytics'
import type { CallMetrics } from '@/types/analytics'

interface MetricsNotificationsProps {
  metrics: CallMetrics
}

export function MetricsNotifications({ metrics }: MetricsNotificationsProps) {
  const { toast } = useToast()

  useEffect(() => {
    const subscription = analyticsService.subscribeToCallUpdates((update) => {
      // Show notification for important metrics
      if (update.type === 'conversion') {
        toast({
          title: 'New Conversion! 🎉',
          description: `Lead converted after ${update.duration} minutes`
        })
      }
      
      if (update.type === 'milestone') {
        toast({
          title: 'Milestone Reached! 🎯',
          description: update.message
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null // This is a non-visual component
} 