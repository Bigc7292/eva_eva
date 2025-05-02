'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import type { DateRange, TimeFrame } from '@/types/analytics'

interface DateRangeSelectorProps {
  onChange: (range: DateRange) => void
}

export function DateRangeSelector({ onChange }: DateRangeSelectorProps) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('30d')
  const [customRange, setCustomRange] = useState<DateRange | null>(null)

  const timeframes: Record<TimeFrame, string> = {
    '1d': 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    'custom': 'Custom Range'
  }

  const handleTimeframeChange = (tf: TimeFrame) => {
    setTimeframe(tf)
    if (tf !== 'custom') {
      const end = new Date()
      const start = new Date()

      // Special case for '1d' - set to today only
      if (tf === '1d') {
        // Set start to beginning of today
        start.setHours(0, 0, 0, 0)
      } else {
        // For other timeframes, subtract the number of days
        start.setDate(end.getDate() - Number.parseInt(tf, 10))
      }

      onChange({ start, end })
    }
  }

  return (
    <div className="flex items-center gap-2">
      {Object.entries(timeframes).map(([key, label]) => (
        <Button
          key={key}
          variant={timeframe === key ? 'default' : 'outline'}
          onClick={() => handleTimeframeChange(key as TimeFrame)}
        >
          {label}
        </Button>
      ))}

      {timeframe === 'custom' && (
        <Popover>
          <PopoverTrigger>
            <Button variant="outline">
              {customRange
                ? `${format(customRange.start, 'PP')} - ${format(customRange.end, 'PP')}`
                : 'Select dates'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={(range) => {
                setCustomRange(range)
                if (range?.from && range?.to) {
                  onChange({ start: range.from, end: range.to })
                }
              }}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}