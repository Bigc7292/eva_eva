import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Fetches all VAPI calls.
 * @returns {Promise<Array>} The array of VAPI calls.
 * @throws {Error} If the fetch request fails.
 */
async function fetchAllVapiCalls() {
  const res = await fetch('https://api.vapi.ai/call?limit=1000', {
    headers: { Authorization: `Bearer ${VAPI_API_KEY}` }
  });
  if (!res.ok) throw new Error('Failed to fetch from VAPI');
  return await res.json();
}

/**
 * Gets or creates a lead UUID based on the phone number.
 * @param {string} phoneNumber - The phone number of the lead.
 * @returns {Promise<string|null>} The lead UUID or null if not found.
 */
async function getOrCreateLeadUUID(phoneNumber) {
  if (!phoneNumber) return null;
  // Try to find the lead by phone number
  const { data: lead, error } = await supabase
    .from('leads')
    .select('lead_uuid')
    .eq('phone', phoneNumber)
    .single();

  if (lead?.lead_uuid) {
    return lead.lead_uuid;
  }

  // If not found, create a new lead with a generated UUID
  const uuid = crypto.randomUUID ? crypto.randomUUID() : require('node:crypto').randomUUID();
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
  if (newLead?.lead_uuid) {
    return newLead.lead_uuid;
  }
  return null;
}

/**
 * Upserts a call record into the database.
 * @param {Object} call - The call object from VAPI.
 * @returns {Promise<void>}
 */
async function upsertCall(call) {
  // Map VAPI call fields to your Supabase schema
  const phoneNumber = call.destination?.number ?? null;
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
    recording_url: call.artifact?.recordingUrl ?? null,
    transcript: call.artifact?.transcript ?? null,
    summary: call.analysis?.summary ?? null,
    metadata: call, // Or just pick relevant metadata
    created_at: call.createdAt,
    updated_at: call.updatedAt,
  };

  // Upsert into Supabase
  await supabase
    .from('calls')
    .upsert([callRecord], { onConflict: 'call_id' });
}

/**
 * The main function that fetches all VAPI calls and upserts them into the database.
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const calls = await fetchAllVapiCalls();
    for (const call of calls) {
      await upsertCall(call);
      console.log(`Upserted call ${call.id}`);
    }
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();