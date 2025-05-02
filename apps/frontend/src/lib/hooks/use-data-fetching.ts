import useSWR from 'swr'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.status}`)
  }
  return response.json()
}

export function useCallAnalytics(dateRange?: { start: string, end: string }, timeRange?: string) {
  let queryParams = ''

  if (timeRange) {
    queryParams = `?timeRange=${timeRange}`
  } else if (dateRange) {
    queryParams = `?start=${dateRange.start}&end=${dateRange.end}`
  }

  return useSWR(`/api/metrics/calls${queryParams}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 60000, // Refresh every minute
  })
}

export function useLeadAnalytics() {
  return useSWR('/api/metrics/leads', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 300000, // Refresh every 5 minutes
  })
}

export function useMeetingAnalytics() {
  return useSWR('/api/metrics/meetings', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 300000, // Refresh every 5 minutes
  })
}

export function useContactDetails(contactId: string) {
  return useSWR(contactId ? `/api/contacts/${contactId}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 300000, // Refresh every 5 minutes
  })
}

export function useContactCalls(contactId: string) {
  return useSWR(contactId ? `/api/contacts/${contactId}/calls` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 60000, // Refresh every minute
  })
}

export function useContactMeetings(contactId: string) {
  return useSWR(contactId ? `/api/contacts/${contactId}/meetings` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 300000, // Refresh every 5 minutes
  })
}

export function useVapiCalls(limit = 10, cursor?: string) {
  const queryParams = cursor
    ? `?limit=${limit}&cursor=${cursor}`
    : `?limit=${limit}`

  return useSWR(`/api/vapi/calls${queryParams}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 300000, // Refresh every 5 minutes
  })
}

export function useVapiCallDetails(callId: string) {
  return useSWR(callId ? `/api/vapi/calls/${callId}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
}

export function useSystemAlerts(options?: {
  type?: 'error' | 'warning' | 'success' | 'info',
  read?: boolean,
  limit?: number
}) {
  const { type, read, limit = 50 } = options || {}

  let url = `/api/alerts?limit=${limit}`
  if (type) url += `&type=${type}`
  if (read !== undefined) url += `&read=${read}`

  return useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 60000, // Refresh every minute
  })
}

export function useCalendarEvents(startDate?: string, endDate?: string) {
  const queryParams = startDate && endDate
    ? `?start=${startDate}&end=${endDate}`
    : ''

  return useSWR(`/api/calendar/events${queryParams}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 300000, // Refresh every 5 minutes
  })
}
