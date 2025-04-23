import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
API_KEY = os.getenv("NEXT_PRIVATE_VAPI_API_KEY")
BASE_URL = "https://api.vapi.ai"
API_SERVER_URL = os.getenv("BASE_URL", "http://localhost:3004")

# Headers for API requests
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def list_tools():
    """List all tools in the Vapi account"""
    print("Listing all tools...")

    response = requests.get(f"{BASE_URL}/tool", headers=headers)

    if response.status_code != 200:
        print(f"Error listing tools: {response.text}")
        return None

    tools = response.json()
    print(f"Found {len(tools)} tools:")

    for tool in tools:
        print(f"- {tool['name']} (ID: {tool['id']})")

    return tools

def test_property_search_tool(tool_id):
    """Test the property search tool"""
    print(f"\nTesting property search tool {tool_id}...")

    # First, test the API endpoint directly
    test_url = f"{API_SERVER_URL}/api/properties?location=Dubai%20Marina&type=Apartment&budget=1000000"
    print(f"Testing API endpoint: {test_url}")

    try:
        response = requests.get(test_url)

        if response.status_code != 200:
            print(f"❌ API endpoint test failed: {response.status_code} - {response.text}")
        else:
            data = response.json()
            print(f"✅ API endpoint test successful")
            print(f"Found {data.get('matching_properties', 0)} matching properties")
    except Exception as e:
        print(f"❌ API endpoint test failed with exception: {str(e)}")

    # Now test the tool through Vapi
    print("\nTesting tool through Vapi API...")

    payload = {
        "toolId": tool_id,
        "parameters": {
            "location": "Dubai Marina",
            "property_type": "Apartment",
            "budget": "1000000"
        }
    }

    try:
        response = requests.post(f"{BASE_URL}/tool/run", headers=headers, json=payload)

        if response.status_code != 200:
            print(f"❌ Tool test failed: {response.status_code} - {response.text}")
        else:
            data = response.json()
            print(f"✅ Tool test successful")
            print(f"Response: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"❌ Tool test failed with exception: {str(e)}")

def test_calendar_slots_tool(tool_id):
    """Test the calendar slots tool"""
    print(f"\nTesting calendar slots tool {tool_id}...")

    # First, test the API endpoint directly
    test_url = f"{API_SERVER_URL}/api/calendar/available_slots?time=tomorrow"
    print(f"Testing API endpoint: {test_url}")

    try:
        response = requests.get(test_url)

        if response.status_code != 200:
            print(f"❌ API endpoint test failed: {response.status_code} - {response.text}")
        else:
            data = response.json()
            print(f"✅ API endpoint test successful")
            print(f"Found {len(data.get('available_slots', []))} available slots")
    except Exception as e:
        print(f"❌ API endpoint test failed with exception: {str(e)}")

    # Now test the tool through Vapi
    print("\nTesting tool through Vapi API...")

    payload = {
        "toolId": tool_id,
        "parameters": {
            "time": "tomorrow"
        }
    }

    try:
        response = requests.post(f"{BASE_URL}/tool/run", headers=headers, json=payload)

        if response.status_code != 200:
            print(f"❌ Tool test failed: {response.status_code} - {response.text}")
        else:
            data = response.json()
            print(f"✅ Tool test successful")
            print(f"Response: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"❌ Tool test failed with exception: {str(e)}")

def test_booking_tool(tool_id):
    """Test the booking tool"""
    print(f"\nTesting booking tool {tool_id}...")

    # First, test the API endpoint directly
    test_url = f"{API_SERVER_URL}/api/calendar/book"
    print(f"Testing API endpoint: {test_url}")

    try:
        response = requests.post(test_url, json={"slot": "Monday, April 29 at 10:00 AM"})

        if response.status_code != 200:
            print(f"❌ API endpoint test failed: {response.status_code} - {response.text}")
        else:
            data = response.json()
            print(f"✅ API endpoint test successful")
            print(f"Booking confirmation: {data.get('booking_confirmation', False)}")
    except Exception as e:
        print(f"❌ API endpoint test failed with exception: {str(e)}")

    # Now test the tool through Vapi
    print("\nTesting tool through Vapi API...")

    payload = {
        "toolId": tool_id,
        "parameters": {
            "slot": "Monday, April 29 at 10:00 AM"
        }
    }

    try:
        response = requests.post(f"{BASE_URL}/tool/run", headers=headers, json=payload)

        if response.status_code != 200:
            print(f"❌ Tool test failed: {response.status_code} - {response.text}")
        else:
            data = response.json()
            print(f"✅ Tool test successful")
            print(f"Response: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"❌ Tool test failed with exception: {str(e)}")

def test_lead_tool(tool_id):
    """Test the lead tool"""
    print(f"\nTesting lead tool {tool_id}...")

    # First, test the API endpoint directly
    test_url = f"{API_SERVER_URL}/api/leads"
    print(f"Testing API endpoint: {test_url}")

    lead_data = {
        "name": "Test User",
        "phone_number": "+971565401583",
        "email": "test@example.com",
        "status": "booked",
        "budget": "1000000",
        "property_interest": "Apartment",
        "location": "Dubai Marina",
        "purpose": "investment",
        "timeframe": "3 months"
    }

    try:
        response = requests.post(test_url, json=lead_data)

        if response.status_code != 200 and response.status_code != 201:
            print(f"❌ API endpoint test failed: {response.status_code} - {response.text}")
        else:
            data = response.json()
            print(f"✅ API endpoint test successful")
            print(f"Lead created with ID: {data.get('id') or data.get('lead_id')}")
    except Exception as e:
        print(f"❌ API endpoint test failed with exception: {str(e)}")

    # Now test the tool through Vapi
    print("\nTesting tool through Vapi API...")

    payload = {
        "toolId": tool_id,
        "parameters": lead_data
    }

    try:
        response = requests.post(f"{BASE_URL}/tool/run", headers=headers, json=payload)

        if response.status_code != 200:
            print(f"❌ Tool test failed: {response.status_code} - {response.text}")
        else:
            data = response.json()
            print(f"✅ Tool test successful")
            print(f"Response: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"❌ Tool test failed with exception: {str(e)}")

def main():
    """Main function to test tools"""
    print("Starting tool tests...")

    if not API_KEY:
        print("Error: VAPI_PRIVATE_KEY environment variable not set")
        return

    # List all tools
    tools = list_tools()

    if not tools:
        print("No tools found or error listing tools")
        return

    # Ask user which tools to test
    print("\nSelect tools to test:")

    for i, tool in enumerate(tools):
        print(f"{i+1}. {tool['name']} (ID: {tool['id']})")

    selection = input("\nEnter tool numbers to test (comma-separated) or 'all' for all tools: ")

    if selection.lower() == 'all':
        selected_indices = range(len(tools))
    else:
        try:
            selected_indices = [int(idx.strip()) - 1 for idx in selection.split(',')]
        except ValueError:
            print("Invalid selection. Please enter numbers separated by commas.")
            return

    # Test selected tools
    for idx in selected_indices:
        if idx < 0 or idx >= len(tools):
            print(f"Invalid tool index: {idx+1}")
            continue

        tool = tools[idx]

        if "PropertySearchTool" in tool['name']:
            test_property_search_tool(tool['id'])
        elif "CalendarSlotsTool" in tool['name']:
            test_calendar_slots_tool(tool['id'])
        elif "BookingTool" in tool['name']:
            test_booking_tool(tool['id'])
        elif "LeadTool" in tool['name']:
            test_lead_tool(tool['id'])
        else:
            print(f"\nSkipping unknown tool type: {tool['name']}")

    print("\nTool tests completed")

if __name__ == "__main__":
    main()
