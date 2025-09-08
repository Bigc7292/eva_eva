import { Card } from '@/components/ui/card'
import { Radar } from 'react-chartjs-2'
import { baseChartOptions } from '@/utils/chart-config'

interface SkillMetrics {
  communication: number
  problemSolving: number
  productKnowledge: number
  closingAbility: number
  customerService: number
}

interface SkillsRadarProps {
  teamSkills: SkillMetrics[]
  teamNames: string[]
}

export function SkillsRadarChart({ teamSkills, teamNames }: SkillsRadarProps) {
  const data = {
    labels: [
      'Communication',
      'Problem Solving',
      'Product Knowledge',
      'Closing Ability',
      'Customer Service'
    ],
    datasets: teamSkills.map((skills, index) => ({
      label: teamNames[index],
      data: [
        skills.communication,
        skills.problemSolving,
        skills.productKnowledge,
        skills.closingAbility,
        skills.customerService
      ],
      fill: true,
      backgroundColor: `rgba(${index * 50}, 150, 255, 0.2)`,
      borderColor: `rgba(${index * 50}, 150, 255, 1)`,
      pointBackgroundColor: `rgba(${index * 50}, 150, 255, 1)`,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: `rgba(${index * 50}, 150, 255, 1)`
    }))
  }

  const options = {
    ...baseChartOptions,
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    },
    animation: {
      ...baseChartOptions.animation,
      animateRotate: true,
      animateScale: true
    }
  }

  return (
    <Card className="p-4 relative group">
      <h3 className="text-lg font-semibold mb-4">Team Skills Analysis</h3>
      <div className="h-80 transition-transform duration-300 group-hover:scale-105">
        <Radar data={data} options={options} />
      </div>
    </Card>
  )
} 