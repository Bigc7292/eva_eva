'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Phone } from 'lucide-react'
import { supabase } from '@/lib/services/supabase'

interface ActiveCall {
  id: string
  lead_name: string
  start_time: string
  duration: number
  status: string
  lead_id: string
}

export function LiveCallData() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])

  useEffect(() => {
    // Initial fetch of active calls
    fetchActiveCalls()

    // Subscribe to changes
    const channel = supabase
      .channel('active_calls')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'active_calls' },
        (payload) => {
          fetchActiveCalls()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const fetchActiveCalls = async () => {
    const { data, error } = await supabase
      .from('active_calls')
      .select(`
        id,
        lead_name,
        start_time,
        duration,
        status,
        lead_id
      `)
      .order('start_time', { ascending: false })

    if (data && !error) {
      setActiveCalls(data)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Active Calls</h3>
      <div className="space-y-4">
        {activeCalls.map(call => (
          <div key={call.id} className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-3">
              <Phone className={`h-5 w-5 ${
                call.status === 'active' ? 'text-green-500' :
                call.status === 'pending' ? 'text-yellow-500' :
                'text-gray-500'
              }`} />
              <span>{call.lead_name}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">
                {formatDuration(call.duration)}
              </span>
            </div>
          </div>
        ))}
        {activeCalls.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No active calls
          </div>
        )}
      </div>
    </Card>
  )
}
