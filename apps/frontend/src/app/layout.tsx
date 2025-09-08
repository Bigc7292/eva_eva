'use client'
import type * as React from 'react'
import Script from 'next/script'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/globals.css'
import '@/lib/chart-register'

// Components
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'
import { Header } from '@/components/ui/header'
import { DevBanner } from '@/components/ui/dev-banner'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <SidebarProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
            <DevBanner />
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
        </AuthProvider>
        
        {/* MCP Debug Tool - Auto-captures console errors for AI analysis */}
        <Script 
          src="/chrome-debug-mcp.js" 
          strategy="afterInteractive"
          onLoad={() => {
            console.log('🐛 MCP Debug Tool loaded - Error monitoring active');
          }}
        />
      </body>
    </html>
  )
}