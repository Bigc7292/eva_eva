'use client'

import { Card } from '@/components/ui/card'

export function AgentPerformance() {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">AI Agent Performance Metrics</h3>

      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-muted-foreground text-center mb-4">
          Agent performance metrics will be displayed here when data is available.
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Connect to your agent performance tracking system to populate this panel with real data.
        </p>
      </div>
    </Card>
  )
}
