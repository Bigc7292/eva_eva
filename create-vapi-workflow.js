/**
 * Create Vapi Workflow for Real Estate Lead Qualification
 * 
 * This script creates a workflow in Vapi based on the provided node structure.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = process.env.VAPI_PRIVATE_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738';

// Workflow definition
const WORKFLOW = {
  name: "Real Estate Lead Qualification Flow",
  description: "A workflow for qualifying real estate leads in Dubai",
  nodes: [
    {
      id: "1",
      type: "start_call",
      name: "Start Call",
      next_node_id: "2",
      data: {}
    },
    {
      id: "2",
      type: "assistant",
      name: "Greeting",
      next_node_id: "3",
      data: {
        prompt: "You are a real estate assistant for a luxury property company in Dubai. Generate a personalized greeting and ask if it's a good time to talk. Be friendly and professional."
      }
    },
    {
      id: "3",
      type: "gather",
      name: "Collect Good Time",
      next_node_id: "4",
      data: {
        variable_name: "is_good_time",
        prompt: "Listen carefully to their response about whether it's a good time to talk."
      }
    },
    {
      id: "4",
      type: "condition",
      name: "Check Good Time",
      data: {
        condition: "{{is_good_time}} CONTAINS 'yes' OR {{is_good_time}} CONTAINS 'sure' OR {{is_good_time}} CONTAINS 'okay' OR {{is_good_time}} CONTAINS 'fine'",
        true_node_id: "5",
        false_node_id: "27"
      }
    },
    {
      id: "5",
      type: "gather",
      name: "Collect Location",
      next_node_id: "6",
      data: {
        variable_name: "preferred_location",
        prompt: "Ask which location in Dubai they are interested in. Listen for specific areas like Downtown, Palm Jumeirah, Dubai Marina, etc."
      }
    },
    {
      id: "6",
      type: "gather",
      name: "Collect Property Type",
      next_node_id: "7",
      data: {
        variable_name: "property_type",
        prompt: "Ask what type of property they are looking for (apartment, villa, penthouse, etc.)."
      }
    },
    {
      id: "7",
      type: "gather",
      name: "Collect Budget",
      next_node_id: "8",
      data: {
        variable_name: "budget",
        prompt: "Ask about their budget in USD. Try to get a specific number or range."
      }
    },
    {
      id: "8",
      type: "gather",
      name: "Collect Timeframe",
      next_node_id: "9",
      data: {
        variable_name: "timeframe",
        prompt: "Ask when they are planning to make this purchase."
      }
    },
    {
      id: "9",
      type: "gather",
      name: "Collect Purpose",
      next_node_id: "10",
      data: {
        variable_name: "purpose",
        prompt: "Ask if this is for investment or personal use."
      }
    },
    {
      id: "10",
      type: "api_request",
      name: "Check Available Properties",
      next_node_id: "11",
      data: {
        method: "GET",
        url: "{{BASE_URL}}/api/properties?location={{preferred_location}}&type={{property_type}}&budget={{budget}}",
        response_variable_name: "properties_response",
        extract_variables: [
          {
            path: "matching_properties",
            variable_name: "matching_properties"
          }
        ]
      }
    },
    {
      id: "11",
      type: "condition",
      name: "Check Properties Exist",
      data: {
        condition: "{{matching_properties}} > 0",
        true_node_id: "12",
        false_node_id: "31"
      }
    },
    {
      id: "12",
      type: "gather",
      name: "Collect Preferred Time",
      next_node_id: "13",
      data: {
        variable_name: "preferred_time",
        prompt: "Ask when they would like to schedule a meeting to discuss these properties. Try to get a specific day and time."
      }
    },
    {
      id: "13",
      type: "api_request",
      name: "Check Calendar Availability",
      next_node_id: "14",
      data: {
        method: "GET",
        url: "{{BASE_URL}}/api/calendar/available_slots?time={{preferred_time}}",
        response_variable_name: "calendar_response",
        extract_variables: [
          {
            path: "available_slots",
            variable_name: "available_slots"
          }
        ]
      }
    },
    {
      id: "14",
      type: "condition",
      name: "Check Slots Available",
      data: {
        condition: "{{available_slots.length}} > 0",
        true_node_id: "15",
        false_node_id: "33"
      }
    },
    {
      id: "15",
      type: "say",
      name: "Present Available Slots",
      next_node_id: "16",
      data: {
        prompt: "Tell them the available slots: {{available_slots}}. Ask which one they would prefer."
      }
    },
    {
      id: "16",
      type: "gather",
      name: "Collect Selected Slot",
      next_node_id: "17",
      data: {
        variable_name: "selected_slot",
        prompt: "Listen for their preferred time slot choice."
      }
    },
    {
      id: "17",
      type: "api_request",
      name: "Book Calendar Slot",
      next_node_id: "18",
      data: {
        method: "POST",
        url: "{{BASE_URL}}/api/calendar/book",
        body: {
          slot: "{{selected_slot}}"
        },
        response_variable_name: "booking_response",
        extract_variables: [
          {
            path: "booking_confirmation",
            variable_name: "booking_confirmation"
          }
        ]
      }
    },
    {
      id: "18",
      type: "condition",
      name: "Check Booking Success",
      data: {
        condition: "{{booking_confirmation}} == true",
        true_node_id: "19",
        false_node_id: "34"
      }
    },
    {
      id: "19",
      type: "gather",
      name: "Collect Full Name",
      next_node_id: "20",
      data: {
        variable_name: "full_name",
        prompt: "Ask them to confirm their full name for the booking."
      }
    },
    {
      id: "20",
      type: "gather",
      name: "Collect Email",
      next_node_id: "21",
      data: {
        variable_name: "email",
        prompt: "Ask for their email address to send the confirmation. Ask them to spell it out if needed."
      }
    },
    {
      id: "21",
      type: "say",
      name: "Confirm Email",
      next_node_id: "22",
      data: {
        prompt: "Confirm their email by saying: Is your email {{email}} correct?"
      }
    },
    {
      id: "22",
      type: "gather",
      name: "Collect Email Confirmation",
      next_node_id: "23",
      data: {
        variable_name: "email_confirmation",
        prompt: "Listen for yes or no."
      }
    },
    {
      id: "23",
      type: "condition",
      name: "Check Email Confirmation",
      data: {
        condition: "{{email_confirmation}} CONTAINS 'yes'",
        true_node_id: "24",
        false_node_id: "20"
      }
    },
    {
      id: "24",
      type: "api_request",
      name: "Create CRM Lead",
      next_node_id: "25",
      data: {
        method: "POST",
        url: "{{BASE_URL}}/api/leads",
        body: {
          name: "{{full_name}}",
          phone_number: "{{customer.phone_number}}",
          email: "{{email}}",
          status: "booked",
          budget: "{{budget}}",
          property_interest: "{{property_type}}",
          location: "{{preferred_location}}",
          purpose: "{{purpose}}",
          timeframe: "{{timeframe}}"
        },
        response_variable_name: "lead_response"
      }
    },
    {
      id: "25",
      type: "say",
      name: "Confirm Booking",
      next_node_id: "26",
      data: {
        prompt: "Thank {{full_name}} for their time. Confirm that their appointment is booked for {{selected_slot}} and that a confirmation will be sent to {{email}}. Let them know that a real estate specialist will contact them with property options matching their criteria."
      }
    },
    {
      id: "26",
      type: "end_call",
      name: "End Call",
      data: {}
    },
    {
      id: "27",
      type: "say",
      name: "Ask for Better Time",
      next_node_id: "28",
      data: {
        prompt: "Apologize for the inconvenience and ask when would be a better time to call them back."
      }
    },
    {
      id: "28",
      type: "gather",
      name: "Collect Callback Time",
      next_node_id: "29",
      data: {
        variable_name: "callback_time",
        prompt: "Listen for their preferred callback time."
      }
    },
    {
      id: "29",
      type: "say",
      name: "Confirm Callback",
      next_node_id: "30",
      data: {
        prompt: "Confirm that you'll call them back at {{callback_time}}. Thank them for their time."
      }
    },
    {
      id: "30",
      type: "end_call",
      name: "End Call - Callback",
      data: {}
    },
    {
      id: "31",
      type: "say",
      name: "No Matching Properties",
      next_node_id: "32",
      data: {
        prompt: "Apologize that you don't have matching properties at the moment. Explain that you'll keep their details and contact them when suitable properties become available. Ask if they would be interested in similar properties in other areas or with different specifications."
      }
    },
    {
      id: "32",
      type: "end_call",
      name: "End Call - No Properties",
      data: {}
    },
    {
      id: "33",
      type: "say",
      name: "No Available Slots",
      next_node_id: "12",
      data: {
        prompt: "Apologize that there are no available slots at that time. Ask them to suggest another time."
      }
    },
    {
      id: "34",
      type: "say",
      name: "Booking Failed",
      next_node_id: "15",
      data: {
        prompt: "Apologize that there was an issue booking that slot. Ask them to try another slot from the available options."
      }
    }
  ]
};

/**
 * Create a workflow in Vapi
 */
async function createWorkflow() {
  try {
    console.log('Creating workflow in Vapi...');
    
    const response = await fetch(`${VAPI_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify(WORKFLOW)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error creating workflow: ${response.status} - ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('Workflow created successfully!');
    console.log('Workflow ID:', data.id);
    console.log('Workflow Name:', data.name);
    
    return data;
  } catch (error) {
    console.error('Error creating workflow:', error);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Create the workflow
    const workflow = await createWorkflow();
    
    if (!workflow) {
      console.error('Failed to create workflow');
      return;
    }
    
    console.log('\nWorkflow created successfully. Next steps:');
    console.log('1. Implement the API endpoints for properties, calendar, and leads');
    console.log('2. Update the BASE_URL in the workflow to point to your API server');
    console.log('3. Test the workflow with a sample call');
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the script
main();
