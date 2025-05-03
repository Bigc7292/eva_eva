// Mock implementations for Radix UI components
// This file provides fallback implementations for Radix UI components
// in case they fail to install during the build process

import type { ReactNode, CSSProperties } from 'react'

// Define types to avoid using 'any'
type CommonProps = Record<string, unknown>

// Mock Popover
export const Popover = {
  Root: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Trigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Content: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Anchor: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Close: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Arrow: () => <div className="arrow" />,
  Portal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}

// Mock Progress
export const Progress = {
  Root: ({ value, max, ...props }: { value?: number; max?: number } & CommonProps) => (
    <div
      {...props}
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax={max?.toString() || "100"}
      aria-valuenow={value?.toString() || "0"}
      tabIndex={0} // Make it focusable
    >
      <div className="progress-indicator" data-value={value || 0} />
    </div>
  ),
  Indicator: ({ style, ...props }: { style?: CSSProperties } & CommonProps) => (
    <div {...props} className="progress-indicator" />
  ),
}

// Mock Tabs
export const Tabs = {
  Root: ({ defaultValue, value, onValueChange, ...props }: {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void
  } & CommonProps) => (
    <div {...props} className="tabs-root" />
  ),
  List: (props: CommonProps) => <div {...props} className="tabs-list" role="tablist" />,
  Trigger: ({ value, ...props }: { value: string } & CommonProps) => (
    <button {...props} role="tab" className="tabs-trigger" />
  ),
  Content: ({ value, ...props }: { value: string } & CommonProps) => (
    <div {...props} role="tabpanel" className="tabs-content" />
  ),
}

// Mock Avatar
export const Avatar = {
  Root: (props: CommonProps) => <div {...props} className="avatar-root" />,
  Image: ({ src, alt = "User avatar", ...props }: { src?: string; alt?: string } & CommonProps) => (
    <img src={src} alt={alt} {...props} className="avatar-image" />
  ),
  Fallback: (props: CommonProps) => <div {...props} className="avatar-fallback" />,
}

// Export mock modules
export const mockModules = {
  '@radix-ui/react-popover': Popover,
  '@radix-ui/react-progress': Progress,
  '@radix-ui/react-tabs': Tabs,
  '@radix-ui/react-avatar': Avatar,
}
