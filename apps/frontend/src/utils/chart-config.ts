import { type ChartOptions } from 'chart.js'

export const baseChartAnimations = {
  duration: 1000,
  easing: 'easeInOutQuart'
}

export const baseChartOptions: ChartOptions = {
  responsive: true,
  animation: baseChartAnimations,
  transitions: {
    active: {
      animation: {
        duration: 400
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        font: {
          family: 'Inter'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        family: 'Inter',
        size: 14,
        weight: '600'
      },
      bodyFont: {
        family: 'Inter',
        size: 13
      }
    }
  }
}