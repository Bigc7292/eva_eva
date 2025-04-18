import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/leads/segmented
 * Retrieves leads segmented by status
 */
export async function GET(request: NextRequest) {
  try {
    // Get all leads
    const { data: leads, error: leadsError } = await supabase
      .from('enhanced_leads')
      .select('*')
      .order('updated_at', { ascending: false })

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get the last call date for each lead
    const { data: lastCallDates, error: lastCallDatesError } = await supabase
      .from('enhanced_calls')
      .select('lead_id, timestamp')
      .order('timestamp', { ascending: false })

    if (lastCallDatesError) {
      console.error('Error fetching last call dates:', lastCallDatesError)
      return NextResponse.json(
        { error: 'Failed to fetch last call dates' },
        { status: 500 }
      )
    }

    // Create a map of lead_id to last call date
    const lastCallDateMap = new Map()
    lastCallDates?.forEach(call => {
      if (!lastCallDateMap.has(call.lead_id)) {
        lastCallDateMap.set(call.lead_id, call.timestamp)
      }
    })

    // Group leads by status
    const segmentedLeads = {
      not_interested: [],
      call_back_later: [],
      no_answer: [],
      booked: [],
      new: []
    }

    // Add last call date to each lead and group by status
    leads?.forEach(lead => {
      const leadWithLastCall = {
        ...lead,
        last_call_date: lastCallDateMap.get(lead.lead_id) || null
      }

      const status = lead.status || 'new'
      if (segmentedLeads[status]) {
        segmentedLeads[status].push(leadWithLastCall)
      } else {
        segmentedLeads.new.push(leadWithLastCall)
      }
    })

    // Calculate counts for each segment
    const counts = {
      not_interested: segmentedLeads.not_interested.length,
      call_back_later: segmentedLeads.call_back_later.length,
      no_answer: segmentedLeads.no_answer.length,
      booked: segmentedLeads.booked.length,
      new: segmentedLeads.new.length,
      total: leads?.length || 0
    }

    return NextResponse.json({
      counts,
      detailed: segmentedLeads
    })
  } catch (error) {
    console.error('Error in leads segmentation API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
