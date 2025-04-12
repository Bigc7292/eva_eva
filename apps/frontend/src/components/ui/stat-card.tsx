import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type React from "react" // Import React

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, change, icon, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <p className={cn("text-xs font-medium", change > 0 ? "text-green-500" : "text-red-500")}>
                {change > 0 ? "+" : ""}
                {change}%
              </p>
            )}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

