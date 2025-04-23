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

def create_tool():
    """Create a tool for searching properties"""
    print("Creating property search tool...")
    
    payload = {
        "name": "PropertySearchTool",
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
    
    print(f"Sending request to {BASE_URL}/tools with payload...")
    response = requests.post(f"{BASE_URL}/tools", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")
    
    if response.status_code not in [200, 201]:
        print(f"Error creating tool: {response.text}")
        return None
    
    tool_data = response.json()
    print(f"Tool created with ID: {tool_data.get('id')}")
    return tool_data.get('id')

def create_workflow(tool_id=None):
    """Create a real estate lead qualification workflow"""
    print("Creating real estate lead qualification workflow...")
    
    # Define the workflow with the format from the documentation
    # but without the tool integration if tool creation failed
    workflow = {
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "data": {"prompt": "Welcome to our luxury real estate service. I'd like to understand your property preferences. Is this a good time to talk?"}
            },
            {
                "id": "gather_location",
                "type": "gather",
                "data": {"variable": "location", "prompt": "Which area in Dubai are you interested in? For example, Dubai Marina, Downtown, Palm Jumeirah, etc."}
            },
            {
                "id": "gather_property_type",
                "type": "gather",
                "data": {"variable": "property_type", "prompt": "What type of property are you looking for? For example, apartment, villa, penthouse, etc."}
            },
            {
                "id": "gather_budget",
                "type": "gather",
                "data": {"variable": "budget", "prompt": "What's your budget in USD? You can give me a range or a specific amount."}
            }
        ],
        "edges": [
            {"source": "start", "target": "gather_location"},
            {"source": "gather_location", "target": "gather_property_type"},
            {"source": "gather_property_type", "target": "gather_budget"}
        ]
    }
    
    # Add tool integration if tool_id is provided
    if tool_id:
        workflow["nodes"].extend([
            {
                "id": "search_properties",
                "type": "function",
                "data": {
                    "toolId": tool_id,
                    "functionName": "searchProperties",
                    "parameters": {
                        "location": "{{location}}",
                        "property_type": "{{property_type}}",
                        "budget": "{{budget}}"
                    }
                }
            },
            {
                "id": "thank_you",
                "type": "say",
                "data": {"prompt": "Thank you for sharing your preferences. I'll help you find properties that match your criteria. A real estate specialist will contact you soon with options."}
            },
            {
                "id": "end",
                "type": "end",
                "data": {}
            }
        ])
        
        workflow["edges"].extend([
            {"source": "gather_budget", "target": "search_properties"},
            {"source": "search_properties", "target": "thank_you"},
            {"source": "thank_you", "target": "end"}
        ])
    else:
        # Simple ending without tool integration
        workflow["nodes"].extend([
            {
                "id": "thank_you",
                "type": "say",
                "data": {"prompt": "Thank you for sharing your preferences. I'll help you find properties that match your criteria. A real estate specialist will contact you soon with options."}
            },
            {
                "id": "end",
                "type": "end",
                "data": {}
            }
        ])
        
        workflow["edges"].extend([
            {"source": "gather_budget", "target": "thank_you"},
            {"source": "thank_you", "target": "end"}
        ])
    
    # Create the payload
    payload = {
        "name": "RealEstateLeadQualificationWorkflow",
        "workflow": workflow
    }
    
    # Try to add assistantId if it exists
    if ASSISTANT_ID:
        payload["assistantId"] = ASSISTANT_ID
    
    print(f"Sending request to {BASE_URL}/workflows with payload...")
    response = requests.post(f"{BASE_URL}/workflows", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")
    
    if response.status_code not in [200, 201]:
        print(f"Error creating workflow: {response.text}")
        return None
    
    workflow_data = response.json()
    print(f"Workflow created with ID: {workflow_data.get('id')}")
    return workflow_data

def main():
    """Main function"""
    print("Starting Vapi workflow creation using hybrid approach...")
    
    if not API_KEY:
        print("Error: NEXT_PRIVATE_VAPI_API_KEY environment variable not set")
        return
    
    # Try to create tool
    tool_id = create_tool()
    
    # Create workflow with or without tool integration
    workflow_data = create_workflow(tool_id)
    
    if not workflow_data:
        print("Error: Failed to create workflow")
        return
    
    print("\n=== Workflow Setup Complete ===")
    if tool_id:
        print(f"Tool ID: {tool_id}")
    else:
        print("Note: No tool was created. Workflow created without tool integration.")
    
    print(f"Workflow ID: {workflow_data.get('id')}")
    print(f"Assistant ID: {ASSISTANT_ID}")
    print("\nNext steps:")
    print("1. Go to the Vapi dashboard (https://dashboard.vapi.ai)")
    print("2. Navigate to Assistants and select your assistant")
    print("3. Assign the workflow ID to your assistant")
    print("4. Test the workflow by making a call using the assistant")

if __name__ == "__main__":
    main()
