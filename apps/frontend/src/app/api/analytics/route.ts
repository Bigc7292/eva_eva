import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

interface CallData {
  id?: string;
  call_id: string;
  phone_number?: string;
  start_time: string;
  end_time?: string;
  call_duration?: number;
  status?: string;
  call_status?: string;
  call_type?: string;
  agent_id?: string;
  agent_name?: string;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  [key: string]: unknown; // For any other properties
}

type Lead = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  status?: string;
  created_at?: string;
  successful_meetings?: number;
  [key: string]: unknown; // For any other properties
}

interface DailyCallCount {
  date: string;
  calls: number;
}

interface AgentCallData {
  agent_id: string;
  agent_name: string;
  calls: CallData[];
}

/**
 * GET /api/analytics
 * Retrieves analytics data from Supabase
 */
export async function GET(_request: NextRequest) {
  try {
    // Get calls from Supabase
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*');

    // Get contacts from Supabase
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*');

    // Get meetings from Supabase
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*');

    // Get emails from Supabase
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('*');

    // Get SMS from Supabase
    const { data: sms, error: smsError } = await supabase
      .from('sms')
      .select('*');

    // Get tasks from Supabase
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');

    // Get notes from Supabase
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*');

    // Log any errors but continue with empty arrays
    if (callsError) console.log('Error fetching calls:', callsError);
    if (contactsError) console.log('Error fetching contacts:', contactsError);
    if (meetingsError) console.log('Error fetching meetings:', meetingsError);
    if (emailsError) console.log('Error fetching emails:', emailsError);
    if (smsError) console.log('Error fetching sms:', smsError);
    if (tasksError) console.log('Error fetching tasks:', tasksError);
    if (notesError) console.log('Error fetching notes:', notesError);

    // Use empty arrays if data is null
    const safeContacts = contacts || [];
    const safeCalls = calls || [];
    const safeMeetings = meetings || [];
    const safeEmails = emails || [];
    const safeSms = sms || [];
    const safeTasks = tasks || [];
    const safeNotes = notes || [];

    // Calculate analytics
    const totalCalls = safeCalls.length;
    const totalContacts = safeContacts.length;
    const totalMeetings = safeMeetings.length;
    const totalEmails = safeEmails.length;
    const totalSms = safeSms.length;
    const totalTasks = safeTasks.length;
    const totalNotes = safeNotes.length;

    // Calculate call statistics
    const completedCalls = safeCalls.filter(call => {
      const status = String(call.status || '').toLowerCase();
      return status === 'completed' || status === 'answered' || status === 'complete';
    }).length;

    const inboundCalls = safeCalls.filter(call => {
      const type = String(call.type || '').toLowerCase();
      return type === 'inbound' || type === 'incoming';
    }).length;

    const outboundCalls = safeCalls.filter(call => {
      const type = String(call.type || '').toLowerCase();
      return type === 'outbound' || type === 'outgoing';
    }).length;

    const missedCalls = safeCalls.filter(call => {
      const status = String(call.status || '').toLowerCase();
      return status === 'missed' || status === 'no answer' || status === 'failed';
    }).length;

    // Calculate average call duration
    let averageCallDuration = 0;
    if (totalCalls > 0) {
      const totalDuration = safeCalls.reduce((acc, call) => {
        const duration = call.duration || 0;
        return acc + (typeof duration === 'number' ? duration : 0);
      }, 0);
      averageCallDuration = totalDuration / totalCalls;
    }

    // Group calls by day
    const callsByDay: DailyCallCount[] = [];
    const callDates: Record<string, number> = {};

    for (const call of safeCalls) {
      try {
        // Try to get date from created_at or timestamp field
        const dateField = call.created_at || call.timestamp || call.date;
        if (dateField) {
          const date = new Date(dateField).toISOString().split('T')[0];
          callDates[date] = (callDates[date] || 0) + 1;
        }
      } catch (error) {
        console.log('Error parsing call date:', error);
      }
    }

    for (const [date, count] of Object.entries(callDates)) {
      callsByDay.push({ date, calls: count })
    }

    // Group calls by agent
    const callsByAgent: AgentCallData[] = [];
    const agentCalls: Record<string, AgentCallData> = {};

    for (const call of safeCalls) {
      const agentName = call.agent_name || 'Unassigned';
      if (!agentCalls[agentName]) {
        agentCalls[agentName] = {
          agent_id: call.agent_id || 'unknown',
          agent_name: agentName,
          calls: []
        };
      }
      agentCalls[agentName].calls.push(call);
    }

    for (const agent of Object.values(agentCalls)) {
      callsByAgent.push(agent);
    }

    // Calculate contact analytics
    const today = new Date().toISOString().split('T')[0];
    const newContactsToday = safeContacts.filter(contact => {
      try {
        const createdAt = contact.created_at || '';
        return createdAt && new Date(createdAt).toISOString().split('T')[0] === today;
      } catch (error) {
        return false;
      }
    }).length;

    // Calculate meeting statistics
    const completedMeetings = safeMeetings.filter(meeting => {
      const status = String(meeting.status || '').toLowerCase();
      return status === 'completed' || status === 'done';
    }).length;

    const scheduledMeetings = safeMeetings.filter(meeting => {
      const status = String(meeting.status || '').toLowerCase();
      return status === 'scheduled' || status === 'pending';
    }).length;

    const cancelledMeetings = safeMeetings.filter(meeting => {
      const status = String(meeting.status || '').toLowerCase();
      return status === 'cancelled' || status === 'canceled';
    }).length;

    // Calculate conversion rate (contacts with meetings)
    const contactsWithMeetings = new Set();
    for (const meeting of safeMeetings) {
      if (meeting.contact_id) {
        contactsWithMeetings.add(meeting.contact_id);
      }
    }

    const conversionRate = totalContacts > 0 ? (contactsWithMeetings.size / totalContacts) * 100 : 0;

    // Return analytics data
    return NextResponse.json({
      // Call statistics
      totalCalls,
      completedCalls,
      inboundCalls,
      outboundCalls,
      missedCalls,
      averageCallDuration,
      callsByDay,
      callsByAgent,

      // Contact statistics
      totalContacts,
      newContactsToday,
      conversionRate,

      // Meeting statistics
      totalMeetings,
      completedMeetings,
      scheduledMeetings,
      cancelledMeetings,

      // Other data counts
      totalEmails,
      totalSms,
      totalTasks,
      totalNotes,

      // Status breakdown
      contactsByStatus: [
        { status: 'Active', count: totalContacts - contactsWithMeetings.size },
        { status: 'Converted', count: contactsWithMeetings.size }
      ]
    })
  } catch (error) {
    console.error('Failed to fetch analytics data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
