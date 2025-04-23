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
    
    print(f"Sending request to {BASE_URL}/v1/tool with payload...")
    response = requests.post(f"{BASE_URL}/v1/tool", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")
    
    if response.status_code not in [200, 201]:
        print(f"Error creating tool: {response.text}")
        return None
    
    tool_data = response.json()
    print(f"Tool created with ID: {tool_data.get('id')}")
    return tool_data.get('id')

def create_workflow(tool_id):
    """Create a real estate lead qualification workflow"""
    print("Creating real estate lead qualification workflow...")
    
    # Define the workflow according to the documentation
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
            },
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
        ],
        "edges": [
            {"source": "start", "target": "gather_location"},
            {"source": "gather_location", "target": "gather_property_type"},
            {"source": "gather_property_type", "target": "gather_budget"},
            {"source": "gather_budget", "target": "search_properties"},
            {"source": "search_properties", "target": "thank_you"},
            {"source": "thank_you", "target": "end"}
        ]
    }
    
    # Create the payload according to the documentation
    payload = {
        "name": "RealEstateLeadQualificationWorkflow",
        "workflow": workflow,
        "assistantId": ASSISTANT_ID
    }
    
    print(f"Sending request to {BASE_URL}/v1/workflow with payload...")
    response = requests.post(f"{BASE_URL}/v1/workflow", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")
    
    if response.status_code not in [200, 201]:
        print(f"Error creating workflow: {response.text}")
        return None
    
    workflow_data = response.json()
    print(f"Workflow created with ID: {workflow_data.get('id')}")
    return workflow_data

def main():
    """Main function"""
    print("Starting Vapi workflow creation using v1 API...")
    
    if not API_KEY:
        print("Error: NEXT_PRIVATE_VAPI_API_KEY environment variable not set")
        return
    
    # Create tool
    tool_id = create_tool()
    
    if not tool_id:
        print("Error: Failed to create tool")
        return
    
    # Create workflow
    workflow_data = create_workflow(tool_id)
    
    if not workflow_data:
        print("Error: Failed to create workflow")
        return
    
    print("\n=== Workflow Setup Complete ===")
    print(f"Tool ID: {tool_id}")
    print(f"Workflow ID: {workflow_data.get('id')}")
    print(f"Assistant ID: {ASSISTANT_ID}")
    print("\nNext steps:")
    print("1. Test the workflow by making a call using the assistant")
    print("2. Monitor the call in the Vapi dashboard")

if __name__ == "__main__":
    main()
