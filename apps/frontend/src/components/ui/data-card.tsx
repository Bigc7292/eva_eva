import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface NationalityData {
  name: string
  value: number
}

interface DataCardProps {
  title: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
  kpiStats?: string
  nationalityData?: NationalityData[]
}

const COLORS = ["#00A3FF", "#3066BE", "#FF8B3D", "#95FF6B", "#2E8B57"]

export function DataCard({ title, children, className, action, kpiStats, nationalityData }: DataCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex-1">{children}</div>
        {nationalityData && (
          <div className="mt-4 flex flex-col items-center">
            <div className="w-64 h-64 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {nationalityData.map((item, index) => (
                    <div key={index} className="flex items-center justify-center mb-1">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium">
                        {item.name}: {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={nationalityData}
                    cx="50%"
                    cy="50%"
                    outerRadius="100%"
                    fill="#8884d8"
                    dataKey="value"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                      const RADIAN = Math.PI / 180
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                      const x = cx + radius * Math.cos(-midAngle * RADIAN) * 1.2
                      const y = cy + radius * Math.sin(-midAngle * RADIAN) * 1.2

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          fontSize="12"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      )
                    }}
                  >
                    {nationalityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer> */}
            </div>
          </div>
        )}
        {kpiStats && <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">{kpiStats}</div>}
      </CardContent>
    </Card>
  )
}

