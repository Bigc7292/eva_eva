-- Create enhanced_leads table for analytics and lead management
CREATE TABLE IF NOT EXISTS enhanced_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100),
    phone VARCHAR(32) UNIQUE,
    email VARCHAR(100),
    status VARCHAR(32),
    source VARCHAR(64),
    location VARCHAR(100),
    successful_meetings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some generated sample data for development/testing
INSERT INTO enhanced_leads (name, phone, email, status, source, location, successful_meetings, created_at, updated_at) VALUES
('John Smith', '+1234567890', 'john.smith@example.com', 'Active', 'Website', 'Dubai', 2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('Jane Doe', '+1987654321', 'jane.doe@example.com', 'Converted', 'Referral', 'Abu Dhabi', 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('Ali Hassan', '+971501234567', 'ali.hassan@example.com', 'Active', 'Ad Campaign', 'Sharjah', 0, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days'),
('Maria Lopez', '+447911123456', 'maria.lopez@example.com', 'Active', 'Website', 'London', 0, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('Wei Zhang', '+8613800138000', 'wei.zhang@example.com', 'Converted', 'Event', 'Beijing', 3, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days');
