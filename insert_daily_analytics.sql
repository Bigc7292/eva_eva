-- Insert data into daily_analytics table
INSERT INTO daily_analytics (
    date, 
    total_calls, 
    successful_calls, 
    unsuccessful_calls, 
    unknown_outcome_calls, 
    avg_call_duration, 
    max_call_duration, 
    min_call_duration, 
    avg_call_latency, 
    call_picked_up_rate, 
    call_successful_rate, 
    dial_no_answer_count, 
    customer_hangup_count, 
    agent_hangup_count, 
    voicemail_count, 
    dial_failed_count, 
    voicemail_rate, 
    inbound_calls, 
    outbound_calls, 
    unknown_direction_calls, 
    total_meetings, 
    off_plan_meetings, 
    secondary_meetings, 
    avg_meeting_budget, 
    total_cost, 
    avg_cost_per_call, 
    avg_cost_per_meeting, 
    created_at, 
    updated_at
) VALUES 
-- Today's data
(CURRENT_DATE, 5, 3, 2, 0, 240.5, 420, 120, 2.3, 0.8, 0.6, 1, 1, 0, 1, 0, 0.2, 1, 4, 0, 2, 1, 1, 1350000.00, 2.15, 0.43, 1.075, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Yesterday's data
(CURRENT_DATE - INTERVAL '1 day', 8, 5, 3, 0, 255.2, 450, 110, 2.1, 0.75, 0.625, 2, 1, 0, 2, 0, 0.25, 2, 6, 0, 3, 2, 1, 1275000.00, 3.44, 0.43, 1.147, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- 2 days ago
(CURRENT_DATE - INTERVAL '2 days', 6, 4, 2, 0, 230.8, 400, 105, 2.4, 0.83, 0.667, 1, 1, 0, 1, 0, 0.167, 1, 5, 0, 2, 1, 1, 1400000.00, 2.58, 0.43, 1.29, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- 3 days ago
(CURRENT_DATE - INTERVAL '3 days', 7, 4, 3, 0, 245.3, 430, 115, 2.2, 0.71, 0.571, 2, 1, 0, 1, 0, 0.143, 2, 5, 0, 2, 1, 1, 1325000.00, 3.01, 0.43, 1.505, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- 4 days ago
(CURRENT_DATE - INTERVAL '4 days', 9, 6, 3, 0, 260.1, 460, 125, 2.0, 0.78, 0.667, 2, 1, 0, 2, 0, 0.222, 3, 6, 0, 4, 2, 2, 1300000.00, 3.87, 0.43, 0.968, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- 5 days ago
(CURRENT_DATE - INTERVAL '5 days', 4, 3, 1, 0, 235.7, 410, 130, 2.5, 0.75, 0.75, 1, 0, 0, 1, 0, 0.25, 1, 3, 0, 2, 1, 1, 1375000.00, 1.72, 0.43, 0.86, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- 6 days ago
(CURRENT_DATE - INTERVAL '6 days', 6, 4, 2, 0, 250.4, 440, 120, 2.3, 0.83, 0.667, 1, 1, 0, 1, 0, 0.167, 2, 4, 0, 3, 2, 1, 1250000.00, 2.58, 0.43, 0.86, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
