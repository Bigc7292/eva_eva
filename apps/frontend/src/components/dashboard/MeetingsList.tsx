'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Eye, Calendar, MapPin } from 'lucide-react'
import { MeetingDetailsDialog } from './MeetingDetailsDialog'

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

interface MeetingsListProps {
  meetings: Meeting[]
  onStatusChange?: (meetingId: string, status: string) => void
}

export function MeetingsList({ meetings, onStatusChange }: MeetingsListProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setDialogOpen(true)
  }

  const handleStatusChange = (meetingId: string, status: string) => {
    if (onStatusChange) {
      onStatusChange(meetingId, status)
      setDialogOpen(false)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No meetings found
                </TableCell>
              </TableRow>
            ) : (
              meetings.map((meeting) => (
                <TableRow key={meeting.meeting_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {meeting.meeting_time
                        ? format(new Date(meeting.meeting_time), 'PPP p')
                        : 'Not scheduled'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {meeting.contact?.name || 'Unknown Contact'}
                  </TableCell>
                  <TableCell>{meeting.type || 'Not specified'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {meeting.location || 'Not specified'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(meeting)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MeetingDetailsDialog
        meeting={selectedMeeting}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  )
}
