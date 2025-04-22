'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User, Phone, Mail, FileText, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface Meeting {
  meeting_id: string
  contact_id: string
  meeting_time: string
  status: string
  notes: string
  created_at: string
  updated_at: string
  location: string
  type: string
  contact?: {
    name: string
    phone_number: string
    email: string
  }
}

interface MeetingDetailsDialogProps {
  meeting: Meeting | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange?: (meetingId: string, status: string) => void
}

export function MeetingDetailsDialog({
  meeting,
  open,
  onOpenChange,
  onStatusChange,
}: MeetingDetailsDialogProps) {
  if (!meeting) return null

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const handleStatusChange = (status: string) => {
    if (onStatusChange) {
      onStatusChange(meeting.meeting_id, status)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Meeting Details
            <Badge className={getStatusColor(meeting.status)}>
              {meeting.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View and manage meeting details
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Meeting Type</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{meeting.type || 'Not specified'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Location</div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{meeting.location || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Date & Time</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  {meeting.meeting_time
                    ? format(new Date(meeting.meeting_time), 'PPP p')
                    : 'Not scheduled'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {meeting.created_at
                    ? format(new Date(meeting.created_at), 'PPP')
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {meeting.contact && (
            <div className="border-t pt-4 mt-2">
              <div className="text-sm font-medium mb-2">Contact Information</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Name</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>{meeting.contact.name || 'Unknown'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Phone</div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{meeting.contact.phone_number || 'Not provided'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{meeting.contact.email || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4 mt-2">
            <div className="text-sm font-medium mb-2">Notes</div>
            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-sm">{meeting.notes || 'No notes available'}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {meeting.status.toLowerCase() !== 'completed' && (
              <Button
                size="sm"
                variant="outline"
                className="bg-green-100 hover:bg-green-200 text-green-800"
                onClick={() => handleStatusChange('completed')}
              >
                Mark Completed
              </Button>
            )}
            {meeting.status.toLowerCase() !== 'cancelled' && (
              <Button
                size="sm"
                variant="outline"
                className="bg-red-100 hover:bg-red-200 text-red-800"
                onClick={() => handleStatusChange('cancelled')}
              >
                Cancel Meeting
              </Button>
            )}
          </div>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
