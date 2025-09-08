# Eva CRM System Documentation

## Overview

Eva CRM is a comprehensive customer relationship management system designed specifically for real estate businesses. It provides tools for managing leads, tracking calls, analyzing performance, and integrating with social media platforms.

## Key Features

- **Dashboard Analytics**: Real-time metrics and visualizations for business performance
- **Lead Management**: Comprehensive lead profiles with contact information, preferences, and interaction history
- **Call Tracking**: Detailed call logs with transcripts, sentiment analysis, and key topics
- **Social Media Integration**: Connect social accounts, track campaigns, and manage social leads
- **Agent Performance**: Monitor AI agent metrics including success rates, script adherence, and language quality

## Documentation Sections

1. [System Architecture](./system-architecture.md)
2. [Database Integration](./database-integration.md)
3. [API Implementation](./api-implementation.md)
4. [Retell Integration](./retell-integration.md)
5. [Twilio Integration](./twilio-integration.md)
6. [User Guide](./user-guide.md)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for database)
- Retell account (for AI call center)
- Twilio account (for SMS and voice)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-organization/eva-crm.git
   cd eva-crm
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   RETELL_API_KEY=your_retell_api_key
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3003](http://localhost:3003) in your browser.

## Project Structure

- `apps/frontend/src/app`: Next.js application routes
- `apps/frontend/src/components`: React components
- `apps/frontend/src/lib`: Utility functions and dummy data
- `apps/frontend/src/services`: API service functions
- `apps/frontend/src/types`: TypeScript type definitions

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.
