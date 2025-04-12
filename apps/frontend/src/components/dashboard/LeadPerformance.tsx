'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function LeadPerformance() {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Lead & Campaign Performance</h3>
      
      <div className="mb-6">
        <h4 className="font-medium mb-3">Lead Source Breakdown</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Social Media</span>
              <span className="text-sm font-medium">42%</span>
            </div>
            <Progress value={42} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Email Campaigns</span>
              <span className="text-sm font-medium">28%</span>
            </div>
            <Progress value={28} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Webinars</span>
              <span className="text-sm font-medium">18%</span>
            </div>
            <Progress value={18} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Referrals</span>
              <span className="text-sm font-medium">12%</span>
            </div>
            <Progress value={12} className="h-2" />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Lead Quality Score</h4>
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
            Average: 7.4/10
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '74%' }}></div>
          </div>
          <span className="text-sm font-medium ml-2">7.4</span>
        </div>
        
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Poor (1)</span>
          <span>Excellent (10)</span>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Meeting Booking Rate</h4>
          <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
            32% (↑5%)
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-2xl font-bold">32%</p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-2xl font-bold">27%</p>
            <p className="text-xs text-muted-foreground">Previous</p>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-2xl font-bold">25%</p>
            <p className="text-xs text-muted-foreground">Industry Avg</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
