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
    """Create a minimal workflow based on the example"""
    print("Creating minimal workflow...")

    # Define a minimal workflow based on the example format
    payload = {
        "nodes": [
            {
                "type": "start",
                "name": "Start"
            },
            {
                "type": "say",
                "name": "Greeting",
                "exact": "Hello, I'm a real estate assistant for a luxury property company in Dubai."
            },
            {
                "type": "end",
                "name": "End"
            }
        ],
        "name": "MinimalRealEstateWorkflow",
        "edges": [
            {
                "from": "Start",
                "to": "Greeting"
            },
            {
                "from": "Greeting",
                "to": "End"
            }
        ]
    }

    print(f"Sending request to {BASE_URL}/workflow with payload...")
    response = requests.post(f"{BASE_URL}/workflow", headers=headers, json=payload)
    print(f"Response status code: {response.status_code}")

    if response.status_code not in [200, 201]:
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
    print("Starting minimal workflow creation...")

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
