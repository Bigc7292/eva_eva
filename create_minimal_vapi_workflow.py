import requests
import json

# Configuration - Direct token inclusion
API_KEY = "d1529b85-51d5-47c0-9332-a73d40f7d62b"  # Your Vapi private API key
BASE_URL = "https://api.vapi.ai"
ASSISTANT_ID = "cfaa163c-4a47-471b-a39e-95c12d0cb738"

# Headers for API requests
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def create_workflow():
    """Create a minimal real estate workflow"""
    print("Creating minimal real estate workflow...")

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
                "prompt": "Hello, I'm a real estate assistant for a luxury property company in Dubai."
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
    print(f"Workflow created with ID: {workflow_data.get('id')}")
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
    print("Starting minimal Vapi workflow creation...")

    # Create workflow
    workflow_data = create_workflow()

    if not workflow_data:
        print("Error: Failed to create workflow")
        return

    # Try to assign workflow to assistant
    workflow_id = workflow_data.get('id')
    success = assign_workflow_to_assistant(workflow_id)

    print("\n=== Workflow Setup Complete ===")
    print(f"Workflow ID: {workflow_id}")
    print(f"Assistant ID: {ASSISTANT_ID}")

    if success:
        print("\nWorkflow successfully assigned to assistant!")
        print("\nNext steps:")
        print("1. Test the workflow by making a call using the assistant")
        print("2. Monitor the call in the Vapi dashboard")
    else:
        print("\nCould not assign workflow to assistant.")
        print("\nNext steps:")
        print("1. Go to the Vapi dashboard (https://dashboard.vapi.ai)")
        print("2. Navigate to Assistants and select your assistant")
        print("3. Manually assign the workflow ID to your assistant")
        print("4. Test the workflow by making a call using the assistant")

if __name__ == "__main__":
    main()
