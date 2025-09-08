'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCallAnalytics, getLeadAnalytics } from '@/services/analytics'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if we can connect to our services
        const [callData, analyticsData] = await Promise.all([
          getCallAnalytics(),
          getLeadAnalytics()
        ])

        if (!callData || !analyticsData) {
          throw new Error('Failed to fetch initial data')
        }

        // Redirect to dashboard if initialization is successful
        router.push('/dashboard')
      } catch (err) {
        console.error('Error initializing app:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
        <h1 className="text-4xl font-bold text-blue-600">Welcome to Top Loader Agent AI Solutions</h1>
        <p className="mt-4 text-xl">Your advanced agent management solution</p>
        <div className="mt-8 animate-pulse">
          <div className="h-4 w-32 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
        <h1 className="text-4xl font-bold text-red-600">Error</h1>
        <p className="mt-4 text-xl text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Welcome to Top Loader Agent AI Solutions</h1>
      <p className="mt-4 text-xl">Your advanced agent management solution</p>
      <p className="mt-8 text-gray-500">Redirecting to dashboard...</p>
    </div>
  )
}
