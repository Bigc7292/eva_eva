'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const agents = [
  {
    id: 1,
    name: 'Sarah Johnson',
    successRate: 92,
    handleTime: 245,
    scriptAdherence: 98,
    languageScore: 96,
    calls: 28
  },
  {
    id: 2,
    name: 'Michael Chen',
    successRate: 88,
    handleTime: 210,
    scriptAdherence: 95,
    languageScore: 94,
    calls: 32
  },
  {
    id: 3,
    name: 'Aisha Patel',
    successRate: 85,
    handleTime: 230,
    scriptAdherence: 97,
    languageScore: 92,
    calls: 24
  },
  {
    id: 4,
    name: 'David Kim',
    successRate: 82,
    handleTime: 260,
    scriptAdherence: 94,
    languageScore: 90,
    calls: 26
  }
]

export function AgentPerformance() {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">AI Agent Performance Metrics</h3>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Agents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Avg Success Rate</h4>
              <p className="text-2xl font-bold">86.8%</p>
              <p className="text-xs text-muted-foreground">Target: 85%</p>
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Avg Handle Time</h4>
              <p className="text-2xl font-bold">4:05</p>
              <p className="text-xs text-muted-foreground">Target: 3:30 - 4:30</p>
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Script Adherence</h4>
              <p className="text-2xl font-bold">96%</p>
              <p className="text-xs text-muted-foreground">Target: 95%</p>
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Language Quality</h4>
              <p className="text-2xl font-bold">93%</p>
              <p className="text-xs text-muted-foreground">Target: 90%</p>
            </div>
          </div>
          
          <h4 className="font-medium mb-3">Performance by Metric</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Call Success Rate</span>
                <span className="text-sm font-medium text-green-600">86.8%</span>
              </div>
              <Progress value={86.8} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Script Adherence</span>
                <span className="text-sm font-medium text-green-600">96%</span>
              </div>
              <Progress value={96} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Language Quality</span>
                <span className="text-sm font-medium text-green-600">93%</span>
              </div>
              <Progress value={93} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Customer Satisfaction</span>
                <span className="text-sm font-medium text-green-600">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="individual">
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{agent.name}</h4>
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                    {agent.calls} calls today
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Success Rate</span>
                      <span className="text-xs font-medium">{agent.successRate}%</span>
                    </div>
                    <Progress value={agent.successRate} className="h-1.5" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Handle Time</span>
                      <span className="text-xs font-medium">{Math.floor(agent.handleTime / 60)}:{(agent.handleTime % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <Progress value={(agent.handleTime / 300) * 100} className="h-1.5" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Script Adherence</span>
                      <span className="text-xs font-medium">{agent.scriptAdherence}%</span>
                    </div>
                    <Progress value={agent.scriptAdherence} className="h-1.5" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Language Score</span>
                      <span className="text-xs font-medium">{agent.languageScore}%</span>
                    </div>
                    <Progress value={agent.languageScore} className="h-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
