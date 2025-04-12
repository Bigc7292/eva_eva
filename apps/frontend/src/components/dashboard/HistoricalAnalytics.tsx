'use client'

import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function HistoricalAnalytics() {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Historical & Predictive Analytics</h3>
      
      <Tabs defaultValue="trends">
        <TabsList className="mb-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Lead Generation (Last 30 Days)</h4>
              <div className="h-48 bg-muted rounded-lg flex items-end p-4 gap-1">
                {Array.from({ length: 30 }).map((_, i) => {
                  const height = 20 + Math.random() * 60
                  return (
                    <div 
                      key={i} 
                      className="bg-blue-500 rounded-t w-full"
                      style={{ height: `${height}%` }}
                    ></div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Conversion Rate Trend</h4>
              <div className="h-48 bg-muted rounded-lg p-4 relative">
                {/* Line chart simulation */}
                <svg className="w-full h-full">
                  <path 
                    d="M0,80 C20,100 40,30 60,50 C80,70 100,20 120,40 C140,60 160,80 180,60 C200,40 220,30 240,20 C260,10 280,30 300,20" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3"
                  />
                </svg>
                
                {/* Horizontal grid lines */}
                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-gray-200 w-full h-0"></div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>6 months ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="predictions">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Projected Leads (Next Month)</h4>
                <p className="text-2xl font-bold">1,350</p>
                <p className="text-xs text-green-600">+8.2% increase</p>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Projected Conversion</h4>
                <p className="text-2xl font-bold">34.5%</p>
                <p className="text-xs text-green-600">+1.7% increase</p>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Projected Revenue</h4>
                <p className="text-2xl font-bold">$1.4M</p>
                <p className="text-xs text-green-600">+16.7% increase</p>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Projected Deals</h4>
                <p className="text-2xl font-bold">465</p>
                <p className="text-xs text-green-600">+24.3% increase</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">AI Confidence Score</h4>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Prediction Confidence</span>
                  <span className="text-sm font-medium">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '87%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on 12 months of historical data and current market trends
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Market Factors Influencing Predictions</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm">Dubai Real Estate Growth</span>
                  <span className="text-sm font-medium text-green-600">+12%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm">UK Market Stability</span>
                  <span className="text-sm font-medium text-green-600">+5%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                  <span className="text-sm">Global Economic Uncertainty</span>
                  <span className="text-sm font-medium text-red-600">-3%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm">AI System Improvements</span>
                  <span className="text-sm font-medium text-green-600">+8%</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="benchmarks">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Industry Benchmarks</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Lead Conversion Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">You: 32.8%</span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">Industry: 25%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '32.8%' }}></div>
                    <div className="absolute top-0 h-full w-px bg-gray-400" style={{ left: '25%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Avg Call Duration</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">You: 4:05</span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">Industry: 5:30</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '74%' }}></div>
                    <div className="absolute top-0 h-full w-px bg-gray-400" style={{ left: '100%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Customer Satisfaction</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">You: 4.7/5</span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">Industry: 4.2/5</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '94%' }}></div>
                    <div className="absolute top-0 h-full w-px bg-gray-400" style={{ left: '84%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Regional Performance vs Benchmarks</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-1">Dubai</h5>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Your Performance</span>
                    <span className="text-xs font-medium">+18% above avg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '118%' }}></div>
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-1">UK</h5>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Your Performance</span>
                    <span className="text-xs font-medium">+5% above avg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '105%' }}></div>
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-1">Europe</h5>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Your Performance</span>
                    <span className="text-xs font-medium">+12% above avg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '112%' }}></div>
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-1">Asia</h5>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Your Performance</span>
                    <span className="text-xs font-medium">-3% below avg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '97%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
