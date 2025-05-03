// Mock implementations for Radix UI components
// This file provides fallback implementations for Radix UI components
// in case they fail to install during the build process

import React from 'react'

// Mock Popover
export const Popover = {
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Trigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Anchor: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Close: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Arrow: () => <div className="arrow" />,
  Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}

// Mock Progress
export const Progress = {
  Root: ({ value, max, ...props }: { value?: number; max?: number; [key: string]: any }) => (
    <div {...props} role="progressbar" aria-valuemin={0} aria-valuemax={max || 100} aria-valuenow={value || 0}>
      <div style={{ width: `${value || 0}%` }} />
    </div>
  ),
  Indicator: ({ style, ...props }: { style?: React.CSSProperties; [key: string]: any }) => (
    <div {...props} style={{ ...style }} />
  ),
}

// Mock Tabs
export const Tabs = {
  Root: ({ defaultValue, value, onValueChange, ...props }: { defaultValue?: string; value?: string; onValueChange?: (value: string) => void; [key: string]: any }) => (
    <div {...props} role="tablist" />
  ),
  List: (props: any) => <div {...props} />,
  Trigger: ({ value, ...props }: { value: string; [key: string]: any }) => (
    <button {...props} role="tab" />
  ),
  Content: ({ value, ...props }: { value: string; [key: string]: any }) => (
    <div {...props} role="tabpanel" />
  ),
}

// Mock Avatar
export const Avatar = {
  Root: (props: any) => <div {...props} />,
  Image: ({ src, alt, ...props }: { src?: string; alt?: string; [key: string]: any }) => (
    <img src={src} alt={alt} {...props} />
  ),
  Fallback: (props: any) => <div {...props} />,
}

// Export mock modules
export const mockModules = {
  '@radix-ui/react-popover': Popover,
  '@radix-ui/react-progress': Progress,
  '@radix-ui/react-tabs': Tabs,
  '@radix-ui/react-avatar': Avatar,
}
