import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Phone, Upload, List, BarChart, History, Calendar, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Call Management',
  description: 'Make and manage calls using VAPI',
}

export default function CallsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold">Call Management</h1>
          <div className="ml-auto flex items-center space-x-4">
            <nav className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/calls">
                  <List className="h-4 w-4 mr-2" />
                  All Calls
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/calls/single">
                  <Phone className="h-4 w-4 mr-2" />
                  Single Call
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/calls/bulk">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Calls
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/calls/history">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/calls/schedule">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/calls/analytics">
                  <BarChart className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </div>
      <div className="container">
        {children}
      </div>
    </div>
  )
}
