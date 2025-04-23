"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple ScrollArea component that doesn't use Radix UI
const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
})
ScrollArea.displayName = "ScrollArea"

// Simple ScrollBar component (not functional, just for compatibility)
const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "vertical" | "horizontal" }
>(({ className, orientation = "vertical", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "hidden", // Hide the scrollbar by default
        className
      )}
      {...props}
    />
  )
})
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }
