import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'

interface Call {
  id: string
  from: string
  to: string
  status: string
  duration: number
  timestamp: string
}

export function useCalls() {
  const [calls, setCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      const response = await fetch('/api/calls-api')
      const data = await response.json()
      setCalls(data.calls)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch calls",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const makeCall = useCallback(async (number: string) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/calls-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number }),
      })

      if (!response.ok) {
        throw new Error('Failed to make call')
      }

      return await response.json()
    } catch (error) {
      console.error('Error making call:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    calls,
    isLoading,
    makeCall,
    refreshCalls: fetchCalls,
  }
}