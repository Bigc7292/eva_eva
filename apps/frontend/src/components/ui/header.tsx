'use client'

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { UserNav } from './user-nav'
import { ThemeToggle } from './theme-toggle'
import { Logo } from './logo'
import Link from 'next/link'
import { BugIcon } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="md:hidden">
          <Logo />
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search or other header content */}
          </div>
          <nav className="flex items-center space-x-2">
            <Link href="/debug" passHref>
              <Button variant="ghost" size="icon" title="Debug Tools">
                <BugIcon className="h-5 w-5" />
              </Button>
            </Link>
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}