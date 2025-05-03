'use client'

import { Sidebar } from '@/components/ui/sidebar'
import { Header } from '@/components/ui/header'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 ml-20 transition-all duration-300">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="w-full max-w-[1920px] mx-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
