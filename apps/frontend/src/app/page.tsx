'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard')
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Welcome to Eva CRM</h1>
      <p className="mt-4 text-xl">Your real estate management solution</p>
      <p className="mt-8 text-gray-500">Redirecting to dashboard...</p>
    </div>
  )
}
