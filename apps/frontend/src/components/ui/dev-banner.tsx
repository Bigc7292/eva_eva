/**
 * Development Banner Component
 * Shows when mock authentication is being used
 */

'use client'

import { useEffect, useState } from 'react'

export function DevBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    setShowBanner(isDevelopment && isLocalhost)
  }, [])

  if (!showBanner) return null

  return (
    <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
      🔧 DEVELOPMENT MODE - Mock Authentication Active
      <div className="text-xs mt-1">
        Use: dev@eva.com / dev123456 | manager@eva.com / manager123 | agent@eva.com / agent123
      </div>
    </div>
  )
}