import { Card } from '@/components/ui/card'
import { Doughnut } from 'react-chartjs-2'
import { Clock, ThumbsUp, AlertTriangle } from 'lucide-react'
import { baseChartOptions } from '@/utils/chart-config'

interface CallQualityProps {
  quality: {
    excellent: number
    good: number
    poor: number
  }
}

export function CallQualityChart({ quality }: CallQualityProps) {
  const data = {
    labels: ['Excellent (>5m)', 'Good (2-5m)', 'Poor (<2m)'],
    datasets: [{
      data: [quality.excellent, quality.good, quality.poor],
      backgroundColor: ['#22c55e', '#3b82f6', '#ef4444'],
      borderWidth: 0
    }]
  }

  const options = {
    ...baseChartOptions,
    cutout: '70%',
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    hover: {
      mode: 'nearest',
      intersect: true
    }
  }

  return (
    <Card className="p-4 relative group">
      <h3 className="text-lg font-semibold mb-4">Call Quality Analysis</h3>
      <div className="h-64 transition-transform duration-300 group-hover:scale-105">
        <Doughnut data={data} options={options} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="text-green-500" />
            <div>
              <p className="text-sm font-medium">Excellent Calls</p>
              <p className="text-2xl font-bold">{quality.excellent}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="text-blue-500" />
            <div>
              <p className="text-sm font-medium">Good Calls</p>
              <p className="text-2xl font-bold">{quality.good}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            <div>
              <p className="text-sm font-medium">Poor Calls</p>
              <p className="text-2xl font-bold">{quality.poor}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}