'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function LeadPerformance() {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Lead & Campaign Performance</h3>

      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-muted-foreground text-center mb-4">
          Lead performance data will be displayed here when available from the database.
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Connect to your CRM system to populate this panel with real lead performance data.
        </p>
      </div>
    </Card>
  )
}
