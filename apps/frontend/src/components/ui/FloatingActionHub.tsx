'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Phone, 
  Users, 
  Calendar, 
  BarChart3, 
  RefreshCw, 
  Plus,
  Camera,
  Play,
  Activity,
  Settings
} from '@/components/ui/icons'

interface FloatingAction {
  id: string
  label: string
  icon: any
  color: string
  action: () => void
  badge?: number
}

export function FloatingActionHub() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeActions, setActiveActions] = useState<string[]>([])
  const [notifications, setNotifications] = useState(0)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1))
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const quickActions: FloatingAction[] = [
    {
      id: 'new-call',
      label: 'Start New Call',
      icon: Phone,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        console.log('Starting new call...')
        setActiveActions(prev => [...prev, 'new-call'])
        setTimeout(() => {
          setActiveActions(prev => prev.filter(id => id !== 'new-call'))
        }, 2000)
      }
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      icon: Calendar,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        console.log('Opening meeting scheduler...')
        setActiveActions(prev => [...prev, 'schedule-meeting'])
        setTimeout(() => {
          setActiveActions(prev => prev.filter(id => id !== 'schedule-meeting'))
        }, 2000)
      }
    },
    {
      id: 'view-leads',
      label: 'View Leads',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600',
      badge: 8,
      action: () => {
        console.log('Opening leads view...')
        window.location.href = '/leads'
      }
    },
    {
      id: 'analytics',
      label: 'Quick Analytics',
      icon: BarChart3,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => {
        console.log('Opening quick analytics...')
        window.location.href = '/dashboard/ceo'
      }
    },
    {
      id: 'refresh-data',
      label: 'Refresh Dashboard',
      icon: RefreshCw,
      color: 'bg-teal-500 hover:bg-teal-600',
      action: () => {
        console.log('Refreshing dashboard data...')
        setActiveActions(prev => [...prev, 'refresh-data'])
        setTimeout(() => {
          setActiveActions(prev => prev.filter(id => id !== 'refresh-data'))
          window.location.reload()
        }, 1500)
      }
    },
    {
      id: 'playwright-test',
      label: 'Run Visual Test',
      icon: Camera,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => {
        console.log('Running Playwright test...')
        setActiveActions(prev => [...prev, 'playwright-test'])
        // This would trigger the actual Playwright test
        setTimeout(() => {
          setActiveActions(prev => prev.filter(id => id !== 'playwright-test'))
        }, 3000)
      }
    }
  ]

  const mainAction = {
    id: 'main',
    label: 'Quick Actions',
    icon: isExpanded ? Settings : Plus,
    color: 'bg-blue-600 hover:bg-blue-700',
    action: () => setIsExpanded(!isExpanded)
  }

  const ActionButton = ({ action, isMain = false }: { action: FloatingAction, isMain?: boolean }) => {
    const isActive = activeActions.includes(action.id)
    const IconComponent = action.icon

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={isMain ? "default" : "sm"}
              className={`
                ${action.color} text-white shadow-lg transform transition-all duration-300
                ${isMain ? 'w-14 h-14 rounded-full' : 'w-12 h-12 rounded-full'}
                ${isActive ? 'scale-110 animate-pulse' : 'hover:scale-105'}
                relative
              `}
              onClick={action.action}
              disabled={isActive}
            >
              <IconComponent 
                className={`${isMain ? 'h-6 w-6' : 'h-4 w-4'} ${isActive ? 'animate-spin' : ''}`} 
              />
              {action.badge && action.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {action.badge > 99 ? '99+' : action.badge}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{action.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <>
      {/* Background overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Action Hub */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Quick Actions Menu */}
        <div className={`
          transition-all duration-300 ease-out mb-4 space-y-3
          ${isExpanded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4 pointer-events-none'}
        `}>
          {quickActions.map((action, index) => (
            <div
              key={action.id}
              className="flex justify-end"
              style={{
                transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
              }}
            >
              <ActionButton action={action} />
            </div>
          ))}
        </div>

        {/* Main Action Button */}
        <div className="flex justify-end">
          <ActionButton action={mainAction} isMain />
          {notifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-6 w-6 p-0 text-xs flex items-center justify-center animate-bounce"
            >
              {notifications > 99 ? '99+' : notifications}
            </Badge>
          )}
        </div>
      </div>

      {/* Activity Indicator */}
      {activeActions.length > 0 && (
        <Card className="fixed bottom-24 right-6 z-50 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
              <span>
                {activeActions.length === 1 
                  ? `Processing ${quickActions.find(a => a.id === activeActions[0])?.label}...`
                  : `Processing ${activeActions.length} actions...`
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}