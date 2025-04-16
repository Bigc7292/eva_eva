'use client'

import { Button } from '@/components/ui/button'
import { useDebug } from './DebugProvider'
import { Bug } from 'lucide-react'

export function DebugButton() {
  const { isDebugMode, toggleDebugMode } = useDebug()

  return (
    <Button
      variant={isDebugMode ? 'default' : 'ghost'}
      size="icon"
      onClick={toggleDebugMode}
      title={isDebugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
      className="h-8 w-8"
    >
      <Bug className="h-4 w-4" />
    </Button>
  )
}
