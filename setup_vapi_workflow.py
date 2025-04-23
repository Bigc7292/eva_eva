import os
import sys
import subprocess
import time

def print_header(text):
    """Print a header with decoration"""
    print("\n" + "=" * 80)
    print(f" {text} ".center(80, "="))
    print("=" * 80)

def print_step(step_num, text):
    """Print a step with number"""
    print(f"\n[Step {step_num}] {text}")

def run_script(script_name, description):
    """Run a Python script and handle errors"""
    print_step(steps.index(script_name) + 1, description)

    try:
        result = subprocess.run([sys.executable, script_name], check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error running {script_name}: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error running {script_name}: {e}")
        return False

def check_env_file():
    """Check if .env file exists and create it if not"""
    print_step(1, "Checking environment variables")

    if os.path.exists(".env"):
        print("Found .env file")
        return True

    print("No .env file found. Creating one...")

    # Get Vapi credentials
    vapi_private_key = input("Enter your Vapi private API key: ")
    vapi_public_key = input("Enter your Vapi public API key (or press Enter to skip): ")
    phone_number_id = input("Enter your Vapi phone number ID: ")
    base_url = input("Enter your API server URL [http://localhost:3004]: ") or "http://localhost:3004"

    # Create .env file
    with open(".env", "a") as f:
        f.write(f"\n# Vapi Workflow Configuration\n")
        f.write(f"NEXT_PRIVATE_VAPI_API_KEY={vapi_private_key}\n")
        if vapi_public_key:
            f.write(f"NEXT_PUBLIC_VAPI_API_KEY={vapi_public_key}\n")
        f.write(f"VAPI_ASSISTANT_ID=cfaa163c-4a47-471b-a39e-95c12d0cb738\n")
        f.write(f"NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID={phone_number_id}\n")
        f.write(f"BASE_URL={base_url}\n")

    print(".env file created successfully")
    return True

def main():
    """Main function to run all steps"""
    print_header("VAPI WORKFLOW SETUP")
    print("This script will set up the Vapi workflow for real estate lead qualification.")
    print("It will run through all the necessary steps to create and test the workflow.")

    # Check environment variables
    if not check_env_file():
        print("Failed to set up environment variables. Exiting.")
        return

    # Run each script in sequence
    for script in steps[1:]:  # Skip the first step (check_env_file)
        description = step_descriptions.get(script, f"Running {script}")
        success = run_script(script, description)

        if not success:
            print(f"Failed to run {script}. Do you want to continue? (y/n)")
            if input().lower() != "y":
                print("Exiting.")
                return

    print_header("SETUP COMPLETE")
    print("The Vapi workflow has been set up successfully.")
    print("You can now make calls using your Vapi assistant to test the workflow.")

# Define the steps and descriptions
steps = [
    "check_env_file",  # This is a function, not a script
    "check_api_endpoints.py",
    "create_real_estate_workflow_api.py",
    "test_vapi_tools.py",
    "test_vapi_workflow.py"
]

step_descriptions = {
    "check_api_endpoints.py": "Checking API endpoints",
    "create_real_estate_workflow_api.py": "Creating Vapi workflow and tools",
    "test_vapi_tools.py": "Testing Vapi tools",
    "test_vapi_workflow.py": "Testing Vapi workflow"
}

if __name__ == "__main__":
    main()
