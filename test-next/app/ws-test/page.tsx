"use client";

import { useState, useEffect, useRef } from "react";

export default function WebSocketTest() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Get the WebSocket URL from environment variables
    const wsUrl = process.env.NEXT_PUBLIC_VAPI_WS_URL || "wss://api.vapi.ai/ws";
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    
    if (!apiKey) {
      setError("Vapi API key is not defined in environment variables");
      return;
    }
    
    // Create a WebSocket connection
    const ws = new WebSocket(`${wsUrl}?api_key=${apiKey}`);
    wsRef.current = ws;
    
    // WebSocket event listeners
    ws.onopen = () => {
      console.log("WebSocket connection established");
      setConnected(true);
      setMessages(prev => [...prev, { type: "info", text: "WebSocket connection established" }]);
    };
    
    ws.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, { type: "message", data }]);
      } catch (err) {
        setMessages(prev => [...prev, { type: "message", data: event.data }]);
      }
    };
    
    ws.onerror = (event) => {
      console.error("WebSocket error:", event);
      setError("WebSocket error occurred. Check console for details.");
      setMessages(prev => [...prev, { type: "error", text: "WebSocket error occurred" }]);
    };
    
    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event);
      setConnected(false);
      setMessages(prev => [...prev, { type: "info", text: `WebSocket connection closed: ${event.reason}` }]);
    };
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Vapi WebSocket Test</h1>
      
      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${connected ? "bg-green-500" : "bg-red-500"}`}></span>
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
          <p>Make sure your Vapi API key is correct and the WebSocket API is accessible.</p>
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
        <h2 className="text-xl font-semibold mb-4">WebSocket Messages:</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto h-96">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages received yet...</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div key={index} className={`p-2 rounded ${
                  msg.type === "error" ? "bg-red-100" : 
                  msg.type === "info" ? "bg-blue-100" : "bg-white"
                }`}>
                  {msg.text ? (
                    <p>{msg.text}</p>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips:</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Ensure your Vapi API key is correct</li>
          <li>Check that your Vapi account is active</li>
          <li>Verify network connectivity to the Vapi WebSocket API</li>
          <li>Check browser console for any WebSocket errors</li>
          <li>Make sure your browser supports WebSockets</li>
        </ul>
      </div>
    </div>
  );
}
