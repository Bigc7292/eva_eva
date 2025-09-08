import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'
import { callsService } from '@/services/calls'

export interface Call {
  id: string
  lead_id: string
  lead_phone: string
  lead_name?: string
  call_type: 'Inbound' | 'Outbound'
  call_status: 'Completed' | 'Missed' | 'Voicemail'
  audio_url?: string
  detailed_call_summary?: string
  sentiment_score?: number
  key_topics?: string[]
  next_steps?: string
  agent_id?: string
  agent_name?: string
  timestamp: string
  created_at: string
  updated_at: string
  call_duration?: number
}

export function useCalls(): {
  calls: Call[]
  isLoading: boolean
  makeCall: (number: string) => Promise<any>
  refreshCalls: () => Promise<void>
} {
  const [calls, setCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCalls = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await callsService.getCalls()
      setCalls(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch calls",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const makeCall = useCallback(async (number: string) => {
    try {
      setIsLoading(true)
      const response = await callsService.makeCall('', number)
      return response
    } catch (error) {
      console.error('Error making call:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  return {
    calls,
    isLoading,
    makeCall,
    refreshCalls: fetchCalls,
  }
}