/**
 * Vapi WebSocket Service
 * 
 * This service handles real-time updates from Vapi.ai using WebSockets
 * for live call monitoring and analytics updates.
 */

import { getRuntimeApiKeys } from '@/config/api-keys'
import { VapiCall } from './vapi-service'

// Event types for WebSocket messages
export type VapiWebSocketEventType = 
  | 'call.started'
  | 'call.ended'
  | 'call.status_updated'
  | 'call.transcript_updated'
  | 'call.analysis_updated'
  | 'connection.established'
  | 'connection.error'
  | 'connection.closed';

// Event data structure
export interface VapiWebSocketEvent {
  type: VapiWebSocketEventType;
  data?: any;
  timestamp: number;
  callId?: string;
}

// Subscription callback type
export type VapiWebSocketCallback = (event: VapiWebSocketEvent) => void;

class VapiWebSocketService {
  private socket: WebSocket | null = null;
  private apiKey: string;
  private wsUrl: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // Start with 2 seconds
  private subscribers: Map<string, Set<VapiWebSocketCallback>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private callsInProgress: Map<string, VapiCall> = new Map();
  private debug: boolean;

  constructor() {
    const runtimeKeys = getRuntimeApiKeys();
    this.apiKey = runtimeKeys.VAPI_API_KEY || process.env.NEXT_PUBLIC_VAPI_API_KEY || '';
    this.wsUrl = process.env.NEXT_PUBLIC_VAPI_WS_URL || 'wss://api.vapi.ai/ws';
    this.debug = process.env.NODE_ENV === 'development';
    
    // Initialize subscriber collections for each event type
    const eventTypes: VapiWebSocketEventType[] = [
      'call.started',
      'call.ended',
      'call.status_updated',
      'call.transcript_updated',
      'call.analysis_updated',
      'connection.established',
      'connection.error',
      'connection.closed'
    ];
    
    eventTypes.forEach(type => {
      this.subscribers.set(type, new Set());
    });
  }

  /**
   * Connect to the Vapi WebSocket API
   */
  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.socket) {
        resolve(true);
        return;
      }

      if (!this.apiKey) {
        const error = new Error('Vapi API key is not configured. Please set your API key in the settings.');
        this.notifySubscribers('connection.error', { error });
        reject(error);
        return;
      }

      try {
        // Close any existing connection
        this.disconnect();
        
        // Create a new WebSocket connection
        this.socket = new WebSocket(`${this.wsUrl}?api_key=${this.apiKey}`);
        
        // Set up event handlers
        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          
          this.notifySubscribers('connection.established', {
            message: 'Connected to Vapi WebSocket API'
          });
          
          if (this.debug) {
            console.log('Connected to Vapi WebSocket API');
          }
          
          resolve(true);
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.socket.onerror = (error) => {
          this.notifySubscribers('connection.error', { error });
          if (this.debug) {
            console.error('Vapi WebSocket error:', error);
          }
          reject(error);
        };
        
        this.socket.onclose = (event) => {
          this.isConnected = false;
          this.stopHeartbeat();
          
          this.notifySubscribers('connection.closed', {
            code: event.code,
            reason: event.reason
          });
          
          if (this.debug) {
            console.log(`Vapi WebSocket closed: ${event.code} ${event.reason}`);
          }
          
          // Attempt to reconnect if not closed intentionally
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        this.notifySubscribers('connection.error', { error });
        if (this.debug) {
          console.error('Error connecting to Vapi WebSocket:', error);
        }
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the Vapi WebSocket API
   */
  disconnect() {
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      // Only attempt to close if the socket is not already closed
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close(1000, 'Disconnected by client');
      }
      this.socket = null;
    }
    
    this.isConnected = false;
  }

  /**
   * Subscribe to WebSocket events
   */
  subscribe(eventType: VapiWebSocketEventType, callback: VapiWebSocketCallback): () => void {
    const subscribers = this.subscribers.get(eventType);
    
    if (subscribers) {
      subscribers.add(callback);
    } else {
      // If event type doesn't exist, create a new set
      this.subscribers.set(eventType, new Set([callback]));
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  /**
   * Subscribe to all events for a specific call
   */
  subscribeToCall(callId: string, callback: (event: VapiWebSocketEvent) => void): () => void {
    // Create a wrapper that filters events for this call ID
    const callEventHandler = (event: VapiWebSocketEvent) => {
      if (event.callId === callId) {
        callback(event);
      }
    };
    
    // Subscribe to all call-related events
    const unsubscribeCallStarted = this.subscribe('call.started', callEventHandler);
    const unsubscribeCallEnded = this.subscribe('call.ended', callEventHandler);
    const unsubscribeCallStatusUpdated = this.subscribe('call.status_updated', callEventHandler);
    const unsubscribeCallTranscriptUpdated = this.subscribe('call.transcript_updated', callEventHandler);
    const unsubscribeCallAnalysisUpdated = this.subscribe('call.analysis_updated', callEventHandler);
    
    // Return a function that unsubscribes from all events
    return () => {
      unsubscribeCallStarted();
      unsubscribeCallEnded();
      unsubscribeCallStatusUpdated();
      unsubscribeCallTranscriptUpdated();
      unsubscribeCallAnalysisUpdated();
    };
  }

  /**
   * Get all active calls currently being monitored
   */
  getActiveCallsCount(): number {
    return this.callsInProgress.size;
  }

  /**
   * Get a specific active call by ID
   */
  getActiveCall(callId: string): VapiCall | undefined {
    return this.callsInProgress.get(callId);
  }

  /**
   * Get all active calls
   */
  getAllActiveCalls(): VapiCall[] {
    return Array.from(this.callsInProgress.values());
  }

  /**
   * Check if the WebSocket connection is established
   */
  isConnectedToWebSocket(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message to the WebSocket server
   */
  private sendMessage(message: any) {
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: any) {
    if (data.type === 'ping') {
      // Respond to ping with pong
      this.sendMessage({ type: 'pong', timestamp: Date.now() });
      return;
    }
    
    // Handle call events
    if (data.type === 'call.started') {
      // Store the call in our active calls map
      if (data.call && data.call.id) {
        this.callsInProgress.set(data.call.id, data.call);
      }
      
      this.notifySubscribers('call.started', {
        call: data.call
      }, data.call?.id);
    }
    else if (data.type === 'call.ended') {
      // Remove the call from our active calls map
      if (data.callId) {
        this.callsInProgress.delete(data.callId);
      }
      
      this.notifySubscribers('call.ended', {
        callId: data.callId,
        endReason: data.endReason,
        duration: data.duration
      }, data.callId);
    }
    else if (data.type === 'call.status_updated') {
      // Update the call status in our active calls map
      if (data.callId && this.callsInProgress.has(data.callId)) {
        const call = this.callsInProgress.get(data.callId);
        if (call) {
          call.status = data.status;
          this.callsInProgress.set(data.callId, call);
        }
      }
      
      this.notifySubscribers('call.status_updated', {
        callId: data.callId,
        status: data.status
      }, data.callId);
    }
    else if (data.type === 'call.transcript_updated') {
      this.notifySubscribers('call.transcript_updated', {
        callId: data.callId,
        transcript: data.transcript
      }, data.callId);
    }
    else if (data.type === 'call.analysis_updated') {
      this.notifySubscribers('call.analysis_updated', {
        callId: data.callId,
        analysis: data.analysis
      }, data.callId);
    }
  }

  /**
   * Notify all subscribers of an event
   */
  private notifySubscribers(eventType: VapiWebSocketEventType, data: any, callId?: string) {
    const event: VapiWebSocketEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
      callId
    };
    
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Start the heartbeat to keep the connection alive
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    
    // Send a heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000);
  }

  /**
   * Stop the heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Failed to reconnect to Vapi WebSocket after ${this.reconnectAttempts} attempts`);
      return;
    }
    
    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    if (this.debug) {
      console.log(`Attempting to reconnect to Vapi WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection attempt failed:', error);
      });
    }, delay);
  }
}

export const vapiWebSocketService = new VapiWebSocketService();
