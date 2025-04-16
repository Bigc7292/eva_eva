'use client'

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { UserNav } from './user-nav'
import { ThemeToggle } from './theme-toggle'
import { Logo } from './logo'
import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center">
          <Link href="/dashboard" className="mr-4">
            <div className="relative cursor-pointer h-[18px] w-[120px]">
              <Image
                src="https://transformed-academy-and-salon-ceo.s3.eu-north-1.amazonaws.com/ceo/WhatsApp+Image+2025-04-14+at+18.44.55.jpeg"
                alt="Top Loader Agent AI Solutions"
                width={120}
                height={18}
                priority
                style={{
                  objectFit: 'contain',
                  objectPosition: 'left center',
                  height: 'auto',
                  width: '120px'
                }}
                className="!fixed-size"
              />
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search or other header content */}
          </div>
          <nav className="flex items-center space-x-2">
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}