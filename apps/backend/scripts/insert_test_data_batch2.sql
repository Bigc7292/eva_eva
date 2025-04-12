-- Insert test data batch 2
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
-- Not Interested Lead
(
    'CRM-NI-2024-0002',
    'John Miller',
    '+971507890124',
    'john.m@email.com',
    'Male',
    'Dubai',
    'Secondary',
    'Personal Use',
    '1M-2M AED',
    ARRAY['JVC', 'Sports City'],
    'Not Interested',
    'Low',
    1,
    0.25,
    'Location preferences not matching available properties.',
    'Website Form',
    'Looking for different area, budget constraints'
),

-- Callback Lead
(
    'CRM-CB-2024-0002',
    'Ali Mohammed',
    '+971509012345',
    'ali.m@email.com',
    'Male',
    'Abu Dhabi',
    'Secondary',
    'Personal Use',
    '2M-3M AED',
    ARRAY['Downtown Dubai'],
    'Callback',
    'Medium',
    3,
    0.70,
    'Interested in viewing properties next weekend.',
    'Website Chat',
    'Schedule callback for property viewing arrangement'
),

-- No Answer Lead
(
    'CRM-NA-2024-0002',
    'Maria Garcia',
    '+971509876543',
    'maria.g@email.com',
    'Female',
    'Dubai',
    'Off-plan',
    'Investment',
    '1M-2M AED',
    ARRAY['JVC', 'Dubai South'],
    'No Answer',
    'Low',
    0,
    0.0,
    'Two attempts made - morning and afternoon.',
    'Website Form',
    'Try reaching during evening hours'
); 