require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3004;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/call_dashboard',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// API Routes

// Get call metrics
app.get('/api/metrics/calls', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM call_metrics');

    // Calculate average calls per meeting
    const callsResult = await pool.query('SELECT COUNT(*) AS total_calls FROM calls');
    const meetingsResult = await pool.query('SELECT COUNT(*) AS total_meetings FROM meetings WHERE status != \'cancelled\'');

    const totalCalls = parseInt(callsResult.rows[0].total_calls);
    const totalMeetings = parseInt(meetingsResult.rows[0].total_meetings);

    const avgCallsPerMeeting = totalMeetings > 0 ? totalCalls / totalMeetings : 0;

    // Calculate average answered calls per day
    const answeredPerDayResult = await pool.query(`
      SELECT DATE(timestamp) as call_date, COUNT(*) as answered_calls
      FROM calls
      WHERE answered = TRUE
      GROUP BY DATE(timestamp)
    `);

    const avgAnsweredPerDay = answeredPerDayResult.rows.length > 0
      ? answeredPerDayResult.rows.reduce((sum, row) => sum + parseInt(row.answered_calls), 0) / answeredPerDayResult.rows.length
      : 0;

    res.json({
      ...result.rows[0],
      avg_calls_per_meeting: avgCallsPerMeeting,
      avg_answered_per_day: avgAnsweredPerDay
    });
  } catch (error) {
    console.error('Error fetching call metrics:', error);
    res.status(500).json({ error: 'Failed to fetch call metrics' });
  }
});

// Get cost metrics
app.get('/api/metrics/costs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cost_metrics');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching cost metrics:', error);
    res.status(500).json({ error: 'Failed to fetch cost metrics' });
  }
});

// Get meeting metrics
app.get('/api/metrics/meetings', async (req, res) => {
  try {
    const metricsResult = await pool.query('SELECT * FROM meeting_metrics');

    // Get meeting locations
    const locationsResult = await pool.query(`
      SELECT location, COUNT(*) as count
      FROM meetings
      WHERE status != 'cancelled'
      GROUP BY location
    `);

    res.json({
      ...metricsResult.rows[0],
      locations: locationsResult.rows
    });
  } catch (error) {
    console.error('Error fetching meeting metrics:', error);
    res.status(500).json({ error: 'Failed to fetch meeting metrics' });
  }
});

// Get lead segmentation
app.get('/api/leads/segmented', async (req, res) => {
  try {
    const segmentationResult = await pool.query('SELECT * FROM lead_segmentation');

    // Get detailed lead information for each segment
    const detailedLeadsResult = await pool.query(`
      SELECT
        l.lead_id,
        l.name,
        l.phone_number,
        l.email,
        l.status,
        l.last_call_outcome,
        l.total_calls,
        l.budget,
        l.property_interest,
        l.updated_at,
        (SELECT MAX(c.timestamp) FROM calls c WHERE c.lead_id = l.lead_id) as last_call_date
      FROM leads l
      ORDER BY l.updated_at DESC
    `);

    // Group leads by status
    const segmentedLeads = {
      not_interested: [],
      call_back_later: [],
      no_answer: [],
      booked: [],
      new: []
    };

    detailedLeadsResult.rows.forEach(lead => {
      if (segmentedLeads[lead.status]) {
        segmentedLeads[lead.status].push(lead);
      }
    });

    res.json({
      summary: segmentationResult.rows,
      detailed: segmentedLeads
    });
  } catch (error) {
    console.error('Error fetching lead segmentation:', error);
    res.status(500).json({ error: 'Failed to fetch lead segmentation' });
  }
});

// Record a new call
app.post('/api/calls', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      lead_id,
      call_external_id,
      duration,
      answered,
      outcome,
      cost,
      recording_url,
      transcript,
      summary
    } = req.body;

    // Insert the call record
    const callResult = await client.query(
      `INSERT INTO calls
        (lead_id, call_external_id, duration, answered, outcome, cost, recording_url, transcript, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [lead_id, call_external_id, duration, answered, outcome, cost, recording_url, transcript, summary]
    );

    // Update the lead status based on call outcome
    let newStatus;
    switch (outcome) {
      case 'not_interested':
        newStatus = 'not_interested';
        break;
      case 'call_back_later':
        newStatus = 'call_back_later';
        break;
      case 'no_answer':
        newStatus = 'no_answer';
        break;
      default:
        // Keep existing status if outcome doesn't map directly to a status
        const leadResult = await client.query('SELECT status FROM leads WHERE lead_id = $1', [lead_id]);
        newStatus = leadResult.rows[0].status;
    }

    // Update the lead record
    await client.query(
      `UPDATE leads
       SET status = $1, last_call_outcome = $2, total_calls = total_calls + 1
       WHERE lead_id = $3`,
      [newStatus, outcome, lead_id]
    );

    await client.query('COMMIT');

    res.status(201).json(callResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording call:', error);
    res.status(500).json({ error: 'Failed to record call' });
  } finally {
    client.release();
  }
});

// Update lead profile
app.put('/api/leads/:lead_id', async (req, res) => {
  try {
    const { lead_id } = req.params;
    const {
      name,
      email,
      status,
      budget,
      property_interest
    } = req.body;

    const result = await pool.query(
      `UPDATE leads
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           status = COALESCE($3, status),
           budget = COALESCE($4, budget),
           property_interest = COALESCE($5, property_interest)
       WHERE lead_id = $6
       RETURNING *`,
      [name, email, status, budget, property_interest, lead_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Create a new meeting
app.post('/api/meetings', async (req, res) => {
  try {
    const {
      lead_id,
      timestamp,
      location,
      property_type,
      budget,
      notes,
      status = 'scheduled'
    } = req.body;

    // Insert the meeting record
    const meetingResult = await pool.query(
      `INSERT INTO meetings
        (lead_id, timestamp, location, property_type, budget, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [lead_id, timestamp, location, property_type, budget, notes, status]
    );

    // Update the lead status to 'booked'
    await pool.query(
      `UPDATE leads SET status = 'booked' WHERE lead_id = $1`,
      [lead_id]
    );

    res.status(201).json(meetingResult.rows[0]);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Get all leads
app.get('/api/leads', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        l.*,
        (SELECT MAX(c.timestamp) FROM calls c WHERE c.lead_id = l.lead_id) as last_call_date
      FROM leads l
      ORDER BY l.updated_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get all calls for a lead
app.get('/api/leads/:lead_id/calls', async (req, res) => {
  try {
    const { lead_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM calls WHERE lead_id = $1 ORDER BY timestamp DESC`,
      [lead_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching calls for lead:', error);
    res.status(500).json({ error: 'Failed to fetch calls for lead' });
  }
});

// Get all meetings
app.get('/api/meetings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.*,
        l.name as lead_name,
        l.phone_number as lead_phone
      FROM meetings m
      JOIN leads l ON m.lead_id = l.lead_id
      ORDER BY m.timestamp DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get enhanced call analytics
app.get('/api/analytics/enhanced', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM call_enhanced_analytics');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching enhanced call analytics:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced call analytics' });
  }
});

// Get call analytics by day
app.get('/api/analytics/by-day', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const result = await pool.query(
      'SELECT * FROM call_analytics_by_day ORDER BY call_date DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching call analytics by day:', error);
    res.status(500).json({ error: 'Failed to fetch call analytics by day' });
  }
});

// Get call analytics by agent
app.get('/api/analytics/by-agent', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM call_analytics_by_agent ORDER BY total_calls DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching call analytics by agent:', error);
    res.status(500).json({ error: 'Failed to fetch call analytics by agent' });
  }
});

// Create a new lead
app.post('/api/leads', async (req, res) => {
  try {
    const {
      name,
      phone_number,
      email,
      status = 'new',
      budget,
      property_interest = 'none'
    } = req.body;

    const result = await pool.query(
      `INSERT INTO leads
        (name, phone_number, email, status, budget, property_interest)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, phone_number, email, status, budget, property_interest]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Webhook endpoint for VAPI call events
app.post('/api/webhooks/vapi', async (req, res) => {
  const client = await pool.connect();

  try {
    const eventData = req.body;
    console.log('Received VAPI webhook event:', JSON.stringify(eventData));

    // Check if this is an end-of-call-report event
    if (eventData.message && eventData.message.type === 'end-of-call-report') {
      await client.query('BEGIN');

      const callData = eventData.message;
      const customerNumber = callData.customer?.number;

      // Find or create lead based on phone number
      let leadId;
      const leadResult = await client.query(
        'SELECT lead_id FROM leads WHERE phone_number = $1',
        [customerNumber]
      );

      if (leadResult.rows.length === 0) {
        // Create new lead
        const newLeadResult = await client.query(
          `INSERT INTO leads (phone_number, status) VALUES ($1, 'new') RETURNING lead_id`,
          [customerNumber]
        );
        leadId = newLeadResult.rows[0].lead_id;
      } else {
        leadId = leadResult.rows[0].lead_id;
      }

      // Determine call outcome based on analysis
      let outcome = 'answered';
      if (callData.endedReason === 'no-answer' || callData.endedReason === 'voicemail') {
        outcome = 'no_answer';
      }

      // Insert call record
      await client.query(
        `INSERT INTO calls
          (lead_id, call_external_id, timestamp, duration, answered, outcome, cost, recording_url, transcript, summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          leadId,
          callData.call?.id,
          callData.startedAt || new Date(),
          callData.durationSeconds || 0,
          outcome !== 'no_answer',
          outcome,
          callData.cost || 0,
          callData.recordingUrl || '',
          callData.transcript || '',
          callData.summary || ''
        ]
      );

      // Update lead status and call count
      await client.query(
        `UPDATE leads
         SET status = $1, last_call_outcome = $2, total_calls = total_calls + 1
         WHERE lead_id = $3`,
        [outcome === 'no_answer' ? 'no_answer' : 'call_back_later', outcome, leadId]
      );

      await client.query('COMMIT');
    }

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({ status: 'success' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent retries
    res.status(200).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
