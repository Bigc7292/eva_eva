# Call Management System Architecture

## Data Flow

### Lead Profile Creation
```typescript
async createLeadProfile(phone: string): Promise<LeadProfile> {
  // Creates or retrieves lead profile
}
```

### Call Initiation
```typescript
async makeCall(phone: string): Promise<Call> {
  // Creates call record
  // Initializes VAPI call
}
```

### Call Updates
```typescript
async updateCall(callId: string, updates: Partial<Call>): Promise<Call> {
  // Updates call status
  // Fetches VAPI data
  // Updates analytics
}
```

## Analytics Pipeline

```typescript
async updateLeadProfileAnalytics(
  leadId: string,
  sentimentScore: number,
  topics: string[]
): Promise<void> {
  // Updates lead analytics
  // Calculates metrics
  // Updates database
}
```

## Meeting Management

```typescript
async bookMeeting(callId: string, meetingTime: string, notes: string): Promise<Call> {
  // Updates call status
  // Creates notifications
  // Sends email confirmation
  // Schedules reminders
}
```

## Data Flow Diagram

```
User Action -> Frontend -> API Service -> VAPI/Twilio/Mailjet
VAPI/Twilio/Mailjet -> API Service -> Database -> Frontend -> User
```

## Environment Variables

### VAPI Configuration
```typescript
VAPI_BASE_URL
VAPI_API_KEY
VAPI_MODEL_ID
```

### Twilio Configuration
```typescript
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_BASE_URL
```

### Mailjet Configuration
```typescript
MAILJET_API_KEY
MAILJET_SECRET_KEY
MAILJET_FROM_EMAIL
```

### App Configuration
```typescript
NEXT_PUBLIC_APP_URL
```

## Error Handling

```typescript
// Generic error handling
try {
  // API calls
} catch (error) {
  console.error('Error:', error)
  // Log error
  // Handle specific error cases
  throw error
}

// Specific error handling
if (error instanceof VapiError) {
  // Handle VAPI specific errors
}
if (error instanceof TwilioError) {
  // Handle Twilio specific errors
}
``
