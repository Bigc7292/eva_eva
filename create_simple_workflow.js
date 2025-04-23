const fetch = require('node-fetch');

// Configuration - Direct token inclusion
const API_KEY = "d1529b85-51d5-47c0-9332-a73d40f7d62b";  // Your Vapi private API key
const BASE_URL = "https://api.vapi.ai";
const ASSISTANT_ID = "cfaa163c-4a47-471b-a39e-95c12d0cb738";

// Headers for API requests
const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
};

async function createWorkflow() {
    console.log("Creating real estate lead qualification workflow...");
    
    // Define the workflow with the format that works
    const payload = {
        "nodes": [
            // Start node
            {
                "type": "start",
                "name": "Start"
            },
            
            // Greeting
            {
                "type": "say",
                "name": "Greeting",
                "prompt": "Hello, I'm a real estate assistant for a luxury property company in Dubai. I'd like to understand your property preferences to help you find the perfect home. Is this a good time to talk?"
            },
            
            // Gather location
            {
                "type": "gather",
                "name": "GatherLocation",
                "prompt": "Which area in Dubai are you interested in? For example, Dubai Marina, Downtown, Palm Jumeirah, etc."
            },
            
            // Gather property type
            {
                "type": "gather",
                "name": "GatherPropertyType",
                "prompt": "What type of property are you looking for? For example, apartment, villa, penthouse, etc."
            },
            
            // Gather budget
            {
                "type": "gather",
                "name": "GatherBudget",
                "prompt": "What's your budget in USD? You can give me a range or a specific amount."
            },
            
            // Thank you
            {
                "type": "say",
                "name": "ThankYou",
                "prompt": "Thank you for sharing your preferences. I'll help you find properties that match your criteria. A real estate specialist will contact you soon with options."
            },
            
            // End call
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
                "to": "ThankYou"
            },
            {
                "from": "ThankYou",
                "to": "EndCall"
            }
        ]
    };
    
    try {
        const response = await fetch(`${BASE_URL}/workflow`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error creating workflow: ${errorText}`);
            return null;
        }
        
        const data = await response.json();
        console.log(`Workflow created with ID: ${data.id}`);
        return data;
    } catch (error) {
        console.error(`Error creating workflow: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log("Starting workflow creation...");
    
    // Create workflow
    const workflowData = await createWorkflow();
    
    if (!workflowData) {
        console.error("Error: Failed to create workflow");
        return;
    }
    
    console.log("\n=== Workflow Setup Complete ===");
    console.log(`Workflow ID: ${workflowData.id}`);
    console.log(`Assistant ID: ${ASSISTANT_ID}`);
    console.log("\nNext steps:");
    console.log("1. Go to the Vapi dashboard (https://dashboard.vapi.ai)");
    console.log("2. Navigate to Assistants and select your assistant");
    console.log("3. Assign the workflow ID to your assistant");
    console.log("4. Test the workflow by making a call using the assistant");
}

// Run the main function
main().catch(error => {
    console.error("Error:", error);
});
