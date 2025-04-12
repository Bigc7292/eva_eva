import { Card } from '@/components/ui/card'
import { Bar } from 'react-chartjs-2'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TeamMemberStats {
  id: string
  name: string
  avatar: string
  calls: number
  conversions: number
  avgDuration: number
}

interface TeamPerformanceProps {
  members: TeamMemberStats[]
}

export function TeamPerformance({ members }: TeamPerformanceProps) {
  const data = {
    labels: members.map(m => m.name),
    datasets: [
      {
        label: 'Calls Made',
        data: members.map(m => m.calls),
        backgroundColor: '#3b82f6'
      },
      {
        label: 'Conversions',
        data: members.map(m => m.conversions),
        backgroundColor: '#22c55e'
      }
    ]
  }

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80">
          <Bar data={data} options={options} />
        </div>
        <div className="space-y-4">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
              <Avatar>
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">
                  {member.calls} calls • {member.conversions} conversions
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{(member.conversions / member.calls * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">conversion rate</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
} 