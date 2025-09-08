import { google } from 'googleapis'
import { createTransport } from 'nodemailer'
import twilio from 'twilio'

// Google Calendar setup
const calendar = google.calendar({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY
})

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

interface MeetingDetails {
  title: string
  description: string
  startTime: Date
  endTime: Date
  attendees: string[]
  type: 'offplan' | 'secondary' | 'callback' | 'not-interested' | 'no-answer'
  leadName: string
  leadEmail: string
  leadPhone: string
}

export const calendarService = {
  // Schedule a meeting and send invites
  async scheduleMeeting(details: MeetingDetails) {
    try {
      // Create Google Calendar event
      const event = {
        summary: details.title,
        description: details.description,
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
        eventId: response.data.id
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error)
      throw error
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
  async updateMeetingStatus(eventId: string, status: string) {
    try {
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

      return { success: true }
    } catch (error) {
      console.error('Error updating meeting status:', error)
      throw error
    }
  },

  // Get all meetings for a date range
  async getMeetings(startDate: Date, endDate: Date) {
    try {
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
  }
} 