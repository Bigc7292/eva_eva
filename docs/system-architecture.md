# System Architecture

## Overview

Eva CRM is built using a modern tech stack with a focus on scalability, performance, and developer experience. The system follows a client-server architecture with a clear separation of concerns.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express (API server)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Voice/Call**: Retell AI, Twilio
- **Deployment**: Vercel (Frontend), Railway/Heroku (Backend)

## Architecture Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Next.js        │      │  API Server     │      │  Supabase       │
│  Frontend       │<────>│  (Node.js)      │<────>│  (PostgreSQL)   │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ▲                        ▲                        ▲
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Retell AI      │      │  Twilio         │      │  Social Media   │
│  (Call Center)  │      │  (SMS/Voice)    │      │  APIs           │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Component Structure

### Frontend

The frontend is organized into the following main sections:

1. **Pages**: Next.js pages that define the routes of the application
2. **Components**: Reusable UI components
   - UI components (buttons, cards, inputs)
   - Feature components (dashboard widgets, lead forms)
   - Layout components (sidebar, header)
3. **Services**: API client functions for communicating with the backend
4. **Lib**: Utility functions, hooks, and dummy data
5. **Types**: TypeScript type definitions

### Backend

The backend API server handles:

1. **Authentication**: User registration, login, and session management
2. **Data Access**: CRUD operations for leads, calls, and other entities
3. **Integration**: Communication with third-party services (Retell, Twilio)
4. **Analytics**: Processing and aggregating data for dashboard metrics

### Database

The database schema includes the following main tables:

1. **users**: User accounts and authentication
2. **leads**: Lead information and status
3. **calls**: Call records, metadata, and references to transcripts
4. **interactions**: All interactions with leads (calls, emails, notes)
5. **social_accounts**: Connected social media accounts
6. **social_campaigns**: Social media campaign data
7. **social_leads**: Leads generated from social media

## Data Flow

1. **Lead Generation**:
   - Leads are created from various sources (manual entry, social media, calls)
   - Lead data is stored in the database
   - Lead profiles are updated with each interaction

2. **Call Processing**:
   - Calls are initiated through Retell AI or Twilio
   - Call audio is recorded and stored
   - Transcripts are generated and analyzed for sentiment and key topics
   - Call data is associated with the relevant lead

3. **Analytics**:
   - Raw data is processed to generate metrics and insights
   - Dashboard widgets display real-time and historical data
   - Predictive analytics use historical data to forecast future performance

## Security Considerations

- **Authentication**: JWT-based authentication with Supabase
- **Authorization**: Role-based access control for different user types
- **Data Encryption**: Sensitive data is encrypted at rest and in transit
- **API Security**: Rate limiting, CORS, and input validation
- **Audit Logging**: All sensitive operations are logged for audit purposes

## Scalability

The system is designed to scale horizontally:

- **Frontend**: Static generation and incremental static regeneration for performance
- **Backend**: Stateless API design for horizontal scaling
- **Database**: Connection pooling and query optimization
- **Caching**: Redis caching for frequently accessed data
- **CDN**: Edge caching for static assets and API responses
