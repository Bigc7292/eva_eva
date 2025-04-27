'use client'

import { useState } from 'react'
import { VirtualizedList } from '@/components/ui/virtualized-list'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FiPhone, FiClock, FiCalendar, FiZap, FiMusic, FiFile, FiChevronDown, FiChevronUp, FiStar } from 'react-icons/fi'

interface Call {
  id: string
  call_id: string
  lead_id: string
  phone_number: string
  call_type: string
  call_status: string
  call_outcome?: string
  timestamp: string
  end_time?: string
  call_duration?: number
  recording_url?: string
  transcript?: string
  summary?: string
  meeting_scheduled?: boolean
  meeting_time?: string
  callback_scheduled?: boolean
  callback_time?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
  ai_rating?: number
}

interface VirtualizedCallListProps {
  calls: Call[]
  height?: number
  className?: string
}

export function VirtualizedCallList({ calls, height = 600, className = '' }: VirtualizedCallListProps) {
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null)
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  const renderCall = (call: Call) => (
    <Card className="border-b pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <FiPhone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{call.call_type} Call</span>
            <Badge variant="outline">{call.call_status}</Badge>
            {call.call_outcome && <Badge>{call.call_outcome}</Badge>}
          </div>
          <span className="text-sm text-muted-foreground">{formatDate(call.timestamp)}</span>
        </div>

        <div className="flex flex-wrap gap-3 text-sm mb-2">
          <div className="flex items-center">
            <FiClock className="mr-1 h-4 w-4 text-muted-foreground" />
            <span>{formatDuration(call.call_duration)}</span>
          </div>
          {call.meeting_scheduled && (
            <div className="flex items-center">
              <FiCalendar className="mr-1 h-4 w-4 text-muted-foreground" />
              <span>Meeting: {call.meeting_time ? formatDate(call.meeting_time) : 'Scheduled'}</span>
            </div>
          )}
          {call.ai_rating && (
            <div className="flex items-center">
              <FiStar className="mr-1 h-4 w-4 text-amber-500" />
              <span>Rating: {typeof call.ai_rating === 'number' ? call.ai_rating.toFixed(1) : call.ai_rating}</span>
            </div>
          )}
        </div>

        {call.summary && (
          <div className="mb-2 bg-muted/30 p-3 rounded-md">
            <div className="flex items-center mb-1">
              <FiZap className="mr-2 h-4 w-4 text-purple-500" />
              <span className="font-medium text-sm">AI Summary</span>
            </div>
            <p className="text-sm text-muted-foreground">{call.summary}</p>
          </div>
        )}

        {call.recording_url && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <FiMusic className="mr-2 h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Call Recording</span>
              </div>
            </div>
            <audio
              controls
              className="w-full h-8"
              aria-label={`Call recording from ${formatDate(call.timestamp)}`}
            >
              <source src={call.recording_url} type="audio/mpeg" />
              <track kind="captions" src="" label="English captions" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {call.transcript && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <FiFile className="mr-2 h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Transcript</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedTranscript(expandedTranscript === call.id ? null : call.id)}
                className="h-6 px-2 text-xs"
              >
                {expandedTranscript === call.id ? (
                  <>
                    <FiChevronUp className="h-3 w-3 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <FiChevronDown className="h-3 w-3 mr-1" />
                    Show
                  </>
                )}
              </Button>
            </div>
            {expandedTranscript === call.id && (
              <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                <pre className="text-xs whitespace-pre-line font-sans">{call.transcript}</pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
  
  return (
    <VirtualizedList
      items={calls}
      renderItem={(call) => renderCall(call)}
      itemHeight={250} // Approximate height of each call item
      height={height}
      className={className}
      overscan={2}
    />
  )
}
