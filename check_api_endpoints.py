import requests
import json
import os
from dotenv import load_dotenv
import sys

# Load environment variables from .env file
load_dotenv()

# Configuration
API_SERVER_URL = os.getenv("BASE_URL", "http://localhost:3004")

def print_header(text):
    """Print a header with decoration"""
    print("\n" + "=" * 80)
    print(f" {text} ".center(80, "="))
    print("=" * 80)

def print_success(text):
    """Print a success message"""
    print(f"✅ {text}")

def print_error(text):
    """Print an error message"""
    print(f"❌ {text}")

def print_info(text):
    """Print an info message"""
    print(f"ℹ️ {text}")

def check_server_running():
    """Check if the API server is running"""
    print_header("CHECKING SERVER")
    
    try:
        response = requests.get(f"{API_SERVER_URL}")
        
        if response.status_code == 200:
            print_success(f"Server is running at {API_SERVER_URL}")
            return True
        else:
            print_error(f"Server returned status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error(f"Could not connect to server at {API_SERVER_URL}")
        return False
    except Exception as e:
        print_error(f"Error checking server: {str(e)}")
        return False

def check_properties_endpoint():
    """Check the properties endpoint"""
    print_header("CHECKING PROPERTIES ENDPOINT")
    endpoint = f"{API_SERVER_URL}/api/properties"
    
    # Test with query parameters
    params = {
        "location": "Dubai Marina",
        "type": "Apartment",
        "budget": "1000000"
    }
    
    print_info(f"Testing GET {endpoint} with params: {params}")
    
    try:
        response = requests.get(endpoint, params=params)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Endpoint returned status code {response.status_code}")
            
            if "properties" in data and "matching_properties" in data:
                print_success(f"Found {data['matching_properties']} matching properties")
                
                if data['matching_properties'] > 0:
                    print_info("Sample property:")
                    sample_property = data['properties'][0]
                    for key, value in sample_property.items():
                        print(f"  {key}: {value}")
            else:
                print_error("Response does not contain expected fields (properties, matching_properties)")
                print_info(f"Response: {json.dumps(data, indent=2)}")
        else:
            print_error(f"Endpoint returned status code {response.status_code}")
            print_info(f"Response: {response.text}")
    except Exception as e:
        print_error(f"Error checking properties endpoint: {str(e)}")

def check_calendar_slots_endpoint():
    """Check the calendar slots endpoint"""
    print_header("CHECKING CALENDAR SLOTS ENDPOINT")
    endpoint = f"{API_SERVER_URL}/api/calendar/available_slots"
    
    # Test with query parameters
    params = {
        "time": "tomorrow"
    }
    
    print_info(f"Testing GET {endpoint} with params: {params}")
    
    try:
        response = requests.get(endpoint, params=params)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Endpoint returned status code {response.status_code}")
            
            if "available_slots" in data:
                print_success(f"Found {len(data['available_slots'])} available slots")
                
                if len(data['available_slots']) > 0:
                    print_info("Available slots:")
                    for slot in data['available_slots']:
                        print(f"  - {slot}")
            else:
                print_error("Response does not contain expected field (available_slots)")
                print_info(f"Response: {json.dumps(data, indent=2)}")
        else:
            print_error(f"Endpoint returned status code {response.status_code}")
            print_info(f"Response: {response.text}")
    except Exception as e:
        print_error(f"Error checking calendar slots endpoint: {str(e)}")

def check_booking_endpoint():
    """Check the booking endpoint"""
    print_header("CHECKING BOOKING ENDPOINT")
    endpoint = f"{API_SERVER_URL}/api/calendar/book"
    
    # Test with request body
    data = {
        "slot": "Monday, April 29 at 10:00 AM"
    }
    
    print_info(f"Testing POST {endpoint} with data: {data}")
    
    try:
        response = requests.post(endpoint, json=data)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Endpoint returned status code {response.status_code}")
            
            if "booking_confirmation" in data:
                print_success(f"Booking confirmation: {data['booking_confirmation']}")
                
                if data['booking_confirmation']:
                    print_info("Booking details:")
                    for key, value in data.items():
                        if key != "booking_confirmation":
                            print(f"  {key}: {value}")
            else:
                print_error("Response does not contain expected field (booking_confirmation)")
                print_info(f"Response: {json.dumps(data, indent=2)}")
        else:
            print_error(f"Endpoint returned status code {response.status_code}")
            print_info(f"Response: {response.text}")
    except Exception as e:
        print_error(f"Error checking booking endpoint: {str(e)}")

def check_leads_endpoint():
    """Check the leads endpoint"""
    print_header("CHECKING LEADS ENDPOINT")
    endpoint = f"{API_SERVER_URL}/api/leads"
    
    # Test with request body
    data = {
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
    
    print_info(f"Testing POST {endpoint} with data: {data}")
    
    try:
        response = requests.post(endpoint, json=data)
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success(f"Endpoint returned status code {response.status_code}")
            
            if "id" in data or "lead_id" in data:
                lead_id = data.get("id") or data.get("lead_id")
                print_success(f"Lead created with ID: {lead_id}")
                
                print_info("Lead details:")
                for key, value in data.items():
                    print(f"  {key}: {value}")
            else:
                print_error("Response does not contain expected field (id or lead_id)")
                print_info(f"Response: {json.dumps(data, indent=2)}")
        else:
            print_error(f"Endpoint returned status code {response.status_code}")
            print_info(f"Response: {response.text}")
    except Exception as e:
        print_error(f"Error checking leads endpoint: {str(e)}")

def check_all_endpoints():
    """Check all endpoints"""
    # First check if server is running
    if not check_server_running():
        print_error("Server is not running. Please start the server and try again.")
        return False
    
    # Check all endpoints
    check_properties_endpoint()
    check_calendar_slots_endpoint()
    check_booking_endpoint()
    check_leads_endpoint()
    
    print_header("SUMMARY")
    print_info(f"API Server URL: {API_SERVER_URL}")
    print_info("All endpoint checks completed. Review the results above for any errors.")
    print_info("If any endpoints failed, you'll need to fix them before using the workflow.")
    
    return True

def main():
    """Main function"""
    print_header("API ENDPOINT CHECKER")
    print_info(f"This script checks the API endpoints required for the Vapi workflow.")
    print_info(f"API Server URL: {API_SERVER_URL}")
    
    # Check if API_SERVER_URL is set
    if not API_SERVER_URL:
        print_error("BASE_URL environment variable is not set.")
        print_info("Please set the BASE_URL environment variable to your API server URL.")
        print_info("Example: BASE_URL=http://localhost:3004")
        return
    
    # Check all endpoints
    check_all_endpoints()

if __name__ == "__main__":
    main()
