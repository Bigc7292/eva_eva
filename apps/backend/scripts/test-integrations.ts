import { calendarService } from '../lib/services/calendar-service'
import chalk from 'chalk'

const log = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  error: (msg: string) => console.log(chalk.red('✗'), msg),
  warning: (msg: string) => console.log(chalk.yellow('⚠'), msg),
}

async function testIntegrations() {
  log.info('Starting integration tests...\n')

  // Test environment variables
  log.info('Checking environment variables...')
  const requiredVars = [
    'GOOGLE_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    log.error('Missing required environment variables:')
    missingVars.forEach(varName => log.error(`- ${varName}`))
    process.exit(1)
  }
  log.success('All required environment variables are present\n')

  // Test Google Calendar
  log.info('Testing Google Calendar integration...')
  try {
    const meeting = await calendarService.scheduleMeeting({
      title: "Integration Test Meeting",
      description: "Testing calendar integration",
      startTime: new Date(Date.now() + 3600000), // 1 hour from now
      endTime: new Date(Date.now() + 7200000),   // 2 hours from now
      attendees: [process.env.EMAIL_USER!],
      type: "offplan",
      leadName: "Test User",
      leadEmail: process.env.EMAIL_USER!,
      leadPhone: process.env.TWILIO_PHONE_NUMBER!
    })
    log.success('Successfully created calendar event')
    log.success(`Meeting link: ${meeting.meetingLink}\n`)
  } catch (error) {
    log.error('Failed to create calendar event:')
    console.error(error)
    process.exit(1)
  }

  // Test Email
  log.info('Testing email integration...')
  try {
    await calendarService.sendEmailInvite({
      to: process.env.EMAIL_USER!,
      subject: "Integration Test Email",
      meetingLink: "https://meet.google.com/test",
      details: {
        title: "Test Meeting",
        description: "Testing email integration",
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        attendees: [process.env.EMAIL_USER!],
        type: "offplan",
        leadName: "Test User",
        leadEmail: process.env.EMAIL_USER!,
        leadPhone: process.env.TWILIO_PHONE_NUMBER!
      }
    })
    log.success('Successfully sent test email\n')
  } catch (error) {
    log.error('Failed to send test email:')
    console.error(error)
    process.exit(1)
  }

  // Test SMS
  log.info('Testing SMS integration...')
  try {
    await calendarService.sendSMSReminder({
      to: process.env.TWILIO_PHONE_NUMBER!,
      meetingLink: "https://meet.google.com/test",
      details: {
        title: "Test Meeting",
        description: "Testing SMS integration",
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        attendees: [process.env.EMAIL_USER!],
        type: "offplan",
        leadName: "Test User",
        leadEmail: process.env.EMAIL_USER!,
        leadPhone: process.env.TWILIO_PHONE_NUMBER!
      }
    })
    log.success('Successfully sent test SMS\n')
  } catch (error) {
    log.error('Failed to send test SMS:')
    console.error(error)
    process.exit(1)
  }

  log.success('All integration tests passed successfully! 🎉')
}

// Run tests
testIntegrations().catch(error => {
  log.error('Test script failed:')
  console.error(error)
  process.exit(1)
}) 