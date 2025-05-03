# Vercel MCP Server

This project includes a Vercel MCP (Machine Coding Protocol) server that allows you to interact with the Vercel API directly from your code editor.

## Setup

1. Get your Vercel API key from https://vercel.com/account/tokens
2. Add your Vercel API key to the `.env.local` file:
   ```
   VERCEL_API_KEY=your_api_key_here
   ```

## Usage

### Running the Vercel MCP Server

You can run the Vercel MCP server using the following command:

```bash
npm run vercel-mcp
```

### Available Tools

The Vercel MCP server provides the following tools for interacting with the Vercel API:

#### Deployments
- `getVercelDeploymentEvents` - Get deployment events by deployment ID and build ID
- `getVercelDeployment` - Get a deployment by ID or URL
- `cancelVercelDeployment` - Cancel a deployment
- `listVercelDeploymentFiles` - List deployment files
- `getVercelDeploymentFileContents` - Get deployment file contents
- `getVercelDeployments` - List deployments
- `deleteVercelDeployment` - Delete a deployment

#### DNS
- `getVercelDNSRecords` - List DNS records for a domain
- `createVercelDNSRecord` - Create a DNS record for a domain
- `updateVercelDNSRecord` - Update a DNS record
- `deleteVercelDNSRecord` - Delete a DNS record

#### Domains
- `getVercelDomainConfig` - Get a Domain's configuration
- `getVercelDomain` - Get information for a single domain
- `getVercelDomains` - List all domains for the authenticated user or team

#### Projects
- `getVercelProjects` - Retrieve a list of projects
- `updateVercelProject` - Update an existing project
- `getVercelProjectDomains` - Retrieve project domains by project id or name
- `getVercelProjectDomain` - Get a project domain
- `updateVercelProjectDomain` - Update a project domain
- `removeVercelProjectDomain` - Remove a domain from a project
- `addVercelProjectDomain` - Add a domain to a project
- `verifyVercelProjectDomain` - Verify project domain

#### Environment Variables
- `filterVercelProjectEnvs` - Retrieve the environment variables of a project
- `getVercelProjectEnv` - Retrieve the decrypted value of an environment variable
- `createVercelProjectEnv` - Create one or more environment variables
- `removeVercelProjectEnv` - Remove an environment variable
- `editVercelProjectEnv` - Edit an environment variable

## Cursor Integration

If you're using Cursor, the MCP server is configured in `.cursor/mcp.json`. You can access the Vercel MCP server tools directly from Cursor.

## Windsurf Integration

If you're using Windsurf, the MCP server is configured in `~/.codeium/windsurf/mcp_config.json`. You can access the Vercel MCP server tools directly from Windsurf.
