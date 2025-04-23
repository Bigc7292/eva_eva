/**
 * Check API Endpoints
 * 
 * This script checks all API endpoints required for the Vapi workflow.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Base URL for API endpoints
const BASE_URL = process.env.BASE_URL || 'http://localhost:3004';

// Test data
const testData = {
  properties: {
    location: 'Dubai Marina',
    type: 'Apartment',
    budget: '1000000'
  },
  calendar: {
    time: 'tomorrow'
  },
  booking: {
    slot: 'Monday, April 29 at 10:00 AM'
  },
  lead: {
    name: 'Test User',
    phone_number: '+971565401583',
    email: 'test@example.com',
    status: 'booked',
    budget: '1000000',
    property_interest: 'Apartment',
    location: 'Dubai Marina',
    purpose: 'investment',
    timeframe: '3 months'
  }
};

/**
 * Check properties endpoint
 */
async function checkPropertiesEndpoint() {
  try {
    console.log('Checking properties endpoint...');
    
    const url = new URL(`${BASE_URL}/api/properties`);
    url.searchParams.append('location', testData.properties.location);
    url.searchParams.append('type', testData.properties.type);
    url.searchParams.append('budget', testData.properties.budget);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Properties endpoint failed: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!data.properties || !Array.isArray(data.properties)) {
      console.error('❌ Properties endpoint returned invalid data format');
      console.error('Expected properties array, got:', data);
      return false;
    }
    
    console.log('✅ Properties endpoint working correctly');
    console.log(`Found ${data.properties.length} matching properties`);
    
    return true;
  } catch (error) {
    console.error('❌ Error checking properties endpoint:', error);
    return false;
  }
}

/**
 * Check calendar available slots endpoint
 */
async function checkCalendarSlotsEndpoint() {
  try {
    console.log('\nChecking calendar available slots endpoint...');
    
    const url = new URL(`${BASE_URL}/api/calendar/available_slots`);
    url.searchParams.append('time', testData.calendar.time);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Calendar slots endpoint failed: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!data.available_slots || !Array.isArray(data.available_slots)) {
      console.error('❌ Calendar slots endpoint returned invalid data format');
      console.error('Expected available_slots array, got:', data);
      return false;
    }
    
    console.log('✅ Calendar slots endpoint working correctly');
    console.log(`Found ${data.available_slots.length} available slots`);
    
    return true;
  } catch (error) {
    console.error('❌ Error checking calendar slots endpoint:', error);
    return false;
  }
}

/**
 * Check calendar booking endpoint
 */
async function checkCalendarBookingEndpoint() {
  try {
    console.log('\nChecking calendar booking endpoint...');
    
    const response = await fetch(`${BASE_URL}/api/calendar/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        slot: testData.booking.slot
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Calendar booking endpoint failed: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.booking_confirmation !== true) {
      console.error('❌ Calendar booking endpoint returned invalid data format');
      console.error('Expected booking_confirmation: true, got:', data);
      return false;
    }
    
    console.log('✅ Calendar booking endpoint working correctly');
    
    return true;
  } catch (error) {
    console.error('❌ Error checking calendar booking endpoint:', error);
    return false;
  }
}

/**
 * Check leads endpoint
 */
async function checkLeadsEndpoint() {
  try {
    console.log('\nChecking leads endpoint...');
    
    const response = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData.lead)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Leads endpoint failed: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!data.id && !data.lead_id) {
      console.error('❌ Leads endpoint returned invalid data format');
      console.error('Expected id or lead_id in response, got:', data);
      return false;
    }
    
    console.log('✅ Leads endpoint working correctly');
    
    return true;
  } catch (error) {
    console.error('❌ Error checking leads endpoint:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('=== Checking API Endpoints ===');
    console.log(`Base URL: ${BASE_URL}`);
    
    // Check all endpoints
    const propertiesOk = await checkPropertiesEndpoint();
    const calendarSlotsOk = await checkCalendarSlotsEndpoint();
    const calendarBookingOk = await checkCalendarBookingEndpoint();
    const leadsOk = await checkLeadsEndpoint();
    
    // Summary
    console.log('\n=== API Endpoints Summary ===');
    console.log(`Properties Endpoint: ${propertiesOk ? '✅ OK' : '❌ Failed'}`);
    console.log(`Calendar Slots Endpoint: ${calendarSlotsOk ? '✅ OK' : '❌ Failed'}`);
    console.log(`Calendar Booking Endpoint: ${calendarBookingOk ? '✅ OK' : '❌ Failed'}`);
    console.log(`Leads Endpoint: ${leadsOk ? '✅ OK' : '❌ Failed'}`);
    
    if (propertiesOk && calendarSlotsOk && calendarBookingOk && leadsOk) {
      console.log('\n✅ All API endpoints are working correctly!');
    } else {
      console.log('\n❌ Some API endpoints are not working correctly.');
      console.log('Please fix the issues before using the workflow.');
    }
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the script
main();
