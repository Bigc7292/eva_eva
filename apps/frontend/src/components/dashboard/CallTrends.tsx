import { Card } from '@/components/ui/card'
import { Line } from 'react-chartjs-2'
import { baseChartOptions } from '@/utils/chart-config'

interface CallTrendsProps {
  data?: Array<{
    date: string;
    calls: number;
  }>;
  dailyTrends?: Record<string, number>;
}

export function CallTrends({ data: trendsData, dailyTrends }: CallTrendsProps) {
  // Process the data based on which prop was provided
  let chartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      fill: {
        target: string;
        above: string;
      };
      borderColor: string;
      tension: number;
      pointRadius: number;
      pointHoverRadius: number;
    }[];
  };

  if (dailyTrends) {
    // If dailyTrends is provided (Record<string, number>)
    chartData = {
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
    };
  } else {
    // If data is provided (Array<{date, calls}>)
    const safeData = trendsData || [];
    chartData = {
      labels: safeData.map(item => item.date),
      datasets: [
        {
          label: 'Daily Calls',
          data: safeData.map(item => item.calls),
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
    };
  }

  // Simplified options to avoid animation issues
  const options = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: baseChartOptions.plugins,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  return (
    <Card className="p-4">
      <h3 className="mb-4 text-sm font-medium">Call Trends (30 Days)</h3>
      <Line data={chartData} options={options} />
    </Card>
  )
}