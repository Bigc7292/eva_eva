'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function CustomerFeedback() {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Customer Feedback & Satisfaction</h3>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Customer Satisfaction Score</h4>
          <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
            4.7/5
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg 
              key={star}
              className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'} ${star === 5 ? 'text-yellow-300' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">Based on 328 responses</span>
        </div>
        
        <div className="space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">5 stars</span>
              <span className="text-sm font-medium">78%</span>
            </div>
            <Progress value={78} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">4 stars</span>
              <span className="text-sm font-medium">16%</span>
            </div>
            <Progress value={16} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">3 stars</span>
              <span className="text-sm font-medium">4%</span>
            </div>
            <Progress value={4} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">2 stars</span>
              <span className="text-sm font-medium">1%</span>
            </div>
            <Progress value={1} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">1 star</span>
              <span className="text-sm font-medium">1%</span>
            </div>
            <Progress value={1} className="h-2" />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium mb-3">Common Pain Points</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { text: 'Pricing concerns', size: 'text-lg', color: 'bg-red-100 text-red-800' },
            { text: 'Response time', size: 'text-base', color: 'bg-orange-100 text-orange-800' },
            { text: 'Property availability', size: 'text-lg', color: 'bg-red-100 text-red-800' },
            { text: 'Agent knowledge', size: 'text-sm', color: 'bg-yellow-100 text-yellow-800' },
            { text: 'Follow-up', size: 'text-base', color: 'bg-orange-100 text-orange-800' },
            { text: 'Documentation', size: 'text-sm', color: 'bg-yellow-100 text-yellow-800' },
            { text: 'Location options', size: 'text-base', color: 'bg-orange-100 text-orange-800' },
            { text: 'Payment options', size: 'text-sm', color: 'bg-yellow-100 text-yellow-800' },
          ].map((item, index) => (
            <span 
              key={index} 
              className={`${item.size} ${item.color} px-2 py-1 rounded-full`}
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Net Promoter Score (NPS)</h4>
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
            +42
          </div>
        </div>
        
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="flex h-full">
            <div className="bg-red-500 h-full" style={{ width: '18%' }}></div>
            <div className="bg-yellow-500 h-full" style={{ width: '22%' }}></div>
            <div className="bg-green-500 h-full" style={{ width: '60%' }}></div>
          </div>
        </div>
        
        <div className="flex justify-between mt-1 text-xs">
          <span className="text-red-500">Detractors (18%)</span>
          <span className="text-yellow-500">Passives (22%)</span>
          <span className="text-green-500">Promoters (60%)</span>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          NPS Score = % Promoters - % Detractors = 60% - 18% = +42
        </p>
      </div>
    </Card>
  )
}
