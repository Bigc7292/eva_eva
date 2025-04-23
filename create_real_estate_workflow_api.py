import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
API_KEY = os.getenv("NEXT_PRIVATE_VAPI_API_KEY")
BASE_URL = "https://api.vapi.ai"
ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID", "cfaa163c-4a47-471b-a39e-95c12d0cb738")
PHONE_NUMBER_ID = os.getenv("NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID", "53cb46fd-5e37-4860-8668-7594005f872a")
API_SERVER_URL = os.getenv("BASE_URL", "http://localhost:3004")

# Headers for API requests
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def create_property_search_tool():
    """Create a tool for searching properties"""
    print("Creating property search tool...")

    payload = {
        "type": "function",
        "name": "searchProperties",
        "schema": {
            "type": "function",
            "function": {
                "name": "searchProperties",
                "description": "Searches for properties based on location, type, and budget",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string", "description": "Location in Dubai (e.g., Dubai Marina, Downtown)"},
                        "property_type": {"type": "string", "description": "Type of property (e.g., Apartment, Villa)"},
                        "budget": {"type": "string", "description": "Budget in USD (can be a range or single value)"}
                    },
                    "required": ["location", "property_type", "budget"]
                }
            }
        }
    }

    print(f"Sending request to {BASE_URL}/tool with payload: {json.dumps(payload, indent=2)}")
    response = requests.post(f"{BASE_URL}/tool", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")

    if response.status_code != 200:
        print(f"Error creating property search tool: {response.text}")
        return None

    tool_data = response.json()
    print(f"Property search tool created with ID: {tool_data['id']}")
    return tool_data['id']

def create_calendar_slots_tool():
    """Create a tool for checking available calendar slots"""
    print("Creating calendar slots tool...")

    payload = {
        "type": "function",
        "name": "getAvailableSlots",
        "schema": {
            "type": "function",
            "function": {
                "name": "getAvailableSlots",
                "description": "Gets available calendar slots based on a requested time",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "time": {"type": "string", "description": "Requested time (e.g., tomorrow, next week, April 30)"}
                    },
                    "required": ["time"]
                }
            }
        }
    }

    print(f"Sending request to {BASE_URL}/tool with payload: {json.dumps(payload, indent=2)}")
    response = requests.post(f"{BASE_URL}/tool", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")

    if response.status_code != 200:
        print(f"Error creating calendar slots tool: {response.text}")
        return None

    tool_data = response.json()
    print(f"Calendar slots tool created with ID: {tool_data['id']}")
    return tool_data['id']

def create_booking_tool():
    """Create a tool for booking a calendar slot"""
    print("Creating booking tool...")

    payload = {
        "type": "function",
        "name": "bookCalendarSlot",
        "schema": {
            "type": "function",
            "function": {
                "name": "bookCalendarSlot",
                "description": "Books a calendar slot",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "slot": {"type": "string", "description": "Selected time slot (e.g., Monday, April 29 at 10:00 AM)"}
                    },
                    "required": ["slot"]
                }
            }
        }
    }

    print(f"Sending request to {BASE_URL}/tool with payload: {json.dumps(payload, indent=2)}")
    response = requests.post(f"{BASE_URL}/tool", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")

    if response.status_code != 200:
        print(f"Error creating booking tool: {response.text}")
        return None

    tool_data = response.json()
    print(f"Booking tool created with ID: {tool_data['id']}")
    return tool_data['id']

def create_lead_tool():
    """Create a tool for creating a lead in the CRM"""
    print("Creating lead tool...")

    payload = {
        "type": "function",
        "name": "createLead",
        "schema": {
            "type": "function",
            "function": {
                "name": "createLead",
                "description": "Creates a lead in the CRM",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Full name of the lead"},
                        "phone_number": {"type": "string", "description": "Phone number of the lead"},
                        "email": {"type": "string", "description": "Email address of the lead"},
                        "status": {"type": "string", "description": "Status of the lead (e.g., new, booked)"},
                        "budget": {"type": "string", "description": "Budget in USD"},
                        "property_interest": {"type": "string", "description": "Type of property interested in"},
                        "location": {"type": "string", "description": "Preferred location"},
                        "purpose": {"type": "string", "description": "Purpose (investment or personal use)"},
                        "timeframe": {"type": "string", "description": "Timeframe for purchase"}
                    },
                    "required": ["name", "phone_number", "email"]
                }
            }
        }
    }

    print(f"Sending request to {BASE_URL}/tool with payload: {json.dumps(payload, indent=2)}")
    response = requests.post(f"{BASE_URL}/tool", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")

    if response.status_code != 200:
        print(f"Error creating lead tool: {response.text}")
        return None

    tool_data = response.json()
    print(f"Lead tool created with ID: {tool_data['id']}")
    return tool_data['id']

def create_real_estate_workflow(property_tool_id, calendar_tool_id, booking_tool_id, lead_tool_id):
    """Create the real estate lead qualification workflow"""
    print("Creating real estate lead qualification workflow...")

    payload = {
        "name": "RealEstateLeadQualificationWorkflow",
        "assistantId": ASSISTANT_ID,
        "phoneNumberId": PHONE_NUMBER_ID,
        "workflow": {
            "nodes": [
                # Node 1: Start Call
                {
                    "id": "1",
                    "type": "start",
                    "data": {
                        "prompt": "You are a real estate assistant for a luxury property company in Dubai. Start the call with a personalized greeting and ask if it's a good time to talk."
                    }
                },

                # Node 2: Gather - Good Time
                {
                    "id": "2",
                    "type": "input",
                    "data": {
                        "variable": "is_good_time",
                        "prompt": "Listen carefully to their response about whether it's a good time to talk."
                    }
                },

                # Node 3: Condition - Check Good Time
                {
                    "id": "3",
                    "type": "condition",
                    "data": {
                        "condition": "{{is_good_time}} CONTAINS 'yes' OR {{is_good_time}} CONTAINS 'sure' OR {{is_good_time}} CONTAINS 'okay' OR {{is_good_time}} CONTAINS 'fine'",
                        "true_node_id": "4",
                        "false_node_id": "20"
                    }
                },

                # Node 4: Gather - Location
                {
                    "id": "4",
                    "type": "input",
                    "data": {
                        "variable": "preferred_location",
                        "prompt": "Great! Which location in Dubai are you interested in? For example, Dubai Marina, Downtown Dubai, Palm Jumeirah, etc."
                    }
                },

                # Node 5: Gather - Property Type
                {
                    "id": "5",
                    "type": "input",
                    "data": {
                        "variable": "property_type",
                        "prompt": "What type of property are you looking for? For example, apartment, villa, penthouse, etc."
                    }
                },

                # Node 6: Gather - Budget
                {
                    "id": "6",
                    "type": "input",
                    "data": {
                        "variable": "budget",
                        "prompt": "What's your budget in USD? You can give me a range or a specific amount."
                    }
                },

                # Node 7: Gather - Timeframe
                {
                    "id": "7",
                    "type": "input",
                    "data": {
                        "variable": "timeframe",
                        "prompt": "When are you planning to make this purchase? For example, within 3 months, 6 months, etc."
                    }
                },

                # Node 8: Gather - Purpose
                {
                    "id": "8",
                    "type": "input",
                    "data": {
                        "variable": "purpose",
                        "prompt": "Is this property for investment or personal use?"
                    }
                },

                # Node 9: Function - Search Properties
                {
                    "id": "9",
                    "type": "function",
                    "data": {
                        "toolId": property_tool_id,
                        "functionName": "searchProperties",
                        "parameters": {
                            "location": "{{preferred_location}}",
                            "property_type": "{{property_type}}",
                            "budget": "{{budget}}"
                        },
                        "result_variable": "property_search"
                    }
                },

                # Node 10: Condition - Check Properties Exist
                {
                    "id": "10",
                    "type": "condition",
                    "data": {
                        "condition": "{{property_search.matching_properties}} > 0",
                        "true_node_id": "11",
                        "false_node_id": "24"
                    }
                },

                # Node 11: Gather - Preferred Time
                {
                    "id": "11",
                    "type": "input",
                    "data": {
                        "variable": "preferred_time",
                        "prompt": "Great news! We have {{property_search.matching_properties}} properties that match your criteria. When would you like to schedule a meeting to discuss these properties? Please provide a day and time that works for you."
                    }
                },

                # Node 12: Function - Get Available Slots
                {
                    "id": "12",
                    "type": "function",
                    "data": {
                        "toolId": calendar_tool_id,
                        "functionName": "getAvailableSlots",
                        "parameters": {
                            "time": "{{preferred_time}}"
                        },
                        "result_variable": "calendar_slots"
                    }
                },

                # Node 13: Condition - Check Slots Available
                {
                    "id": "13",
                    "type": "condition",
                    "data": {
                        "condition": "{{calendar_slots.available_slots.length}} > 0",
                        "true_node_id": "14",
                        "false_node_id": "26"
                    }
                },

                # Node 14: Say - Present Available Slots
                {
                    "id": "14",
                    "type": "say",
                    "data": {
                        "prompt": "We have the following slots available: {{calendar_slots.available_slots}}. Which one would you prefer?"
                    }
                },

                # Node 15: Gather - Selected Slot
                {
                    "id": "15",
                    "type": "input",
                    "data": {
                        "variable": "selected_slot",
                        "prompt": "Please choose one of the available slots."
                    }
                },

                # Node 16: Function - Book Slot
                {
                    "id": "16",
                    "type": "function",
                    "data": {
                        "toolId": booking_tool_id,
                        "functionName": "bookCalendarSlot",
                        "parameters": {
                            "slot": "{{selected_slot}}"
                        },
                        "result_variable": "booking_result"
                    }
                },

                # Node 17: Condition - Check Booking Success
                {
                    "id": "17",
                    "type": "condition",
                    "data": {
                        "condition": "{{booking_result.booking_confirmation}} == true",
                        "true_node_id": "18",
                        "false_node_id": "27"
                    }
                },

                # Node 18: Gather - Full Name
                {
                    "id": "18",
                    "type": "input",
                    "data": {
                        "variable": "full_name",
                        "prompt": "Great! I've booked that slot for you. Could you please confirm your full name for our records?"
                    }
                },

                # Node 19: Gather - Email
                {
                    "id": "19",
                    "type": "input",
                    "data": {
                        "variable": "email",
                        "prompt": "Thank you, {{full_name}}. Could you please provide your email address so we can send you a confirmation? Please spell it out if needed."
                    }
                },

                # Node 20: Say - Not a Good Time
                {
                    "id": "20",
                    "type": "say",
                    "data": {
                        "prompt": "I understand this isn't a good time to talk. When would be a better time for me to call you back?"
                    }
                },

                # Node 21: Gather - Callback Time
                {
                    "id": "21",
                    "type": "input",
                    "data": {
                        "variable": "callback_time",
                        "prompt": "Please let me know when would be convenient for you."
                    }
                },

                # Node 22: Say - Confirm Callback
                {
                    "id": "22",
                    "type": "say",
                    "data": {
                        "prompt": "Thank you. I'll make sure someone calls you back at {{callback_time}}. Have a great day!"
                    }
                },

                # Node 23: End - Callback
                {
                    "id": "23",
                    "type": "end",
                    "data": {}
                },

                # Node 24: Say - No Properties
                {
                    "id": "24",
                    "type": "say",
                    "data": {
                        "prompt": "I'm sorry, but we don't have any properties that match your criteria at the moment. We'll keep your details on file and contact you when suitable properties become available. Would you be interested in similar properties in other areas or with different specifications?"
                    }
                },

                # Node 25: End - No Properties
                {
                    "id": "25",
                    "type": "end",
                    "data": {}
                },

                # Node 26: Say - No Slots
                {
                    "id": "26",
                    "type": "say",
                    "data": {
                        "prompt": "I'm sorry, but we don't have any available slots at that time. Could you suggest another time that might work for you?"
                    }
                },

                # Node 27: Say - Booking Failed
                {
                    "id": "27",
                    "type": "say",
                    "data": {
                        "prompt": "I'm sorry, but there was an issue booking that slot. Could you please try another slot from the available options?"
                    }
                },

                # Node 28: Say - Confirm Email
                {
                    "id": "28",
                    "type": "say",
                    "data": {
                        "prompt": "Is your email {{email}} correct?"
                    }
                },

                # Node 29: Gather - Email Confirmation
                {
                    "id": "29",
                    "type": "input",
                    "data": {
                        "variable": "email_confirmation",
                        "prompt": "Please confirm with yes or no."
                    }
                },

                # Node 30: Condition - Check Email Confirmation
                {
                    "id": "30",
                    "type": "condition",
                    "data": {
                        "condition": "{{email_confirmation}} CONTAINS 'yes'",
                        "true_node_id": "31",
                        "false_node_id": "19"
                    }
                },

                # Node 31: Function - Create Lead
                {
                    "id": "31",
                    "type": "function",
                    "data": {
                        "toolId": lead_tool_id,
                        "functionName": "createLead",
                        "parameters": {
                            "name": "{{full_name}}",
                            "phone_number": "{{customer.phone_number}}",
                            "email": "{{email}}",
                            "status": "booked",
                            "budget": "{{budget}}",
                            "property_interest": "{{property_type}}",
                            "location": "{{preferred_location}}",
                            "purpose": "{{purpose}}",
                            "timeframe": "{{timeframe}}"
                        },
                        "result_variable": "lead_result"
                    }
                },

                # Node 32: Say - Confirm Booking
                {
                    "id": "32",
                    "type": "say",
                    "data": {
                        "prompt": "Thank you, {{full_name}}. Your appointment is booked for {{selected_slot}}. A confirmation email has been sent to {{email}}. A real estate specialist will contact you with property options matching your criteria. Is there anything else I can help you with today?"
                    }
                },

                # Node 33: End - Success
                {
                    "id": "33",
                    "type": "end",
                    "data": {}
                }
            ],
            "edges": [
                {"source": "1", "target": "2"},
                {"source": "2", "target": "3"},
                {"source": "3", "target": "4", "condition": "true"},
                {"source": "3", "target": "20", "condition": "false"},
                {"source": "4", "target": "5"},
                {"source": "5", "target": "6"},
                {"source": "6", "target": "7"},
                {"source": "7", "target": "8"},
                {"source": "8", "target": "9"},
                {"source": "9", "target": "10"},
                {"source": "10", "target": "11", "condition": "true"},
                {"source": "10", "target": "24", "condition": "false"},
                {"source": "11", "target": "12"},
                {"source": "12", "target": "13"},
                {"source": "13", "target": "14", "condition": "true"},
                {"source": "13", "target": "26", "condition": "false"},
                {"source": "14", "target": "15"},
                {"source": "15", "target": "16"},
                {"source": "16", "target": "17"},
                {"source": "17", "target": "18", "condition": "true"},
                {"source": "17", "target": "27", "condition": "false"},
                {"source": "18", "target": "19"},
                {"source": "19", "target": "28"},
                {"source": "20", "target": "21"},
                {"source": "21", "target": "22"},
                {"source": "22", "target": "23"},
                {"source": "24", "target": "25"},
                {"source": "26", "target": "11"},
                {"source": "27", "target": "14"},
                {"source": "28", "target": "29"},
                {"source": "29", "target": "30"},
                {"source": "30", "target": "31", "condition": "true"},
                {"source": "30", "target": "19", "condition": "false"},
                {"source": "31", "target": "32"},
                {"source": "32", "target": "33"}
            ]
        }
    }

    response = requests.post(f"{BASE_URL}/workflow", headers=headers, json=payload)

    if response.status_code != 200:
        print(f"Error creating workflow: {response.text}")
        return None

    workflow_data = response.json()
    print(f"Workflow created with ID: {workflow_data['id']}")
    return workflow_data

def assign_workflow_to_assistant(workflow_id):
    """Assign the workflow to the assistant"""
    print(f"Assigning workflow {workflow_id} to assistant {ASSISTANT_ID}...")

    # Update the assistant with the workflow ID
    update_payload = {
        "workflow_id": workflow_id
    }

    response = requests.patch(f"{BASE_URL}/assistants/{ASSISTANT_ID}",
                             headers=headers,
                             json=update_payload)

    if response.status_code != 200:
        print(f"Error updating assistant: {response.text}")
        return False

    print(f"Successfully assigned workflow to assistant {ASSISTANT_ID}")
    return True

def main():
    """Main function to create tools and workflow"""
    print("Starting Real Estate Lead Qualification Workflow creation...")

    if not API_KEY:
        print("Error: VAPI_PRIVATE_KEY environment variable not set")
        return

    if not ASSISTANT_ID:
        print("Error: VAPI_ASSISTANT_ID environment variable not set")
        return

    # Create tools
    property_tool_id = create_property_search_tool()
    calendar_tool_id = create_calendar_slots_tool()
    booking_tool_id = create_booking_tool()
    lead_tool_id = create_lead_tool()

    if not all([property_tool_id, calendar_tool_id, booking_tool_id, lead_tool_id]):
        print("Error: Failed to create one or more tools")
        return

    # Create workflow
    workflow_data = create_real_estate_workflow(
        property_tool_id, calendar_tool_id, booking_tool_id, lead_tool_id
    )

    if not workflow_data:
        print("Error: Failed to create workflow")
        return

    # Assign workflow to assistant
    success = assign_workflow_to_assistant(workflow_data['id'])

    if success:
        print("\n=== Workflow Setup Complete ===")
        print(f"Workflow ID: {workflow_data['id']}")
        print(f"Assistant ID: {ASSISTANT_ID}")
        print("\nTools created:")
        print(f"- Property Search Tool: {property_tool_id}")
        print(f"- Calendar Slots Tool: {calendar_tool_id}")
        print(f"- Booking Tool: {booking_tool_id}")
        print(f"- Lead Tool: {lead_tool_id}")
        print("\nNext steps:")
        print("1. Test the workflow by making a call using the assistant")
        print("2. Monitor the call in the Vapi dashboard")
        print("3. Check your API server logs for tool invocations")
    else:
        print("Workflow setup incomplete due to errors")

if __name__ == "__main__":
    main()
