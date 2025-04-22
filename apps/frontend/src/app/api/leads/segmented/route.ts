import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/leads/segmented
 * Retrieves leads segmented by status
 */
export async function GET(request: NextRequest) {
  try {
    // Get contacts data
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      );
    }

    // Get the last call date for each lead from calls table
    const { data: lastCallDates, error: lastCallDatesError } = await supabase
      .from('calls')
      .select('contact_id, created_at')
      .order('created_at', { ascending: false });

    if (lastCallDatesError) {
      console.error('Error fetching last call dates:', lastCallDatesError);
      // Continue without last call dates
    }

    // Create a map of contact_id to last call date
    const lastCallDateMap = new Map();

    if (lastCallDates) {
      for (const call of lastCallDates) {
        if (!lastCallDateMap.has(call.contact_id)) {
          lastCallDateMap.set(call.contact_id, call.created_at);
        }
      }
    }

    // Group leads by status
    const segmentedLeads: Record<string, any[]> = {
      not_interested: [],
      call_back_later: [],
      no_answer: [],
      booked: [],
      new: []
    };

    // Add last call date to each contact and group by status
    if (contacts) {
      for (const contact of contacts) {
        const contactWithLastCall = {
          ...contact,
          lead_id: contact.contact_id, // For backward compatibility
          last_call_date: lastCallDateMap.get(contact.contact_id) || null,
          status: contact.status || 'new',
          property_interest: contact.interests || 'Unknown'
        };

        const status = contactWithLastCall.status;
        if (segmentedLeads[status]) {
          segmentedLeads[status].push(contactWithLastCall);
        } else {
          segmentedLeads.new.push(contactWithLastCall);
        }
      }
    }

    // Calculate counts for each segment
    const counts = {
      not_interested: segmentedLeads.not_interested.length,
      call_back_later: segmentedLeads.call_back_later.length,
      no_answer: segmentedLeads.no_answer.length,
      booked: segmentedLeads.booked.length,
      new: segmentedLeads.new.length,
      total: contacts?.length || 0
    }

    // Format the response to match the expected structure
    const summary = Object.entries(counts).map(([status, count]) => ({
      status,
      count: count as number
    }));

    return NextResponse.json({
      summary,
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
