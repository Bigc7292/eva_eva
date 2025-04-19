import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchAllVapiCalls() {
  const res = await fetch('https://api.vapi.ai/call?limit=1000', {
    headers: { Authorization: `Bearer ${VAPI_API_KEY}` }
  });
  if (!res.ok) throw new Error('Failed to fetch from VAPI');
  return await res.json();
}

async function getOrCreateLeadUUID(phoneNumber) {
  if (!phoneNumber) return null;
  // Try to find the lead by phone number
  let { data: lead, error } = await supabase
    .from('leads')
    .select('lead_uuid')
    .eq('phone', phoneNumber)
    .single();

  if (lead && lead.lead_uuid) {
    return lead.lead_uuid;
  }

  // If not found, create a new lead with a generated UUID
  const uuid = crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomUUID();
  const { data: newLead, error: createError } = await supabase
    .from('leads')
    .insert([
      {
        phone: phoneNumber,
        name: 'Imported from VAPI',
        status: 'imported',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lead_uuid: uuid
      }
    ])
    .select('lead_uuid')
    .single();
  if (newLead && newLead.lead_uuid) {
    return newLead.lead_uuid;
  }
  return null;
}

async function upsertCall(call) {
  // Map VAPI call fields to your Supabase schema
  const phoneNumber = call.destination && call.destination.number ? call.destination.number : null;
  const leadUUID = await getOrCreateLeadUUID(phoneNumber);
  const callRecord = {
    call_id: call.id,
    lead_id: leadUUID,
    phone_number: phoneNumber,
    call_type: call.type,
    call_status: call.status,
    start_time: call.startedAt,
    end_time: call.endedAt,
    call_duration: call.endedAt && call.startedAt ? (new Date(call.endedAt) - new Date(call.startedAt)) / 1000 : null,
    recording_url: call.artifact && call.artifact.recordingUrl ? call.artifact.recordingUrl : null,
    transcript: call.artifact && call.artifact.transcript ? call.artifact.transcript : null,
    summary: call.analysis && call.analysis.summary ? call.analysis.summary : null,
    metadata: call, // Or just pick relevant metadata
    created_at: call.createdAt,
    updated_at: call.updatedAt,
  };

  // Upsert into Supabase
  await supabase
    .from('calls')
    .upsert([callRecord], { onConflict: 'call_id' });
}

async function main() {
  const calls = await fetchAllVapiCalls();
  for (const call of calls) {
    await upsertCall(call);
    console.log(`Upserted call ${call.id}`);
  }
  console.log('Done.');
}

main().catch(console.error);