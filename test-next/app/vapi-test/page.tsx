"use client";

import { useState, useEffect } from "react";

export default function VapiTest() {
  const [callData, setCallData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get the API key from environment variables
        const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
        const apiUrl = process.env.NEXT_PUBLIC_VAPI_API_URL || "https://api.vapi.ai";
        
        if (!apiKey) {
          throw new Error("Vapi API key is not defined in environment variables");
        }
        
        const response = await fetch(`${apiUrl}/calls`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        setCallData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Vapi data:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Vapi API Test</h1>
      
      {loading && <p>Loading Vapi data...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
          <p>Make sure your Vapi API key is correct and the API is accessible.</p>
        </div>
      )}
      
      {callData && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p><strong>Success!</strong> Vapi API connection is working.</p>
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Call Data:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(callData, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Environment Variables:</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>NEXT_PUBLIC_VAPI_API_KEY: {process.env.NEXT_PUBLIC_VAPI_API_KEY ? "Defined" : "Not defined"}</li>
          <li>NEXT_PUBLIC_VAPI_API_URL: {process.env.NEXT_PUBLIC_VAPI_API_URL || "Not defined"}</li>
          <li>NEXT_PUBLIC_VAPI_WS_URL: {process.env.NEXT_PUBLIC_VAPI_WS_URL || "Not defined"}</li>
          <li>NEXT_PUBLIC_VAPI_ASSISTANT_ID: {process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "Not defined"}</li>
        </ul>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips:</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Ensure your Vapi API key is correct</li>
          <li>Check that your Vapi account is active</li>
          <li>Verify network connectivity to the Vapi API</li>
          <li>Check browser console for any CORS or network errors</li>
        </ul>
      </div>
    </div>
  );
}
