import { NextResponse } from 'next/server';
import { supabase } from '@/lib/services/supabase';

// Improved type definitions
interface TwilioWebhookData {
  CallSid?: string;
  CallStatus?: string;
  From?: string;
  To?: string;
  Direction?: string;
  CallDuration?: string;
  RecordingUrl?: string;
  HangupCause?: string;
  [key: string]: string | undefined;
}

interface CallMetadata {
  direction: string;
  from?: string;
  to?: string;
  twilio_data: TwilioWebhookData;
  failure_reason?: string;
}

export async function POST(req: Request) {
  try {
    if (!req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected form-urlencoded data.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const data: TwilioWebhookData = {};

    // Convert FormData to object safely without using for...of
    const entries = Array.from(formData.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      if (typeof value === 'string') {
        data[key] = value;
      }
    }

    if (!data.CallSid || !data.CallStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: CallSid or CallStatus' },
        { status: 400 }
      );
    }

    try {
      switch (data.CallStatus.toLowerCase()) {
        case 'initiated':
        case 'ringing':
          await handleCallStarted(data.CallSid, data);
          break;

        case 'in-progress':
          await handleCallInProgress(data.CallSid, data);
          break;

        case 'completed':
          await handleCallCompleted(data.CallSid, data);
          break;

        case 'busy':
        case 'failed':
        case 'no-answer':
        case 'canceled':
          await handleCallFailed(data.CallSid, data);
          break;

        default:
          console.warn(`Unhandled call status: ${data.CallStatus}`);
      }

      if (data.CallStatus.toLowerCase() === 'ringing') {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say>Thank you for calling. Your call is being recorded.</Say>
            <Record />
          </Response>`,
          {
            headers: {
              'Content-Type': 'text/xml',
            },
          }
        );
      }
    } catch (error) {
      console.error('Error handling call:', error);
      return NextResponse.json({ error: 'Failed to handle call' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  async function handleCallStarted(callSid: string, data: TwilioWebhookData) {
    console.log(`Call started: ${callSid}`);
    await updateCallMetadata(callSid, { twilio_data: data });
  }

  async function handleCallInProgress(callSid: string, data: TwilioWebhookData) {
    console.log(`Call in progress: ${callSid}`);
    await updateCallMetadata(callSid, { twilio_data: data });
  }

  async function handleCallCompleted(callSid: string, data: TwilioWebhookData) {
    console.log(`Call completed: ${callSid}`);

    const recordingUrl = data.RecordingUrl;
    const callDuration = data.CallDuration;

    if (recordingUrl) {
      console.log(`Recording URL: ${recordingUrl}`);
    }

    if (callDuration) {
      console.log(`Call duration: ${callDuration}`);
    }
    await updateCallMetadata(callSid, {
      twilio_data: data,
      duration: callDuration,
      recording_url: recordingUrl,
    });
  }

  async function handleCallFailed(callSid: string, data: TwilioWebhookData) {
    console.log(`Call failed: ${callSid}`);

    const failureReason = data.HangupCause || 'Unknown';
    console.log(`Failure reason: ${failureReason}`);

    await updateCallMetadata(callSid, {
      twilio_data: data,
      failure_reason: failureReason,
    });
  }

  async function updateCallMetadata(callSid: string, metadata: Partial<CallMetadata> & Record<string, unknown>) {
    try {
      const { data: existingData, error: selectError } = await supabase
        .from('calls')
        .select('metadata')
        .eq('call_id', callSid)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw new Error(`Error fetching existing call metadata: ${selectError.message}`);
      }

      const existingMetadata = existingData ? (existingData.metadata as CallMetadata) : {};
      const updatedMetadata = { ...existingMetadata, ...metadata };

      const { error: updateError } = await supabase
        .from('calls')
        .update({ metadata: updatedMetadata })
        .eq('call_id', callSid);

      if (updateError) {
        throw new Error(`Error updating call metadata: ${updateError.message}`);
      }

      console.log(`Call metadata updated successfully for call: ${callSid}`);
    } catch (error) {
      console.error('Error updating call metadata:', error);
      throw error;
    }
  }
}

