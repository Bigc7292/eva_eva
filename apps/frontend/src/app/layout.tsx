'use client'
import type * as React from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/tailwind.css'
import '@/styles/globals.css'
import '@/lib/chart-register'

// Components
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'
import { Header } from '@/components/ui/header'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SidebarProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen">
              {/* Sidebar */}
              <Sidebar />

              <div className="flex-1 ml-14">
                {/* Header */}
                <Header />

                {/* Main Content */}
                <main className="w-full max-w-[1920px] mx-auto px-4 py-4">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </SidebarProvider>
      </body>
    </html>
  )
}