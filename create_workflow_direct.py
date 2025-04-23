import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
API_KEY = os.getenv("NEXT_PRIVATE_VAPI_API_KEY")
BASE_URL = "https://api.vapi.ai"
ASSISTANT_ID = os.getenv("NEXT_PUBLIC_VAPI_ASSISTANT_ID", "cfaa163c-4a47-471b-a39e-95c12d0cb738")
PHONE_NUMBER_ID = os.getenv("NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID", "53cb46fd-5e37-4860-8668-7594005f872a")

# Headers for API requests
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def create_workflow():
    """Create a real estate lead qualification workflow"""
    print("Creating real estate lead qualification workflow...")

    # Define the workflow
    workflow = {
        "name": "RealEstateLeadQualificationWorkflow",
        "model": {
            "provider": "anthropic",
            "model": "claude-3-opus-20240229",
            "emotionRecognitionEnabled": True,
            "temperature": 0.7
        },
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

            # Node 9: Say - Property Search
            {
                "id": "9",
                "type": "say",
                "data": {
                    "prompt": "Thank you for providing that information. Let me check our database for properties that match your criteria."
                }
            },

            # Node 10: Say - Properties Found
            {
                "id": "10",
                "type": "say",
                "data": {
                    "prompt": "Great news! We have several properties that match your criteria. Would you like to schedule a meeting with one of our real estate specialists to discuss these options in detail?"
                }
            },

            # Node 11: Gather - Meeting Interest
            {
                "id": "11",
                "type": "input",
                "data": {
                    "variable": "meeting_interest",
                    "prompt": "Please let me know if you'd like to schedule a meeting."
                }
            },

            # Node 12: Condition - Check Meeting Interest
            {
                "id": "12",
                "type": "condition",
                "data": {
                    "condition": "{{meeting_interest}} CONTAINS 'yes' OR {{meeting_interest}} CONTAINS 'sure' OR {{meeting_interest}} CONTAINS 'okay'",
                    "true_node_id": "13",
                    "false_node_id": "24"
                }
            },

            # Node 13: Gather - Preferred Time
            {
                "id": "13",
                "type": "input",
                "data": {
                    "variable": "preferred_time",
                    "prompt": "When would you like to schedule this meeting? Please provide a day and time that works for you."
                }
            },

            # Node 14: Say - Available Slots
            {
                "id": "14",
                "type": "say",
                "data": {
                    "prompt": "We have several slots available around that time. How about tomorrow at 10:00 AM, 2:00 PM, or 4:00 PM Dubai time?"
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

            # Node 16: Say - Booking Confirmation
            {
                "id": "16",
                "type": "say",
                "data": {
                    "prompt": "Great! I've booked that slot for you. Could you please confirm your full name for our records?"
                }
            },

            # Node 17: Gather - Full Name
            {
                "id": "17",
                "type": "input",
                "data": {
                    "variable": "full_name",
                    "prompt": "Please provide your full name."
                }
            },

            # Node 18: Gather - Email
            {
                "id": "18",
                "type": "input",
                "data": {
                    "variable": "email",
                    "prompt": "Thank you, {{full_name}}. Could you please provide your email address so we can send you a confirmation? Please spell it out if needed."
                }
            },

            # Node 19: Say - Final Confirmation
            {
                "id": "19",
                "type": "say",
                "data": {
                    "prompt": "Thank you, {{full_name}}. Your appointment is booked for {{selected_slot}}. A confirmation email will be sent to {{email}}. A real estate specialist will contact you with property options matching your criteria. Is there anything else I can help you with today?"
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

            # Node 24: Say - No Meeting
            {
                "id": "24",
                "type": "say",
                "data": {
                    "prompt": "I understand you're not ready to schedule a meeting at this time. Would you like us to send you some information about the properties that match your criteria via email?"
                }
            },

            # Node 25: Gather - Email Interest
            {
                "id": "25",
                "type": "input",
                "data": {
                    "variable": "email_interest",
                    "prompt": "Please let me know if you'd like us to send you information via email."
                }
            },

            # Node 26: Condition - Check Email Interest
            {
                "id": "26",
                "type": "condition",
                "data": {
                    "condition": "{{email_interest}} CONTAINS 'yes' OR {{email_interest}} CONTAINS 'sure' OR {{email_interest}} CONTAINS 'okay'",
                    "true_node_id": "27",
                    "false_node_id": "29"
                }
            },

            # Node 27: Gather - Email for Info
            {
                "id": "27",
                "type": "input",
                "data": {
                    "variable": "email_for_info",
                    "prompt": "Could you please provide your email address so we can send you the information? Please spell it out if needed."
                }
            },

            # Node 28: Say - Email Confirmation
            {
                "id": "28",
                "type": "say",
                "data": {
                    "prompt": "Thank you. We'll send the property information to {{email_for_info}}. Is there anything else I can help you with today?"
                }
            },

            # Node 29: Say - Thank You
            {
                "id": "29",
                "type": "say",
                "data": {
                    "prompt": "Thank you for your time today. If you have any questions or would like to schedule a meeting in the future, please don't hesitate to call us back. Have a great day!"
                }
            },

            # Node 30: End - Success
            {
                "id": "30",
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
            {"source": "10", "target": "11"},
            {"source": "11", "target": "12"},
            {"source": "12", "target": "13", "condition": "true"},
            {"source": "12", "target": "24", "condition": "false"},
            {"source": "13", "target": "14"},
            {"source": "14", "target": "15"},
            {"source": "15", "target": "16"},
            {"source": "16", "target": "17"},
            {"source": "17", "target": "18"},
            {"source": "18", "target": "19"},
            {"source": "19", "target": "30"},
            {"source": "20", "target": "21"},
            {"source": "21", "target": "22"},
            {"source": "22", "target": "23"},
            {"source": "24", "target": "25"},
            {"source": "25", "target": "26"},
            {"source": "26", "target": "27", "condition": "true"},
            {"source": "26", "target": "29", "condition": "false"},
            {"source": "27", "target": "28"},
            {"source": "28", "target": "30"},
            {"source": "29", "target": "30"}
        ]
    }

    # Convert edges format from source/target to from/to
    converted_edges = []
    for edge in workflow["edges"]:
        new_edge = {
            "from": edge["source"],
            "to": edge["target"]
        }
        if "condition" in edge:
            new_edge["condition"] = {
                "type": "ai",
                "prompt": f"Check if condition '{edge['condition']}' is true"
            }
        converted_edges.append(new_edge)

    # Convert nodes format
    converted_nodes = []
    for i, node in enumerate(workflow["nodes"]):
        new_node = {
            "name": f"Node_{node['id']}",
            "type": node["type"]
        }

        # Handle different node types
        if "data" in node:
            if "prompt" in node["data"]:
                new_node["prompt"] = node["data"]["prompt"]
            if "variable" in node["data"]:
                new_node["variable"] = node["data"]["variable"]
            if "condition" in node["data"]:
                new_node["condition"] = node["data"]["condition"]
            if "true_node_id" in node["data"] and "false_node_id" in node["data"]:
                # This will be handled in the edges
                pass

        converted_nodes.append(new_node)

    # Create the workflow
    payload = {
        "name": workflow["name"],
        "nodes": converted_nodes,
        "edges": converted_edges
    }

    print(f"Sending request to {BASE_URL}/workflow with payload...")
    response = requests.post(f"{BASE_URL}/workflow", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")

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
    """Main function"""
    print("Starting workflow creation...")

    if not API_KEY:
        print("Error: NEXT_PRIVATE_VAPI_API_KEY environment variable not set")
        return

    # Create workflow
    workflow_data = create_workflow()

    if not workflow_data:
        print("Error: Failed to create workflow")
        return

    # Assign workflow to assistant
    success = assign_workflow_to_assistant(workflow_data['id'])

    if success:
        print("\n=== Workflow Setup Complete ===")
        print(f"Workflow ID: {workflow_data['id']}")
        print(f"Assistant ID: {ASSISTANT_ID}")
        print("\nNext steps:")
        print("1. Test the workflow by making a call using the assistant")
        print("2. Monitor the call in the Vapi dashboard")
    else:
        print("Workflow setup incomplete due to errors")

if __name__ == "__main__":
    main()
