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
    """Create a real estate lead qualification workflow"""
    print("Creating real estate lead qualification workflow...")
    
    # Define the workflow with the format that works
    payload = {
        "nodes": [
            # Start node
            {
                "type": "start",
                "name": "Start"
            },
            
            # Greeting
            {
                "type": "say",
                "name": "Greeting",
                "prompt": "Hello, I'm a real estate assistant for a luxury property company in Dubai. I'd like to understand your property preferences to help you find the perfect home. Is this a good time to talk?"
            },
            
            # Gather location
            {
                "type": "gather",
                "name": "GatherLocation",
                "prompt": "Which area in Dubai are you interested in? For example, Dubai Marina, Downtown, Palm Jumeirah, etc."
            },
            
            # Gather property type
            {
                "type": "gather",
                "name": "GatherPropertyType",
                "prompt": "What type of property are you looking for? For example, apartment, villa, penthouse, etc."
            },
            
            # Gather budget
            {
                "type": "gather",
                "name": "GatherBudget",
                "prompt": "What's your budget in USD? You can give me a range or a specific amount."
            },
            
            # Gather timeframe
            {
                "type": "gather",
                "name": "GatherTimeframe",
                "prompt": "When are you planning to make this purchase? For example, within 3 months, 6 months, etc."
            },
            
            # Gather purpose
            {
                "type": "gather",
                "name": "GatherPurpose",
                "prompt": "Is this property for investment or personal use?"
            },
            
            # Thank you
            {
                "type": "say",
                "name": "ThankYou",
                "prompt": "Thank you for sharing your preferences. I'll help you find properties that match your criteria. A real estate specialist will contact you soon with options."
            },
            
            # End call
            {
                "type": "end",
                "name": "EndCall"
            }
        ],
        "name": "RealEstateLeadQualificationWorkflow",
        "edges": [
            {
                "from": "Start",
                "to": "Greeting"
            },
            {
                "from": "Greeting",
                "to": "GatherLocation"
            },
            {
                "from": "GatherLocation",
                "to": "GatherPropertyType"
            },
            {
                "from": "GatherPropertyType",
                "to": "GatherBudget"
            },
            {
                "from": "GatherBudget",
                "to": "GatherTimeframe"
            },
            {
                "from": "GatherTimeframe",
                "to": "GatherPurpose"
            },
            {
                "from": "GatherPurpose",
                "to": "ThankYou"
            },
            {
                "from": "ThankYou",
                "to": "EndCall"
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

def main():
    """Main function"""
    print("Starting real estate workflow creation...")
    
    # Create workflow
    workflow_data = create_workflow()
    
    if not workflow_data:
        print("Error: Failed to create workflow")
        return
    
    print("\n=== Workflow Setup Complete ===")
    print(f"Workflow ID: {workflow_data.get('id')}")
    print(f"Assistant ID: {ASSISTANT_ID}")
    print("\nNext steps:")
    print("1. Go to the Vapi dashboard (https://dashboard.vapi.ai)")
    print("2. Navigate to Assistants and select your assistant")
    print("3. Manually assign the workflow ID to your assistant")
    print("4. Test the workflow by making a call using the assistant")

if __name__ == "__main__":
    main()
