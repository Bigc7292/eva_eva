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

async function createTool() {
    console.log("Creating property search tool...");

    const payload = {
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
    };

    try {
        const response = await fetch(`${BASE_URL}/tool`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error creating tool: ${errorText}`);
            return null;
        }

        const data = await response.json();
        console.log(`Tool created with ID: ${data.id}`);
        return data.id;
    } catch (error) {
        console.error(`Error creating tool: ${error.message}`);
        return null;
    }
}

async function createWorkflow(toolId) {
    console.log("Creating real estate lead qualification workflow...");

    // Define the workflow
    const workflow = {
        "name": "RealEstateLeadQualificationWorkflow",
        "assistantId": ASSISTANT_ID,
        "workflow": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "data": { "prompt": "Welcome to our luxury real estate service. I'd like to understand your property preferences. Is this a good time to talk?" }
                },
                {
                    "id": "gather_location",
                    "type": "input",
                    "data": { "variable": "location", "prompt": "Which area in Dubai are you interested in? For example, Dubai Marina, Downtown, Palm Jumeirah, etc." }
                },
                {
                    "id": "gather_property_type",
                    "type": "input",
                    "data": { "variable": "property_type", "prompt": "What type of property are you looking for? For example, apartment, villa, penthouse, etc." }
                },
                {
                    "id": "gather_budget",
                    "type": "input",
                    "data": { "variable": "budget", "prompt": "What's your budget in USD? You can give me a range or a specific amount." }
                }
            ],
            "edges": [
                { "source": "start", "target": "gather_location" },
                { "source": "gather_location", "target": "gather_property_type" },
                { "source": "gather_property_type", "target": "gather_budget" }
            ]
        }
    };

    // Add tool integration if tool_id is provided
    if (toolId) {
        workflow.workflow.nodes.push(
            {
                "id": "search_properties",
                "type": "function",
                "data": {
                    "toolId": toolId,
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
                "data": { "prompt": "Thank you for sharing your preferences. I'll help you find properties that match your criteria. A real estate specialist will contact you soon with options." }
            },
            {
                "id": "end",
                "type": "end",
                "data": {}
            }
        );

        workflow.workflow.edges.push(
            { "source": "gather_budget", "target": "search_properties" },
            { "source": "search_properties", "target": "thank_you" },
            { "source": "thank_you", "target": "end" }
        );
    } else {
        // Simple ending without tool integration
        workflow.workflow.nodes.push(
            {
                "id": "thank_you",
                "type": "say",
                "data": { "prompt": "Thank you for sharing your preferences. I'll help you find properties that match your criteria. A real estate specialist will contact you soon with options." }
            },
            {
                "id": "end",
                "type": "end",
                "data": {}
            }
        );

        workflow.workflow.edges.push(
            { "source": "gather_budget", "target": "thank_you" },
            { "source": "thank_you", "target": "end" }
        );
    }

    try {
        const response = await fetch(`${BASE_URL}/workflow`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(workflow)
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

    // Create tool
    const toolId = await createTool();

    // Create workflow with or without tool integration
    const workflowData = await createWorkflow(toolId);

    if (!workflowData) {
        console.error("Error: Failed to create workflow");
        return;
    }

    console.log("\n=== Workflow Setup Complete ===");
    if (toolId) {
        console.log(`Tool ID: ${toolId}`);
    } else {
        console.log("Note: No tool was created. Workflow created without tool integration.");
    }

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
