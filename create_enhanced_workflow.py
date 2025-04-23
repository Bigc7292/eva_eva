import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
API_KEY = os.getenv("NEXT_PRIVATE_VAPI_API_KEY")
BASE_URL = "https://api.vapi.ai"
ASSISTANT_ID = "cfaa163c-4a47-471b-a39e-95c12d0cb738"

# Headers for API requests
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def create_workflow():
    """Create a real estate lead qualification workflow"""
    print("Creating real estate lead qualification workflow...")
    
    # Define the workflow exactly as per the format provided
    payload = {
        "nodes": [
            # Start node
            {
                "type": "start",
                "name": "Start_Call",
                "prompt": "You are a real estate assistant for a luxury property company in Dubai. Start the call with a personalized greeting and ask if it's a good time to talk."
            },
            
            # Gather good time
            {
                "type": "gather",
                "name": "Gather_Good_Time",
                "variable": "is_good_time",
                "prompt": "Listen carefully to their response about whether it's a good time to talk."
            },
            
            # Check good time
            {
                "type": "condition",
                "name": "Check_Good_Time",
                "condition": {
                    "type": "logic",
                    "expression": "{{is_good_time}} CONTAINS 'yes' OR {{is_good_time}} CONTAINS 'sure' OR {{is_good_time}} CONTAINS 'okay' OR {{is_good_time}} CONTAINS 'fine'"
                }
            },
            
            # Gather location
            {
                "type": "gather",
                "name": "Gather_Location",
                "variable": "preferred_location",
                "prompt": "Great! Which location in Dubai are you interested in? For example, Dubai Marina, Downtown Dubai, Palm Jumeirah, etc."
            },
            
            # Gather property type
            {
                "type": "gather",
                "name": "Gather_Property_Type",
                "variable": "property_type",
                "prompt": "What type of property are you looking for? For example, apartment, villa, penthouse, etc."
            },
            
            # Gather budget
            {
                "type": "gather",
                "name": "Gather_Budget",
                "variable": "budget",
                "prompt": "What's your budget in USD? You can give me a range or a specific amount."
            },
            
            # Gather timeframe
            {
                "type": "gather",
                "name": "Gather_Timeframe",
                "variable": "timeframe",
                "prompt": "When are you planning to make this purchase? For example, within 3 months, 6 months, etc."
            },
            
            # Gather purpose
            {
                "type": "gather",
                "name": "Gather_Purpose",
                "variable": "purpose",
                "prompt": "Is this property for investment or personal use?"
            },
            
            # Say property search
            {
                "type": "say",
                "name": "Say_Property_Search",
                "prompt": "Thank you for providing that information. Let me check our database for properties that match your criteria."
            },
            
            # Say properties found
            {
                "type": "say",
                "name": "Say_Properties_Found",
                "prompt": "Great news! We have several properties that match your criteria. Would you like to schedule a meeting with one of our real estate specialists to discuss these options in detail?"
            },
            
            # Gather meeting interest
            {
                "type": "gather",
                "name": "Gather_Meeting_Interest",
                "variable": "meeting_interest",
                "prompt": "Please let me know if you'd like to schedule a meeting."
            },
            
            # Check meeting interest
            {
                "type": "condition",
                "name": "Check_Meeting_Interest",
                "condition": {
                    "type": "logic",
                    "expression": "{{meeting_interest}} CONTAINS 'yes' OR {{meeting_interest}} CONTAINS 'sure' OR {{meeting_interest}} CONTAINS 'okay'"
                }
            },
            
            # Gather preferred time
            {
                "type": "gather",
                "name": "Gather_Preferred_Time",
                "variable": "preferred_time",
                "prompt": "When would you like to schedule this meeting? Please provide a day and time that works for you."
            },
            
            # Say available slots
            {
                "type": "say",
                "name": "Say_Available_Slots",
                "prompt": "We have several slots available around that time. How about tomorrow at 10:00 AM, 2:00 PM, or 4:00 PM Dubai time?"
            },
            
            # Gather selected slot
            {
                "type": "gather",
                "name": "Gather_Selected_Slot",
                "variable": "selected_slot",
                "prompt": "Please choose one of the available slots."
            },
            
            # Say booking confirmation
            {
                "type": "say",
                "name": "Say_Booking_Confirmation",
                "prompt": "Great! I've booked that slot for you. Could you please confirm your full name for our records?"
            },
            
            # Gather full name
            {
                "type": "gather",
                "name": "Gather_Full_Name",
                "variable": "full_name",
                "prompt": "Please provide your full name."
            },
            
            # Gather email
            {
                "type": "gather",
                "name": "Gather_Email",
                "variable": "email",
                "prompt": "Thank you, {{full_name}}. Could you please provide your email address so we can send you a confirmation? Please spell it out if needed."
            },
            
            # Say final confirmation
            {
                "type": "say",
                "name": "Say_Final_Confirmation",
                "prompt": "Thank you, {{full_name}}. Your appointment is booked for {{selected_slot}}. A confirmation email will be sent to {{email}}. A real estate specialist will contact you with property options matching your criteria. Is there anything else I can help you with today?"
            },
            
            # Say not a good time
            {
                "type": "say",
                "name": "Say_Not_Good_Time",
                "prompt": "I understand this isn't a good time to talk. When would be a better time for me to call you back?"
            },
            
            # Gather callback time
            {
                "type": "gather",
                "name": "Gather_Callback_Time",
                "variable": "callback_time",
                "prompt": "Please let me know when would be convenient for you."
            },
            
            # Say confirm callback
            {
                "type": "say",
                "name": "Say_Confirm_Callback",
                "prompt": "Thank you. I'll make sure someone calls you back at {{callback_time}}. Have a great day!"
            },
            
            # End callback
            {
                "type": "end",
                "name": "End_Callback"
            },
            
            # Say no meeting
            {
                "type": "say",
                "name": "Say_No_Meeting",
                "prompt": "I understand you're not ready to schedule a meeting at this time. Would you like us to send you some information about the properties that match your criteria via email?"
            },
            
            # Gather email interest
            {
                "type": "gather",
                "name": "Gather_Email_Interest",
                "variable": "email_interest",
                "prompt": "Please let me know if you'd like us to send you information via email."
            },
            
            # Check email interest
            {
                "type": "condition",
                "name": "Check_Email_Interest",
                "condition": {
                    "type": "logic",
                    "expression": "{{email_interest}} CONTAINS 'yes' OR {{email_interest}} CONTAINS 'sure' OR {{email_interest}} CONTAINS 'okay'"
                }
            },
            
            # Gather email for info
            {
                "type": "gather",
                "name": "Gather_Email_For_Info",
                "variable": "email_for_info",
                "prompt": "Could you please provide your email address so we can send you the information? Please spell it out if needed."
            },
            
            # Say email confirmation
            {
                "type": "say",
                "name": "Say_Email_Confirmation",
                "prompt": "Thank you. We'll send the property information to {{email_for_info}}. Is there anything else I can help you with today?"
            },
            
            # Say thank you
            {
                "type": "say",
                "name": "Say_Thank_You",
                "prompt": "Thank you for your time today. If you have any questions or would like to schedule a meeting in the future, please don't hesitate to call us back. Have a great day!"
            },
            
            # End success
            {
                "type": "end",
                "name": "End_Success"
            }
        ],
        "name": "RealEstateLeadQualificationWorkflow",
        "edges": [
            {"from": "Start_Call", "to": "Gather_Good_Time"},
            {"from": "Gather_Good_Time", "to": "Check_Good_Time"},
            {"from": "Check_Good_Time", "to": "Gather_Location", "condition": {"type": "logic", "expression": "true"}},
            {"from": "Check_Good_Time", "to": "Say_Not_Good_Time", "condition": {"type": "logic", "expression": "false"}},
            {"from": "Gather_Location", "to": "Gather_Property_Type"},
            {"from": "Gather_Property_Type", "to": "Gather_Budget"},
            {"from": "Gather_Budget", "to": "Gather_Timeframe"},
            {"from": "Gather_Timeframe", "to": "Gather_Purpose"},
            {"from": "Gather_Purpose", "to": "Say_Property_Search"},
            {"from": "Say_Property_Search", "to": "Say_Properties_Found"},
            {"from": "Say_Properties_Found", "to": "Gather_Meeting_Interest"},
            {"from": "Gather_Meeting_Interest", "to": "Check_Meeting_Interest"},
            {"from": "Check_Meeting_Interest", "to": "Gather_Preferred_Time", "condition": {"type": "logic", "expression": "true"}},
            {"from": "Check_Meeting_Interest", "to": "Say_No_Meeting", "condition": {"type": "logic", "expression": "false"}},
            {"from": "Gather_Preferred_Time", "to": "Say_Available_Slots"},
            {"from": "Say_Available_Slots", "to": "Gather_Selected_Slot"},
            {"from": "Gather_Selected_Slot", "to": "Say_Booking_Confirmation"},
            {"from": "Say_Booking_Confirmation", "to": "Gather_Full_Name"},
            {"from": "Gather_Full_Name", "to": "Gather_Email"},
            {"from": "Gather_Email", "to": "Say_Final_Confirmation"},
            {"from": "Say_Final_Confirmation", "to": "End_Success"},
            {"from": "Say_Not_Good_Time", "to": "Gather_Callback_Time"},
            {"from": "Gather_Callback_Time", "to": "Say_Confirm_Callback"},
            {"from": "Say_Confirm_Callback", "to": "End_Callback"},
            {"from": "Say_No_Meeting", "to": "Gather_Email_Interest"},
            {"from": "Gather_Email_Interest", "to": "Check_Email_Interest"},
            {"from": "Check_Email_Interest", "to": "Gather_Email_For_Info", "condition": {"type": "logic", "expression": "true"}},
            {"from": "Check_Email_Interest", "to": "Say_Thank_You", "condition": {"type": "logic", "expression": "false"}},
            {"from": "Gather_Email_For_Info", "to": "Say_Email_Confirmation"},
            {"from": "Say_Email_Confirmation", "to": "End_Success"},
            {"from": "Say_Thank_You", "to": "End_Success"}
        ],
        "model": {
            "provider": "anthropic",
            "model": "claude-3-opus-20240229",
            "emotionRecognitionEnabled": True,
            "temperature": 0.7
        }
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
    print("Starting enhanced workflow creation...")
    
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
