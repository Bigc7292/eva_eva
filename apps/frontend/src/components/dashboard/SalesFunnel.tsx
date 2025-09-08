'use client'

import { Card } from '@/components/ui/card'

export function SalesFunnel() {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Sales Funnel Analytics</h3>
      
      <div className="relative mx-auto max-w-md">
        {/* Funnel visualization */}
        <div className="flex flex-col items-center">
          {/* Stage 1 */}
          <div className="w-full bg-blue-100 p-3 text-center rounded-t-lg">
            <p className="font-medium">Lead Generation</p>
            <p className="text-2xl font-bold">1,248</p>
            <p className="text-xs text-muted-foreground">100%</p>
          </div>
          <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[15px] border-t-blue-100"></div>
          
          {/* Stage 2 */}
          <div className="w-[85%] bg-blue-200 p-3 text-center">
            <p className="font-medium">Initial Contact</p>
            <p className="text-2xl font-bold">1,061</p>
            <p className="text-xs text-muted-foreground">85% (-15%)</p>
          </div>
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[15px] border-t-blue-200"></div>
          
          {/* Stage 3 */}
          <div className="w-[70%] bg-blue-300 p-3 text-center">
            <p className="font-medium">Qualified Lead</p>
            <p className="text-2xl font-bold">874</p>
            <p className="text-xs text-muted-foreground">70% (-15%)</p>
          </div>
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-blue-300"></div>
          
          {/* Stage 4 */}
          <div className="w-[50%] bg-blue-400 p-3 text-center">
            <p className="font-medium">Meeting Booked</p>
            <p className="text-2xl font-bold">624</p>
            <p className="text-xs text-muted-foreground">50% (-20%)</p>
          </div>
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-blue-400"></div>
          
          {/* Stage 5 */}
          <div className="w-[30%] bg-blue-500 p-3 text-center rounded-b-lg text-white">
            <p className="font-medium">Closed Sale</p>
            <p className="text-2xl font-bold">374</p>
            <p className="text-xs text-blue-100">30% (-20%)</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-1">Time to Conversion</h4>
          <p className="text-2xl font-bold">3.2 days</p>
          <p className="text-xs text-muted-foreground">Industry avg: 4.5 days</p>
        </div>
        
        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-1">Avg Deal Size</h4>
          <p className="text-2xl font-bold">$32,450</p>
          <p className="text-xs text-muted-foreground">↑12% from last month</p>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="font-medium mb-2">Geographic Performance</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-100 text-green-800 p-2 rounded-lg">
            <p className="font-medium">Dubai</p>
            <p className="text-lg font-bold">42%</p>
          </div>
          <div className="bg-blue-100 text-blue-800 p-2 rounded-lg">
            <p className="font-medium">UK</p>
            <p className="text-lg font-bold">28%</p>
          </div>
          <div className="bg-purple-100 text-purple-800 p-2 rounded-lg">
            <p className="font-medium">Global</p>
            <p className="text-lg font-bold">30%</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
