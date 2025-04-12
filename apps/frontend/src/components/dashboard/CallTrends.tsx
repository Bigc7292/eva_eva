import { Card } from '@/components/ui/card'
import { Line } from 'react-chartjs-2'
import { baseChartOptions } from '@/utils/chart-config'

interface CallTrendsProps {
  dailyTrends: Record<string, number>
}

export function CallTrends({ dailyTrends }: CallTrendsProps) {
  const data = {
    labels: Object.keys(dailyTrends),
    datasets: [
      {
        label: 'Daily Calls',
        data: Object.values(dailyTrends),
        fill: {
          target: 'origin',
          above: 'rgba(75, 192, 192, 0.2)',
        },
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  }

  const options = {
    ...baseChartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
        },
        ticks: {
          stepSize: 1
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      },
      x: {
        grid: {
          display: false
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    },
    plugins: {
      ...baseChartOptions.plugins,
      animation: {
        onComplete: (animation) => {
          // Add any post-animation effects here
        }
      }
    }
  }

  return (
    <Card className="p-4">
      <h3 className="mb-4 text-sm font-medium">Call Trends (30 Days)</h3>
      <Line data={data} options={options} />
    </Card>
  )
} 