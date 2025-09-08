-- Enhanced Database Schema for CEO Dashboard Analytics
-- This schema supports comprehensive analytics including phone number profiling,
-- AI ratings, meeting tracking, and all requested visualizations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop views and tables if they exist (in correct order)
DROP VIEW IF EXISTS call_analytics_comprehensive;
DROP VIEW IF EXISTS meeting_analytics_comprehensive;
DROP VIEW IF EXISTS agent_performance_view;
DROP VIEW IF EXISTS phone_number_analytics;
DROP VIEW IF EXISTS call_analytics_by_agent;
DROP VIEW IF EXISTS call_analytics_by_day;
DROP VIEW IF EXISTS call_enhanced_analytics;
DROP VIEW IF EXISTS lead_segmentation;
DROP VIEW IF EXISTS cost_metrics;
DROP VIEW IF EXISTS meeting_metrics;
DROP VIEW IF EXISTS call_metrics;

DROP TABLE IF EXISTS interactions;
DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS calls;
DROP TABLE IF EXISTS phone_number_profiles;
DROP TABLE IF EXISTS user_profiles;

-- User profiles table for authentication and agent tracking
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'agent' CHECK (role IN ('admin', 'ceo', 'agent', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Phone number profiles - central to tracking all interactions per number
CREATE TABLE phone_number_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    location VARCHAR(255),
    lead_source VARCHAR(100), -- website, referral, social media, etc.
    current_status VARCHAR(50) DEFAULT 'new' CHECK (current_status IN (
        'new', 'contacted', 'interested', 'not_interested', 
        'callback_requested', 'meeting_scheduled', 'meeting_completed', 
        'deal_closed', 'lost'
    )),
    total_interactions INT DEFAULT 0,
    first_contact_date TIMESTAMP WITH TIME ZONE,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    budget_range VARCHAR(50),
    property_interest VARCHAR(50) CHECK (property_interest IN ('offplan', 'secondary', 'both', 'unknown')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced calls table with comprehensive analytics fields
CREATE TABLE calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone_number_id UUID REFERENCES phone_number_profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    external_call_id VARCHAR(255), -- VAPI call ID
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INT DEFAULT 0,
    call_type VARCHAR(20) DEFAULT 'outbound' CHECK (call_type IN ('inbound', 'outbound')),
    call_status VARCHAR(50) DEFAULT 'initiated' CHECK (call_status IN (
        'initiated', 'ringing', 'answered', 'completed', 'failed', 'no_answer', 'busy'
    )),
    call_outcome VARCHAR(50) CHECK (call_outcome IN (
        'answered', 'no_answer', 'voicemail', 'busy', 'failed', 
        'interested', 'not_interested', 'callback_requested', 'meeting_scheduled'
    )),
    -- AI Ratings (1-10 scale)
    ai_call_quality_rating DECIMAL(3,2), -- Overall call quality
    ai_lead_score DECIMAL(3,2), -- Lead potential score
    ai_voice_assistant_rating DECIMAL(3,2), -- AI assistant performance
    ai_sentiment_score DECIMAL(3,2), -- Customer sentiment
    ai_interest_level DECIMAL(3,2), -- Customer interest level
    -- Call details
    recording_url VARCHAR(500),
    transcript TEXT,
    summary TEXT,
    cost DECIMAL(10,4) DEFAULT 0,
    callback_requested BOOLEAN DEFAULT false,
    callback_time TIMESTAMP WITH TIME ZONE,
    meeting_scheduled BOOLEAN DEFAULT false,
    meeting_time TIMESTAMP WITH TIME ZONE,
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table with attendance tracking
CREATE TABLE meetings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone_number_id UUID REFERENCES phone_number_profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    call_id UUID REFERENCES calls(id) ON DELETE SET NULL, -- Which call led to this meeting
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INT,
    location VARCHAR(255),
    property_type VARCHAR(50) CHECK (property_type IN ('offplan', 'secondary', 'both')),
    meeting_type VARCHAR(50) DEFAULT 'property_viewing' CHECK (meeting_type IN (
        'property_viewing', 'consultation', 'contract_signing', 'follow_up'
    )),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'completed', 'no_show', 'cancelled', 'rescheduled'
    )),
    outcome VARCHAR(50) CHECK (outcome IN (
        'successful', 'unsuccessful', 'follow_up_needed', 'deal_closed', 'no_show'
    )),
    deal_value DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- General interactions table for comprehensive tracking
CREATE TABLE interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone_number_id UUID REFERENCES phone_number_profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
    meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
        'call_attempt', 'call_completed', 'voicemail_left', 'email_sent', 
        'sms_sent', 'meeting_scheduled', 'meeting_completed', 'callback_scheduled',
        'note_added', 'status_changed'
    )),
    description TEXT,
    outcome VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_phone_profiles_number ON phone_number_profiles(phone_number);
CREATE INDEX idx_phone_profiles_status ON phone_number_profiles(current_status);
CREATE INDEX idx_phone_profiles_source ON phone_number_profiles(lead_source);
CREATE INDEX idx_calls_phone_number_id ON calls(phone_number_id);
CREATE INDEX idx_calls_agent_id ON calls(agent_id);
CREATE INDEX idx_calls_start_time ON calls(start_time);
CREATE INDEX idx_calls_outcome ON calls(call_outcome);
CREATE INDEX idx_calls_status ON calls(call_status);
CREATE INDEX idx_meetings_phone_number_id ON meetings(phone_number_id);
CREATE INDEX idx_meetings_agent_id ON meetings(agent_id);
CREATE INDEX idx_meetings_scheduled_time ON meetings(scheduled_time);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_interactions_phone_number_id ON interactions(phone_number_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_phone_profiles_updated_at BEFORE UPDATE ON phone_number_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update phone number profile stats
CREATE OR REPLACE FUNCTION update_phone_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE phone_number_profiles 
        SET 
            total_interactions = (
                SELECT COUNT(*) FROM interactions WHERE phone_number_id = NEW.phone_number_id
            ),
            last_contact_date = NOW()
        WHERE id = NEW.phone_number_id;
        
        -- Update first contact date if this is the first interaction
        UPDATE phone_number_profiles 
        SET first_contact_date = NOW()
        WHERE id = NEW.phone_number_id AND first_contact_date IS NULL;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to update phone profile stats when interactions are added
CREATE TRIGGER update_phone_stats_on_interaction 
    AFTER INSERT OR UPDATE ON interactions 
    FOR EACH ROW EXECUTE FUNCTION update_phone_profile_stats();

-- Analytics views for CEO Dashboard

-- Comprehensive call analytics view
CREATE VIEW call_analytics_comprehensive AS
SELECT
    -- Basic call counts
    COUNT(*) AS total_calls,
    COUNT(*) FILTER (WHERE call_outcome = 'answered') AS answered_calls,
    COUNT(*) FILTER (WHERE call_outcome = 'no_answer') AS no_answer_calls,
    COUNT(*) FILTER (WHERE call_outcome = 'voicemail') AS voicemail_calls,
    COUNT(*) FILTER (WHERE call_outcome = 'busy') AS busy_calls,
    COUNT(*) FILTER (WHERE call_outcome = 'failed') AS failed_calls,
    COUNT(*) FILTER (WHERE call_outcome = 'interested') AS interested_calls,
    COUNT(*) FILTER (WHERE call_outcome = 'not_interested') AS not_interested_calls,
    COUNT(*) FILTER (WHERE callback_requested = true) AS callback_requested_calls,
    COUNT(*) FILTER (WHERE meeting_scheduled = true) AS meeting_scheduled_calls,
    
    -- Rates and percentages
    CASE WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE call_outcome = 'answered')::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0 END AS answer_rate,
    
    CASE WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE call_outcome = 'interested')::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0 END AS interest_rate,
        
    CASE WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE meeting_scheduled = true)::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0 END AS meeting_conversion_rate,
    
    -- Duration and timing metrics
    ROUND(AVG(duration_seconds), 2) AS avg_call_duration,
    MAX(duration_seconds) AS max_call_duration,
    MIN(duration_seconds) AS min_call_duration,
    
    -- AI ratings averages
    ROUND(AVG(ai_call_quality_rating), 2) AS avg_call_quality_rating,
    ROUND(AVG(ai_lead_score), 2) AS avg_lead_score,
    ROUND(AVG(ai_voice_assistant_rating), 2) AS avg_voice_assistant_rating,
    ROUND(AVG(ai_sentiment_score), 2) AS avg_sentiment_score,
    ROUND(AVG(ai_interest_level), 2) AS avg_interest_level,
    
    -- Cost metrics
    SUM(cost) AS total_cost,
    ROUND(AVG(cost), 4) AS avg_cost_per_call,
    CASE WHEN COUNT(*) FILTER (WHERE meeting_scheduled = true) > 0 THEN
        ROUND(SUM(cost) / COUNT(*) FILTER (WHERE meeting_scheduled = true), 2)
        ELSE 0 END AS cost_per_meeting
        
FROM calls
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days';

-- Meeting analytics view
CREATE VIEW meeting_analytics_comprehensive AS
SELECT
    COUNT(*) AS total_meetings,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_meetings,
    COUNT(*) FILTER (WHERE status = 'no_show') AS no_show_meetings,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_meetings,
    COUNT(*) FILTER (WHERE property_type = 'offplan') AS offplan_meetings,
    COUNT(*) FILTER (WHERE property_type = 'secondary') AS secondary_meetings,
    COUNT(*) FILTER (WHERE outcome = 'successful') AS successful_meetings,
    COUNT(*) FILTER (WHERE outcome = 'deal_closed') AS deal_closed_meetings,
    
    -- Attendance rate
    CASE WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0 END AS attendance_rate,
    
    -- Success rate
    CASE WHEN COUNT(*) FILTER (WHERE status = 'completed') > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE outcome = 'successful')::DECIMAL / COUNT(*) FILTER (WHERE status = 'completed')) * 100, 2)
        ELSE 0 END AS success_rate,
    
    -- Deal metrics
    SUM(deal_value) AS total_deal_value,
    ROUND(AVG(deal_value), 2) AS avg_deal_value,
    ROUND(AVG(duration_minutes), 2) AS avg_meeting_duration
    
FROM meetings
WHERE scheduled_time >= CURRENT_DATE - INTERVAL '30 days';

-- Agent performance view
CREATE VIEW agent_performance_view AS
SELECT
    up.id AS agent_id,
    up.name AS agent_name,
    up.email AS agent_email,
    
    -- Call metrics
    COUNT(c.id) AS total_calls_made,
    COUNT(c.id) FILTER (WHERE c.call_outcome = 'answered') AS calls_answered,
    COUNT(c.id) FILTER (WHERE c.call_outcome = 'interested') AS interested_responses,
    COUNT(c.id) FILTER (WHERE c.meeting_scheduled = true) AS meetings_scheduled,
    
    -- Rates
    CASE WHEN COUNT(c.id) > 0 THEN 
        ROUND((COUNT(c.id) FILTER (WHERE c.call_outcome = 'answered')::DECIMAL / COUNT(c.id)) * 100, 2)
        ELSE 0 END AS answer_rate,
    
    CASE WHEN COUNT(c.id) > 0 THEN 
        ROUND((COUNT(c.id) FILTER (WHERE c.meeting_scheduled = true)::DECIMAL / COUNT(c.id)) * 100, 2)
        ELSE 0 END AS meeting_conversion_rate,
    
    -- Meeting metrics
    COUNT(m.id) AS total_meetings_conducted,
    COUNT(m.id) FILTER (WHERE m.status = 'completed') AS meetings_attended,
    COUNT(m.id) FILTER (WHERE m.outcome = 'successful') AS successful_meetings,
    
    -- Performance metrics
    ROUND(AVG(c.ai_call_quality_rating), 2) AS avg_call_quality,
    ROUND(AVG(c.duration_seconds), 2) AS avg_call_duration,
    SUM(m.deal_value) AS total_deals_value
    
FROM user_profiles up
LEFT JOIN calls c ON up.id = c.agent_id 
    AND c.start_time >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN meetings m ON up.id = m.agent_id 
    AND m.scheduled_time >= CURRENT_DATE - INTERVAL '30 days'
WHERE up.role IN ('agent', 'manager')
GROUP BY up.id, up.name, up.email;

-- Phone number analytics view
CREATE VIEW phone_number_analytics AS
SELECT
    pnp.phone_number,
    pnp.name,
    pnp.location,
    pnp.lead_source,
    pnp.current_status,
    pnp.total_interactions,
    pnp.first_contact_date,
    pnp.last_contact_date,
    
    -- Call statistics for this number
    COUNT(c.id) AS total_calls,
    COUNT(c.id) FILTER (WHERE c.call_outcome = 'answered') AS answered_calls,
    COUNT(c.id) FILTER (WHERE c.callback_requested = true) AS callbacks_requested,
    COUNT(c.id) FILTER (WHERE c.meeting_scheduled = true) AS meetings_from_calls,
    
    -- Meeting statistics
    COUNT(m.id) AS total_meetings_scheduled,
    COUNT(m.id) FILTER (WHERE m.status = 'completed') AS meetings_attended,
    
    -- Latest interaction details
    MAX(c.start_time) AS last_call_date,
    (SELECT call_outcome FROM calls WHERE phone_number_id = pnp.id ORDER BY start_time DESC LIMIT 1) AS last_call_outcome,
    
    -- AI scores
    ROUND(AVG(c.ai_lead_score), 2) AS avg_lead_score,
    ROUND(AVG(c.ai_interest_level), 2) AS avg_interest_level
    
FROM phone_number_profiles pnp
LEFT JOIN calls c ON pnp.id = c.phone_number_id
LEFT JOIN meetings m ON pnp.id = m.phone_number_id
GROUP BY pnp.id, pnp.phone_number, pnp.name, pnp.location, pnp.lead_source, 
         pnp.current_status, pnp.total_interactions, pnp.first_contact_date, 
         pnp.last_contact_date;

-- Functions for analytics calculations

-- Function to get conversion metrics
CREATE OR REPLACE FUNCTION get_conversion_metrics(days_back INT DEFAULT 30)
RETURNS TABLE (
    calls_to_meetings_ratio DECIMAL,
    calls_to_interest_ratio DECIMAL,
    meetings_to_deals_ratio DECIMAL,
    avg_calls_per_meeting DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE WHEN call_count > 0 THEN 
            ROUND(meeting_count::DECIMAL / call_count, 4)
        ELSE 0 END,
        CASE WHEN call_count > 0 THEN 
            ROUND(interested_count::DECIMAL / call_count, 4)
        ELSE 0 END,
        CASE WHEN meeting_count > 0 THEN 
            ROUND(deal_count::DECIMAL / meeting_count, 4)
        ELSE 0 END,
        CASE WHEN meeting_count > 0 THEN 
            ROUND(call_count::DECIMAL / meeting_count, 2)
        ELSE 0 END
    FROM (
        SELECT
            (SELECT COUNT(*) FROM calls WHERE start_time >= CURRENT_DATE - INTERVAL '1 day' * days_back) AS call_count,
            (SELECT COUNT(*) FROM calls WHERE call_outcome = 'interested' AND start_time >= CURRENT_DATE - INTERVAL '1 day' * days_back) AS interested_count,
            (SELECT COUNT(*) FROM meetings WHERE scheduled_time >= CURRENT_DATE - INTERVAL '1 day' * days_back) AS meeting_count,
            (SELECT COUNT(*) FROM meetings WHERE outcome = 'deal_closed' AND scheduled_time >= CURRENT_DATE - INTERVAL '1 day' * days_back) AS deal_count
    ) metrics;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (optional)
INSERT INTO user_profiles (email, name, role) VALUES 
    ('admin@eva.com', 'Eva Admin', 'admin'),
    ('ceo@eva.com', 'Eva CEO', 'ceo'),
    ('agent1@eva.com', 'Agent One', 'agent'),
    ('agent2@eva.com', 'Agent Two', 'agent')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions (adjust as needed for your Supabase setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;