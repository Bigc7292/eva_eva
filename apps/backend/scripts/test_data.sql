-- Insert test data for leads
INSERT INTO leads (
    crm_id,
    name,
    phone,
    email,
    gender,
    location,
    property_interest,
    investment_type,
    budget_range,
    preferred_areas,
    status,
    priority,
    rating,
    ai_sentiment,
    ai_notes,
    source,
    notes
) VALUES
-- Inbound Leads (High Priority)
(
    'CRM-IN-2024-0001',
    'Ahmed Khan',
    '+971501234567',
    'ahmed.khan@email.com',
    'Male',
    'Dubai',
    'Off-plan',
    'Investment',
    '2M-5M AED',
    ARRAY['Dubai Marina', 'Palm Jumeirah'],
    'Interested',
    'High',
    5,
    0.92,
    'Strong interest in luxury properties. Ready to invest immediately. Prefers waterfront views.',
    'Website Form',
    'Looking for 3BR apartment with full marina view'
),
(
    'CRM-IN-2024-0002',
    'Sarah Wilson',
    '+971502345678',
    'sarah.w@email.com',
    'Female',
    'Abu Dhabi',
    'Secondary',
    'Personal Use',
    '1M-2M AED',
    ARRAY['Downtown Dubai', 'Business Bay'],
    'Follow-up',
    'High',
    4,
    0.85,
    'Interested in ready properties. Needs to move within 3 months.',
    'Phone Inquiry',
    'Requires modern finishing, prefers high floor'
),

-- Outbound Leads (Medium Priority)
(
    'CRM-OUT-2024-0001',
    'Mohammed Ali',
    '+971503456789',
    'mali@email.com',
    'Male',
    'Sharjah',
    'Both',
    'Investment',
    '1M-3M AED',
    ARRAY['JVC', 'JVT', 'Dubai Hills'],
    'New',
    'Medium',
    3,
    0.75,
    'Considering both off-plan and ready properties for investment portfolio.',
    'Property Portal',
    'Currently comparing different payment plans'
),
(
    'CRM-OUT-2024-0002',
    'Lisa Chen',
    '+971504567890',
    'lisa.chen@email.com',
    'Female',
    'Dubai',
    'Off-plan',
    'Investment',
    '5M+ AED',
    ARRAY['Palm Jumeirah', 'Dubai Hills Estate'],
    'Follow-up',
    'Medium',
    4,
    0.82,
    'International investor looking for luxury properties.',
    'Agent Referral',
    'Interested in premium developments only'
),

-- Callback Requests
(
    'CRM-CB-2024-0001',
    'James Smith',
    '+971505678901',
    'james.s@email.com',
    'Male',
    'Dubai',
    'Secondary',
    'Personal Use',
    '800K-1.5M AED',
    ARRAY['Motor City', 'Sports City'],
    'Callback',
    'High',
    3,
    0.68,
    'Requested callback to discuss available properties in his budget range.',
    'Website Chat',
    'Prefers morning calls due to work schedule'
),

-- Not Interested Cases
(
    'CRM-NI-2024-0001',
    'Fatima Hassan',
    '+971506789012',
    'fatima.h@email.com',
    'Female',
    'Dubai',
    'Off-plan',
    'Investment',
    '2M-4M AED',
    ARRAY['Dubai Marina'],
    'Not Interested',
    'Low',
    2,
    0.35,
    'Current prices above expected range. May reconsider in 6 months.',
    'Property Portal',
    'Found better options in Abu Dhabi'
),

-- No Answer Cases
(
    'CRM-NA-2024-0001',
    'Robert Chen',
    '+971507890123',
    'robert.c@email.com',
    'Male',
    'Dubai',
    'Secondary',
    'Personal Use',
    '3M-5M AED',
    ARRAY['Emirates Hills', 'Arabian Ranches'],
    'No Answer',
    'Medium',
    0,
    0.0,
    'Multiple attempts made during different times of day.',
    'Email Inquiry',
    'Attempted contact 3 times - no response'
),

-- International Investors
(
    'CRM-IN-2024-0003',
    'Elena Petrova',
    '+971508901234',
    'elena.p@email.com',
    'Female',
    'Moscow',
    'Off-plan',
    'Investment',
    '10M+ AED',
    ARRAY['Palm Jumeirah', 'Dubai Marina', 'Downtown Dubai'],
    'Interested',
    'High',
    5,
    0.95,
    'High-net-worth investor looking for luxury properties. Multiple unit potential.',
    'International Exhibition',
    'Interested in bulk purchase for investment'
),

-- End Users
(
    'CRM-IN-2024-0004',
    'Arun Patel',
    '+971509012345',
    'arun.p@email.com',
    'Male',
    'Dubai',
    'Secondary',
    'Personal Use',
    '1.5M-2.5M AED',
    ARRAY['Dubai Hills Estate', 'Arabian Ranches'],
    'Follow-up',
    'High',
    4,
    0.88,
    'Family of 4 looking for villa. School proximity important.',
    'Agent Referral',
    'Needs to move before next school year'
),

-- First-Time Buyers
(
    'CRM-OUT-2024-0003',
    'Zainab Al Mansoori',
    '+971509123456',
    'zainab.m@email.com',
    'Female',
    'Abu Dhabi',
    'Off-plan',
    'Personal Use',
    '800K-1.2M AED',
    ARRAY['JVC', 'Dubai South'],
    'New',
    'Medium',
    3,
    0.72,
    'First-time buyer looking for affordable payment plan.',
    'Social Media',
    'Interested in post-handover payment plans'
);

-- Add some test data for preferred areas trends
UPDATE leads
SET preferred_areas = preferred_areas || ARRAY['Dubai Hills Estate']
WHERE property_interest = 'Off-plan';

-- Update some leads with AI-suggested follow-up times
UPDATE leads
SET ai_suggested_followup = NOW() + INTERVAL '2 days'
WHERE priority = 'High' AND status = 'Follow-up';

-- Update some leads with last contact times
UPDATE leads
SET last_contact = NOW() - INTERVAL '2 days'
WHERE status IN ('Follow-up', 'Interested');

-- Update some leads with next follow-up times
UPDATE leads
SET next_followup = NOW() + INTERVAL '3 days'
WHERE status = 'Follow-up'; 