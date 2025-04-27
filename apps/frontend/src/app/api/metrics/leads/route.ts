import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/metrics/leads
 * Retrieves lead metrics from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Get lead metrics from the contacts table
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('*')

    if (contactsError) {
      console.error('Error fetching contacts data:', contactsError)
      return NextResponse.json(
        { error: 'Failed to fetch contacts data' },
        { status: 500 }
      )
    }

    // Calculate metrics
    const totalLeads = contactsData?.length || 0
    
    // Count leads by status
    const statusCounts = {}
    if (contactsData) {
      for (const contact of contactsData) {
        const status = contact.status || 'new'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      }
    }

    // Format status data
    const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: Number(count)
    }))

    // Count leads by interest level
    const interestCounts = {}
    if (contactsData) {
      for (const contact of contactsData) {
        const interest = contact.interest_level || 'unknown'
        interestCounts[interest] = (interestCounts[interest] || 0) + 1
      }
    }

    // Format interest data
    const leadsByInterest = Object.entries(interestCounts).map(([interest, count]) => ({
      interest,
      count: Number(count)
    }))

    // Count leads by source
    const sourceCounts = {}
    if (contactsData) {
      for (const contact of contactsData) {
        const source = contact.source || 'direct'
        sourceCounts[source] = (sourceCounts[source] || 0) + 1
      }
    }

    // Format source data
    const leadsBySource = Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      count: Number(count)
    }))

    // Calculate conversion rate (leads with meetings / total leads)
    const { data: meetingsData, error: meetingsError } = await supabase
      .from('meetings')
      .select('contact_id')
      .not('status', 'eq', 'cancelled')

    if (meetingsError) {
      console.error('Error fetching meetings data:', meetingsError)
    }

    // Count unique contact IDs with meetings
    const contactsWithMeetings = new Set()
    if (meetingsData) {
      for (const meeting of meetingsData) {
        if (meeting.contact_id) {
          contactsWithMeetings.add(meeting.contact_id)
        }
      }
    }

    const leadsWithMeetings = contactsWithMeetings.size
    const conversionRate = totalLeads > 0 ? (leadsWithMeetings / totalLeads) * 100 : 0

    return NextResponse.json({
      totalLeads,
      leadsWithMeetings,
      conversionRate,
      leadsByStatus,
      leadsByInterest,
      leadsBySource
    })
  } catch (error) {
    console.error('Error in lead metrics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
