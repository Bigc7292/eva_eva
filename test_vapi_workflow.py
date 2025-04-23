import requests
import json
import os
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
API_KEY = os.getenv("NEXT_PRIVATE_VAPI_API_KEY")
BASE_URL = "https://api.vapi.ai"
ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID", "cfaa163c-4a47-471b-a39e-95c12d0cb738")
PHONE_NUMBER_ID = os.getenv("NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID", "53cb46fd-5e37-4860-8668-7594005f872a")

# Headers for API requests
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def list_workflows():
    """List all workflows in the Vapi account"""
    print("Listing all workflows...")

    response = requests.get(f"{BASE_URL}/workflow", headers=headers)

    if response.status_code != 200:
        print(f"Error listing workflows: {response.text}")
        return None

    workflows = response.json()
    print(f"Found {len(workflows)} workflows:")

    for workflow in workflows:
        print(f"- {workflow['name']} (ID: {workflow['id']})")

    return workflows

def get_workflow_details(workflow_id):
    """Get details of a specific workflow"""
    print(f"Getting details for workflow {workflow_id}...")

    response = requests.get(f"{BASE_URL}/workflow/{workflow_id}", headers=headers)

    if response.status_code != 200:
        print(f"Error getting workflow details: {response.text}")
        return None

    workflow = response.json()
    print(f"Workflow Name: {workflow['name']}")
    print(f"Created At: {workflow.get('createdAt', 'N/A')}")

    # Count nodes by type
    node_types = {}
    for node in workflow['workflow']['nodes']:
        node_type = node['type']
        node_types[node_type] = node_types.get(node_type, 0) + 1

    print("Node Types:")
    for node_type, count in node_types.items():
        print(f"- {node_type}: {count}")

    return workflow

def check_assistant_workflow(assistant_id):
    """Check if the assistant has a workflow assigned"""
    print(f"Checking workflow for assistant {assistant_id}...")

    response = requests.get(f"{BASE_URL}/assistants/{assistant_id}", headers=headers)

    if response.status_code != 200:
        print(f"Error getting assistant: {response.text}")
        return None

    assistant = response.json()
    workflow_id = assistant.get('workflow_id')

    if workflow_id:
        print(f"✅ Assistant has workflow assigned: {workflow_id}")
    else:
        print("❌ Assistant does not have a workflow assigned")

    return workflow_id

def make_test_call(phone_number):
    """Make a test call using the assistant"""
    print(f"Making test call to {phone_number}...")

    payload = {
        "type": "outboundPhoneCall",
        "assistantId": ASSISTANT_ID,
        "phoneNumberId": PHONE_NUMBER_ID,
        "customer": {
            "number": phone_number
        },
        "name": f"WorkflowTest_{int(time.time())}"
    }

    response = requests.post(f"{BASE_URL}/call/phone", headers=headers, json=payload)

    if response.status_code != 200:
        print(f"Error making call: {response.text}")
        return None

    call_data = response.json()
    print(f"✅ Call initiated successfully")
    print(f"Call ID: {call_data['id']}")
    print(f"Status: {call_data['status']}")

    return call_data

def check_call_status(call_id):
    """Check the status of a call"""
    print(f"Checking status for call {call_id}...")

    response = requests.get(f"{BASE_URL}/call/{call_id}", headers=headers)

    if response.status_code != 200:
        print(f"Error checking call status: {response.text}")
        return None

    call_data = response.json()
    print(f"Call Status: {call_data['status']}")

    return call_data

def main():
    """Main function to test workflow"""
    print("Starting workflow tests...")

    if not API_KEY:
        print("Error: VAPI_PRIVATE_KEY environment variable not set")
        return

    if not ASSISTANT_ID:
        print("Error: VAPI_ASSISTANT_ID environment variable not set")
        return

    # Check if assistant has workflow
    workflow_id = check_assistant_workflow(ASSISTANT_ID)

    if not workflow_id:
        print("No workflow assigned to assistant")

        # List all workflows
        workflows = list_workflows()

        if workflows:
            print("\nSelect a workflow to assign to the assistant:")

            for i, workflow in enumerate(workflows):
                print(f"{i+1}. {workflow['name']} (ID: {workflow['id']})")

            selection = input("\nEnter workflow number to assign: ")

            try:
                selected_idx = int(selection.strip()) - 1
                if selected_idx < 0 or selected_idx >= len(workflows):
                    print("Invalid selection")
                    return

                workflow_id = workflows[selected_idx]['id']

                # Assign workflow to assistant
                update_payload = {
                    "workflow_id": workflow_id
                }

                response = requests.patch(f"{BASE_URL}/assistants/{ASSISTANT_ID}",
                                         headers=headers,
                                         json=update_payload)

                if response.status_code != 200:
                    print(f"Error updating assistant: {response.text}")
                    return

                print(f"✅ Successfully assigned workflow {workflow_id} to assistant {ASSISTANT_ID}")
            except ValueError:
                print("Invalid selection. Please enter a number.")
                return

    # Get workflow details
    if workflow_id:
        workflow = get_workflow_details(workflow_id)

        if not workflow:
            print("Error getting workflow details")
            return

    # Ask if user wants to make a test call
    make_call = input("\nDo you want to make a test call? (y/n): ")

    if make_call.lower() == 'y':
        phone_number = input("Enter phone number to call: ")

        if not phone_number:
            print("Phone number is required")
            return

        # Make test call
        call_data = make_test_call(phone_number)

        if not call_data:
            print("Error making test call")
            return

        # Wait 10 seconds and check call status
        print("\nWaiting 10 seconds to check call status...")
        time.sleep(10)

        check_call_status(call_data['id'])

        print("\nTest call initiated. Check the Vapi dashboard for call details and recordings.")

    print("\nWorkflow tests completed")

if __name__ == "__main__":
    main()
