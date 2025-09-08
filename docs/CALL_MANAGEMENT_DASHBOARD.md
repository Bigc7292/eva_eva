# Call Management Dashboard

This document provides an overview of the Call Management Dashboard implementation, which tracks and displays call-related metrics for the AI-driven phone outreach system.

## Overview

The Call Management Dashboard integrates with VAPI.ai for voice calls and Supabase for data storage. It displays real-time metrics related to calls, costs, meetings, and lead segmentation.

## Components

### Backend Components

1. **Database Schema** (`db/schema.sql`)
   - Tables for leads, calls, and meetings
   - Views for call metrics, cost metrics, meeting metrics, and lead segmentation
   - Indexes for performance optimization

2. **Backend API** (`apps/backend/server.js`)
   - RESTful API endpoints for fetching metrics and managing calls
   - Webhook handler for VAPI events
   - Database integration with PostgreSQL

### Frontend Components

1. **Call Management Metrics** (`apps/frontend/src/components/dashboard/CallManagementMetrics.tsx`)
   - Displays call metrics, cost metrics, meeting metrics, and lead segmentation
   - Real-time updates via polling

2. **Enhanced Call Analytics** (`apps/frontend/src/components/dashboard/EnhancedCallAnalytics.tsx`)
   - Comprehensive analytics dashboard with multiple tabs
   - Visual charts for call counts, quality, trends, and agent performance
   - Interactive visualizations using Recharts

3. **VAPI Call Panel** (`apps/frontend/src/components/dashboard/VapiCallPanel.tsx`)
   - Interface for making single calls or bulk calls via CSV upload
   - Displays call results

4. **API Routes**
   - `/api/vapi/call`: Initiates a single call
   - `/api/vapi/bulk-call`: Initiates multiple calls from a CSV file
   - `/api/webhooks/vapi`: Handles VAPI webhook events

## Data Flow

1. **Call Initiation**
   - User initiates a call through the VAPI Call Panel
   - Frontend sends a request to the API
   - API makes a call to VAPI using the private API key
   - VAPI initiates the call and sends webhook events

2. **Webhook Processing**
   - VAPI sends webhook events to the configured webhook URL
   - Webhook handler processes the events and stores data in the database
   - Events include call status updates, transcripts, recordings, and end-of-call reports

3. **Dashboard Updates**
   - Dashboard components fetch metrics from the backend API
   - Metrics are updated in real-time via polling
   - Lead segmentation is updated based on call outcomes

## Metrics Displayed

### Call Metrics
- Total calls made in the current week
- Total calls made today
- Total calls answered (week and day)
- Average call time
- Average number of calls required to book a meeting
- Average number of answered calls per day

### Cost Metrics
- Average cost per day of calls
- Average cost per meeting booked

### Meeting Metrics
- Total meetings booked in the current week
- Total meetings booked today
- Locations of each meeting booked
- Number of meetings booked for off-plan properties
- Number of meetings booked for secondary properties
- Average budget per meeting booked

### Lead Segmentation
- Leads segmented by status:
  - Not Interested
  - Call Back Later
  - No Answer
  - Booked
  - New

### Enhanced Call Analytics

#### Call Counts
- Total calls
- Successful calls
- Unsuccessful calls
- Unknown outcome calls
- Call counts by outcome (successful, unsuccessful, unknown)
- Disconnection reasons (no answer, customer hangup, agent hangup, voicemail, dial failed)

#### Call Quality
- Average call duration
- Maximum call duration
- Minimum call duration
- Average call latency
- Call picked up rate
- Call successful rate
- Voicemail rate

#### Call Direction
- Inbound calls
- Outbound calls
- Unknown direction calls

#### Trends
- Call trends over time (last 30 days)
- Call duration trends
- Success rate trends

#### Agent Performance
- Total calls by agent
- Successful calls by agent
- Success rate by agent
- Average call duration by agent
- Voicemail rate by agent

## VAPI Integration

The dashboard integrates with VAPI.ai using the following configuration:

- **Private API Key**: `d1529b85-51d5-47c0-9332-a73d40f7d62b`
- **Assistant ID**: `cfaa163c-4a47-471b-a39e-95c12d0cb738`
- **Phone Number ID**: `e65a9e6b-33b7-4711-ad21-90220048e38f`
- **Phone Number**: `+19143713101`
- **Webhook URL**: `https://webhook.site/6c094a7c-f31b-42e7-a887-614c6b9208a9`

## Database Schema

The database schema includes the following tables:

1. **Leads Table**
   - Lead information (name, phone number, email, etc.)
   - Status (not_interested, call_back_later, no_answer, booked, new)
   - Budget and property interest

2. **Calls Table**
   - Call information (timestamp, duration, outcome, etc.)
   - Recording URL, transcript, and summary
   - Cost information

3. **Meetings Table**
   - Meeting information (timestamp, location, etc.)
   - Property type (off-plan or secondary)
   - Budget information

## Setup and Configuration

1. **Database Setup**
   - Run the SQL script in `db/schema.sql` to create the database schema
   - Configure the database connection in `.env` file

2. **Backend Setup**
   - Install dependencies: `npm install`
   - Configure environment variables in `.env` file
   - Start the server: `npm run dev`

3. **Frontend Setup**
   - The dashboard is integrated into the existing frontend
   - No additional setup is required

## Webhook Configuration

The webhook handler supports both legacy and new format (2025) webhook events from VAPI:

- **Legacy Format**: Events like call.started, call.ended, etc.
- **New Format**: Events like status-update and end-of-call-report

The webhook handler processes these events and stores the data in the database, updating lead statuses and call information accordingly.

## Making Calls

Calls can be made through the VAPI Call Panel:

1. **Single Call**
   - Enter a phone number
   - Click "Call Now"

2. **Bulk Calls**
   - Upload a CSV file with phone numbers
   - Click "Start Calls"

The system will initiate the calls through VAPI and display the results in the panel.

## Troubleshooting

If you encounter issues with the dashboard, check the following:

1. **Database Connection**
   - Ensure the database is running and accessible
   - Check the database connection string in the `.env` file

2. **VAPI Configuration**
   - Verify the VAPI API keys and configuration
   - Check the webhook URL configuration

3. **Webhook Events**
   - Monitor the webhook events in the console logs
   - Check for any errors in processing webhook events

4. **API Endpoints**
   - Test the API endpoints using a tool like Postman
   - Check for any errors in the API responses
