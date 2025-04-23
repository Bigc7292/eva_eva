import { google } from 'googleapis'
import { createTransport } from 'nodemailer'
import twilio from 'twilio'
import { supabase } from './supabase'
import { googleAuthService } from './google-auth-service'
import { OAuth2Client } from 'google-auth-library'

// Create OAuth2 client with hardcoded credentials
const oauth2Client = new OAuth2Client(
  '889823691212-l5ooomrd37jpbisohg1q8vofmupbr3c3.apps.googleusercontent.com', // Client ID
  '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', // Client Secret
  'https://7ffc-91-73-200-83.ngrok-free.app/api/auth/google/simple-html-callback' // Redirect URI with ngrok URL
)

// Google Calendar setup with API key (for public data only)
const publicCalendar = google.calendar({
  version: 'v3',
  auth: 'AIzaSyCK7x6tXVVu1NYOtuzN9i0Gh-CiDwKHCtE' // Hardcoded API key
})

// Function to get authenticated calendar client
const getAuthenticatedCalendar = () => {
  // Check if we have tokens
  const tokens = googleAuthService.getTokens()

  if (tokens) {
    // Set credentials
    oauth2Client.setCredentials(tokens)

    // Return authenticated calendar client
    return google.calendar({
      version: 'v3',
      auth: oauth2Client
    })
  }

  // Fall back to public calendar if no tokens
  return publicCalendar
}

// Email setup (using nodemailer)
const emailTransporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

// SMS setup (using Twilio)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// Define token interface
interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  id_token?: string;
  scope?: string;
}

interface MeetingDetails {
  title: string
  description: string
  startTime: Date
  endTime: Date
  attendees: string[]
  type: 'offplan' | 'secondary' | 'callback' | 'followup' | 'not-interested' | 'no-answer'
  leadName: string
  leadEmail: string
  leadPhone: string
  contactId?: string
  location?: string
  notes?: string
}

export const calendarService = {
  // Get auth URL for Google Calendar
  getAuthUrl() {
    return googleAuthService.getAuthUrl();
  },

  // Check if user is authenticated with Google Calendar
  isAuthenticated() {
    return googleAuthService.isAuthenticated();
  },

  // Store tokens from OAuth flow
  storeTokens(tokens: GoogleTokens) {
    googleAuthService.storeTokens(tokens);
    return googleAuthService.storeTokensInDatabase(tokens);
  },

  // Schedule a meeting and send invites
  async scheduleMeeting(details: MeetingDetails) {
    try {
      // Get authenticated calendar client
      const calendar = getAuthenticatedCalendar();

      // Create Google Calendar event
      const event = {
        summary: details.title,
        description: details.description,
        location: details.location,
        start: {
          dateTime: details.startTime.toISOString(),
          timeZone: 'Asia/Dubai',
        },
        end: {
          dateTime: details.endTime.toISOString(),
          timeZone: 'Asia/Dubai',
        },
        attendees: details.attendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      })

      const meetingLink = response.data.hangoutLink
      const eventId = response.data.id

      // Log meeting to database
      await this.logMeetingToDatabase({
        eventId,
        meetingLink,
        details
      })

      // Send email invitation
      await this.sendEmailInvite({
        to: details.leadEmail,
        subject: `Meeting Invitation: ${details.title}`,
        meetingLink,
        details
      })

      // Send SMS reminder
      await this.sendSMSReminder({
        to: details.leadPhone,
        meetingLink,
        details
      })

      return {
        success: true,
        meetingLink,
        eventId
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error)
      throw error
    }
  },

  // Log meeting to database
  async logMeetingToDatabase({ eventId, meetingLink, details }: {
    eventId: string,
    meetingLink: string,
    details: MeetingDetails
  }) {
    try {
      // Create meeting record in database
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          contact_id: details.contactId,
          meeting_time: details.startTime.toISOString(),
          status: 'scheduled',
          notes: details.notes || details.description,
          location: details.location || 'Virtual Meeting',
          type: details.type,
          google_event_id: eventId,
          google_meet_link: meetingLink
        })
        .select()

      if (error) throw error

      console.log('Meeting logged to database:', data)
      return data
    } catch (error) {
      console.error('Error logging meeting to database:', error)
      // Don't throw here to prevent blocking the main meeting creation flow
      // Just log the error and continue
    }
  },

  // Send email invitation
  async sendEmailInvite({ to, subject, meetingLink, details }: {
    to: string
    subject: string
    meetingLink: string
    details: MeetingDetails
  }) {
    const emailContent = `
      Dear ${details.leadName},

      Your meeting has been scheduled for ${details.startTime.toLocaleString('en-AE', {
        timeZone: 'Asia/Dubai'
      })}.

      Meeting Details:
      - Title: ${details.title}
      - Type: ${details.type}
      - Google Meet Link: ${meetingLink}

      Please click the Google Meet link above to join the meeting at the scheduled time.

      Best regards,
      Your Real Estate Team
    `

    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: emailContent,
    })
  },

  // Send SMS reminder
  async sendSMSReminder({ to, meetingLink, details }: {
    to: string
    meetingLink: string
    details: MeetingDetails
  }) {
    const message = `
      Meeting Reminder: ${details.title}
      Time: ${details.startTime.toLocaleString('en-AE', {
        timeZone: 'Asia/Dubai'
      })}
      Join here: ${meetingLink}
    `.trim()

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    })
  },

  // Update meeting status
  async updateMeetingStatus(eventId: string, status: string, meetingId?: string) {
    try {
      // Get authenticated calendar client
      const calendar = getAuthenticatedCalendar();

      // Update Google Calendar event
      const event = await calendar.events.get({
        calendarId: 'primary',
        eventId
      })

      const updatedEvent = {
        ...event.data,
        description: `${event.data.description}\nStatus: ${status}`
      }

      await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: updatedEvent
      })

      // Update meeting status in database if meetingId is provided
      if (meetingId) {
        const { error } = await supabase
          .from('meetings')
          .update({ status })
          .eq('meeting_id', meetingId)

        if (error) {
          console.error('Error updating meeting status in database:', error)
        }
      } else {
        // Try to find the meeting by Google event ID
        const { data, error } = await supabase
          .from('meetings')
          .select('meeting_id')
          .eq('google_event_id', eventId)
          .single()

        if (!error && data) {
          const { error: updateError } = await supabase
            .from('meetings')
            .update({ status })
            .eq('meeting_id', data.meeting_id)

          if (updateError) {
            console.error('Error updating meeting status in database:', updateError)
          }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating meeting status:', error)
      throw error
    }
  },

  // Get all meetings for a date range
  async getMeetings(startDate: Date, endDate: Date) {
    try {
      // Get authenticated calendar client
      const calendar = getAuthenticatedCalendar();

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      })

      return response.data.items
    } catch (error) {
      console.error('Error fetching meetings:', error)
      throw error
    }
  },

  // Schedule a follow-up meeting
  async scheduleFollowUp(details: MeetingDetails) {
    try {
      // Create a follow-up meeting with specific type
      const followUpDetails = {
        ...details,
        title: `Follow-up: ${details.title}`,
        description: `Follow-up meeting for ${details.title}\n\n${details.description}`,
        type: 'followup'
      }

      return await this.scheduleMeeting(followUpDetails)
    } catch (error) {
      console.error('Error scheduling follow-up:', error)
      throw error
    }
  },

  // Sync Google Calendar events with database
  async syncCalendarWithDatabase(startDate: Date, endDate: Date) {
    try {
      // Get events from Google Calendar
      const events = await this.getMeetings(startDate, endDate)

      // Get existing meetings from database
      const { data: existingMeetings, error } = await supabase
        .from('meetings')
        .select('google_event_id')

      if (error) throw error

      // Create a set of existing Google event IDs for quick lookup
      const existingEventIds = new Set(existingMeetings.map(m => m.google_event_id))

      // Filter events that don't exist in the database
      const newEvents = events.filter((event: any) => !existingEventIds.has(event.id))

      // Log new events to database
      for (const event of newEvents) {
        // Extract meeting details from event
        const startTime = new Date(event.start.dateTime || event.start.date)
        const endTime = new Date(event.end.dateTime || event.end.date)

        // Try to determine meeting type from event summary or description
        let type: MeetingDetails['type'] = 'callback'
        if (event.summary?.toLowerCase().includes('follow')) {
          type = 'followup'
        } else if (event.summary?.toLowerCase().includes('property') ||
                  event.summary?.toLowerCase().includes('viewing')) {
          type = 'offplan'
        }

        // Log to database
        await supabase
          .from('meetings')
          .insert({
            meeting_time: startTime.toISOString(),
            status: 'scheduled',
            notes: event.description || '',
            location: event.location || 'Virtual Meeting',
            type,
            google_event_id: event.id,
            google_meet_link: event.hangoutLink || ''
          })
      }

      return {
        success: true,
        syncedEvents: newEvents.length
      }
    } catch (error) {
      console.error('Error syncing calendar with database:', error)
      throw error
    }
  }
}