'use client'

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { UserNav } from './user-nav'
import { ThemeToggle } from './theme-toggle'
import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-[1920px] mx-auto px-4 flex h-14 items-center">
        <div className="flex items-center">
          <Link href="/dashboard" className="mr-4">
            <div className="font-bold text-lg text-primary">
              Top Loader Agent AI
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search or other header content */}
          </div>
          <nav className="flex items-center space-x-2">
            <UserNav />
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}