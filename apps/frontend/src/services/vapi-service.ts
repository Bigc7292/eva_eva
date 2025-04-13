/**
 * Vapi.ai Service
 *
 * This service handles all communication with the Vapi.ai API for
 * AI-powered voice calls, analytics, and call data.
 */

import { getRuntimeApiKeys } from '@/config/api-keys'
import { Call } from '@/lib/dummy-data'

// Types for Vapi API
export interface VapiCall {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
  status: 'scheduled' | 'in-progress' | 'completed' | 'failed' | 'canceled';
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  costBreakdown?: {
    transport: number;
    stt: number;
    llm: number;
    tts: number;
    vapi: number;
    total: number;
  };
  phoneCallProviderId?: string;
  assistantId?: string;
  phoneNumberId?: string;
  customerId?: string;
  name?: string;
  endedReason?: string;
  artifact?: {
    recordingUrl?: string;
    transcript?: string;
    messages?: Array<{
      role: string;
      message: string;
      time: number;
      endTime?: number;
      secondsFromStart: number;
    }>;
  };
  analysis?: {
    summary?: string;
    structuredData?: Record<string, unknown>;
    successEvaluation?: string;
  };
}

export interface VapiAnalyticsQuery {
  table: string;
  name: string;
  operations: Array<{
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
    column: string;
  }>;
  groupBy?: string[];
  filters?: Array<{
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
    value: string | number | boolean | string[];
  }>;
  timeRange?: {
    start: string;
    end: string;
    step: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';
    timezone?: string;
  };
}

export interface VapiAnalyticsResult {
  name: string;
  timeRange: {
    start: string;
    end: string;
    step: string;
    timezone?: string;
  };
  result: Array<Record<string, unknown>>;
}

class VapiService {
  private apiKey: string;
  private apiUrl: string;
  private debug: boolean;
  private isInitialized: boolean;
  private lastErrorTime: number;
  private errorCount: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    const runtimeKeys = getRuntimeApiKeys();
    this.apiKey = runtimeKeys.VAPI_API_KEY || process.env.NEXT_PUBLIC_VAPI_API_KEY || '';
    this.apiUrl = process.env.NEXT_PUBLIC_VAPI_API_URL || 'https://api.vapi.ai';
    this.debug = process.env.NODE_ENV === 'development';
    this.isInitialized = !!this.apiKey;
    this.lastErrorTime = 0;
    this.errorCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second initial delay, will increase with backoff

    if (this.debug) {
      console.log(`Vapi service initialized with API key: ${this.apiKey ? '✓ Present' : '✗ Missing'}`);
      console.log(`Vapi API URL: ${this.apiUrl}`);
    }
  }

  /**
   * Check if the service is properly initialized with API key
   */
  isApiKeyConfigured(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset error count after successful API call
   */
  private resetErrorState() {
    this.errorCount = 0;
    this.lastErrorTime = 0;
  }

  /**
   * Handle API errors with exponential backoff retry logic
   */
  private async handleApiError(error: Error, operation: string, retryFn: () => Promise<unknown>): Promise<unknown> {
    this.errorCount++;
    this.lastErrorTime = Date.now();

    const isRateLimitError = error.status === 429;
    const isServerError = error.status >= 500 && error.status < 600;
    const isNetworkError = error.message?.includes('network') || error.message?.includes('fetch');
    const isRetryable = isRateLimitError || isServerError || isNetworkError;

    if (isRetryable && this.errorCount <= this.maxRetries) {
      // Calculate backoff delay: 1s, 2s, 4s, etc.
      const delay = this.retryDelay * (2 ** (this.errorCount - 1));
      console.warn(`Vapi API ${operation} failed (attempt ${this.errorCount}). Retrying in ${delay}ms...`);

      // Wait for the backoff period
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry the operation
      return retryFn();
    }

    // If we've exceeded retries or it's not a retryable error, throw
    console.error(`Vapi API ${operation} failed after ${this.errorCount} attempts:`, error);
    throw error;
  }

  /**
   * Make an API request to Vapi with error handling and retries
   */
  private async apiRequest<T>(url: string, options: RequestInit, operation: string): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('Vapi API key is not configured. Please set your API key in the settings.');
    }

    try {
      if (this.debug) {
        console.log(`Vapi API ${operation} request to: ${url}`);
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        const error = new Error(`Vapi API error (${response.status}): ${errorText}`);
        Object.assign(error, { status: response.status, statusText: response.statusText });
        throw error;
      }

      const data = await response.json();
      this.resetErrorState();
      return data as T;
    } catch (error) {
      return this.handleApiError(error, operation, () => this.apiRequest<T>(url, options, operation));
    }
  }

  /**
   * Get all calls
   */
  async getCalls(params?: {
    limit?: number;
    createdAtGt?: string;
    createdAtLt?: string;
    assistantId?: string;
  }): Promise<VapiCall[]> {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.createdAtGt) queryParams.append('createdAtGt', params.createdAtGt);
    if (params?.createdAtLt) queryParams.append('createdAtLt', params.createdAtLt);
    if (params?.assistantId) queryParams.append('assistantId', params.assistantId);

    const url = `${this.apiUrl}/call${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    return this.apiRequest<VapiCall[]>(url, { method: 'GET' }, 'getCalls');
  }

  /**
   * Get a specific call by ID
   */
  async getCall(callId: string): Promise<VapiCall> {
    const url = `${this.apiUrl}/call?id=${encodeURIComponent(callId)}`;
    const data = await this.apiRequest<VapiCall[]>(url, { method: 'GET' }, `getCall(${callId})`);
    return Array.isArray(data) && data.length > 0 ? data[0] : {} as VapiCall;
  }

  /**
   * Create a new outbound call
   */
  async createCall(params: {
    name?: string;
    assistantId: string;
    customer: {
      number: string;
      name?: string;
    };
  }): Promise<VapiCall> {
    const url = `${this.apiUrl}/call`;
    const options = {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        assistantId: params.assistantId,
        customer: params.customer
      })
    };

    return this.apiRequest<VapiCall>(url, options, 'createCall');
  }

  /**
   * Get analytics data
   */
  async getAnalytics(queries: VapiAnalyticsQuery[]): Promise<VapiAnalyticsResult[]> {
    const url = `${this.apiUrl}/analytics`;
    const options = {
      method: 'POST',
      body: JSON.stringify({ queries })
    };

    return this.apiRequest<VapiAnalyticsResult[]>(url, options, 'getAnalytics');
  }

  /**
   * Get call analytics
   */
  async getCallAnalytics(timeRange?: { start: string; end: string }): Promise<VapiAnalyticsResult[]> {
    // Default to last 30 days if no time range is provided
    const now = new Date();
    const start = timeRange?.start || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = timeRange?.end || now.toISOString();

    const queries: VapiAnalyticsQuery[] = [
      {
        table: 'call',
        name: 'call_count_by_status',
        operations: [{ operation: 'count', column: 'id' }],
        groupBy: ['status'],
        timeRange: {
          start,
          end,
          step: 'day'
        }
      },
      {
        table: 'call',
        name: 'call_duration',
        operations: [
          { operation: 'avg', column: 'duration' },
          { operation: 'sum', column: 'duration' }
        ],
        groupBy: ['type'],
        timeRange: {
          start,
          end,
          step: 'day'
        }
      },
      {
        table: 'call',
        name: 'call_cost',
        operations: [
          { operation: 'sum', column: 'cost' },
          { operation: 'avg', column: 'cost' }
        ],
        timeRange: {
          start,
          end,
          step: 'day'
        }
      }
    ];

    return this.getAnalytics(queries);
  }

  /**
   * Convert Vapi call data to our internal Call format
   */
  convertVapiCallToInternalFormat(vapiCall: VapiCall) {
    return {
      id: vapiCall.id,
      retellCallId: vapiCall.phoneCallProviderId || '',
      timestamp: vapiCall.createdAt,
      callDuration: this.calculateCallDuration(vapiCall),
      callType: vapiCall.type === 'inboundPhoneCall' ? 'Inbound' : 'Outbound',
      callStatus: this.mapCallStatus(vapiCall.status),
      audioUrl: vapiCall.artifact?.recordingUrl || '',
      detailedCallSummary: vapiCall.analysis?.summary || `Call with ${vapiCall.name || 'unknown'}`,
      leadId: vapiCall.customerId || '',
      leadName: vapiCall.name || '',
      leadEmail: '',
      leadPhone: '',
      transcript: vapiCall.artifact?.transcript || null,
      sentimentScore: 0.5, // Default sentiment score
      keyTopics: [],
      nextSteps: '',
      agentId: vapiCall.assistantId || '',
      agentName: 'Vapi AI Assistant'
    };
  }

  /**
   * Calculate call duration in seconds
   */
  private calculateCallDuration(vapiCall: VapiCall): number {
    if (vapiCall.startedAt && vapiCall.endedAt) {
      const start = new Date(vapiCall.startedAt).getTime();
      const end = new Date(vapiCall.endedAt).getTime();
      return Math.floor((end - start) / 1000);
    }
    return 0;
  }

  /**
   * Map Vapi call status to our internal format
   */
  private mapCallStatus(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Missed';
      case 'canceled':
        return 'Voicemail';
      case 'in-progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      default:
        return 'Unknown';
    }
  }
}

export const vapiService = new VapiService();
