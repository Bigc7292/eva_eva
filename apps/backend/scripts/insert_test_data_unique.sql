-- First, let's check existing CRM IDs
SELECT crm_id FROM leads ORDER BY crm_id;

-- Then insert new test data with unique CRM IDs
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
-- Not Interested Lead (using 0003 since 0001 exists)
(
    'CRM-NI-2024-0003',
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

-- Callback Lead
(
    'CRM-CB-2024-0003',
    'Priya Sharma',
    '+971508901234',
    'priya.s@email.com',
    'Female',
    'Dubai',
    'Off-plan',
    'Investment',
    '3M-5M AED',
    ARRAY['Palm Jumeirah', 'Dubai Marina'],
    'Callback',
    'High',
    4,
    0.85,
    'Highly interested in luxury properties, requested evening callback.',
    'Property Portal',
    'Prefers callback after 6 PM GST'
),

-- No Answer Lead
(
    'CRM-NA-2024-0003',
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
); 