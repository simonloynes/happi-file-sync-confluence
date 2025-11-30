# Happi File Sync Confluence 😜

A GitHub Action that syncs files from your repository to Confluence pages automatically.

> **Note**: This script is designed to work with **Confluence Cloud**. It uses Basic Auth with API tokens, which is the supported authentication method for Atlassian Cloud services.

[![GitHub Release](https://img.shields.io/github/v/release/simonloynes/happi-file-sync-confluence)](https://github.com/simonloynes/happi-file-sync-confluence/releases)
[![Test](https://github.com/simonloynes/happi-file-sync-confluence/actions/workflows/test-rc.yml/badge.svg)](https://github.com/simonloynes/happi-file-sync-confluence/actions/workflows/test-rc.yml)

## Features

- 🚀 **GitHub Action Integration**: Runs automatically on repository events
- 📝 **Multi-format Support**: Sync Markdown, HTML, and text files
- 🔄 **Automatic Updates**: Updates existing pages or creates new ones
- 🎯 **Flexible Configuration**: JSON-based configuration with validation
- 🔐 **Secure Authentication**: Supports Basic Auth with API tokens
- 🧪 **Testing Support**: Dry-run mode and local testing capabilities
- 🛡️ **Error Handling**: Comprehensive validation and error reporting

## HTTP Requests

This script makes the following HTTP requests to your Confluence instance:

**⚠️ Important**: Please review the code in `src/confluence-api.ts` to verify these requests before using this script in your environment.

### Confluence API Requests

All requests are made to: `{baseUrl}/rest/api{endpoint}`

1. **GET `/content/{pageId}?expand=body.storage,version,space`**
   - Purpose: Fetch an existing page by ID to check if it exists and get its current content/version
   - Used when: Checking if a page exists before updating it
   - Authentication: Basic Auth (user/pass)

2. **POST `/content`**
   - Purpose: Create a new Confluence page
   - Used when: Creating a new page (when pageId doesn't exist)
   - Authentication: Basic Auth (user/pass)
   - Request Body: JSON with page title, space, body content, and optional parent page

3. **PUT `/content/{pageId}`**
   - Purpose: Update an existing Confluence page
   - Used when: Updating an existing page (when pageId exists)
   - Authentication: Basic Auth (user/pass)
   - Request Body: JSON with page ID, title, body content, and version number

4. **GET `/space/{spaceKey}`**
   - Purpose: Fetch space information by key (available but not currently used in main sync flow)
   - Used when: Called programmatically if needed for validation
   - Authentication: Basic Auth (user/pass)

### Authentication

All requests use Basic Authentication:
- **Basic Authentication**: `Authorization: Basic {base64(user:pass)}`

### Request Headers

All requests include:
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: {as described above}`

## Quick Start

### 1. Basic Usage in GitHub Actions

```yaml
name: Sync Documentation
on:
  push:
    branches: [main]
    paths: ["docs/**", "README.md"]

jobs:
  sync-confluence:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: simonloynes/happi-file-sync-confluence@v2
        with:
          file-mappings: |
            {
              "baseUrl": "https://your-company.atlassian.net/wiki",
              "user": "${{ secrets.CONFLUENCE_USER }}",
              "pass": "${{ secrets.CONFLUENCE_PASS }}",
              "pages": [
                {
                  "pageId": "123456789",
                  "file": "README.md",
                  "title": "Project Documentation"
                }
              ]
            }
```

### 2. Set up Confluence Credentials

**Basic Auth (user + API token)**
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create a new API token (this will be used as your password value)
3. Add two repository secrets:
   - `CONFLUENCE_USER` (email/username)
   - `CONFLUENCE_PASS` (API token from step 2)

## Action Inputs

| Input           | Description                           | Required | Default |
| --------------- | ------------------------------------- | -------- | ------- |
| `file-mappings` | JSON configuration object (see below) | ✅       | -       |
| `debug`         | Enable debug logging                  | ❌       | `false` |

## Configuration

The `file-mappings` input accepts a JSON object with the following structure:

### Basic Configuration

```json
{
	"baseUrl": "https://your-company.atlassian.net/wiki",
	"user": "your.email@company.com",
	"pass": "your-api-token",
	"pages": [
		{
			"pageId": "123456789",
			"file": "README.md",
			"title": "Project Documentation"
		}
	]
}
```


### Full Configuration Options

```json
{
	"baseUrl": "https://your-company.atlassian.net/wiki",
	"user": "your.email@company.com",
	"pass": "your-token",
	"prefix": "This document is automatically generated from GitHub",
	"fileRoot": "docs",
	"pages": [
		{
			"pageId": "123456789",
			"file": "README.md",
			"title": "Project Documentation"
		},
		{
			"pageId": "new-page",
			"file": "guides/setup.md",
			"title": "Setup Guide",
			"spaceKey": "DEV",
			"parentId": "987654321"
		}
	]
}
```

### Configuration Fields

#### Global Settings

- **`baseUrl`** (required): Your Confluence base URL including `/wiki`
- **`user`** / **`pass`** (required): Email/username plus API token (Basic Auth)
- **`prefix`**: Text to prepend to all synchronized pages
- **`fileRoot`**: Base directory for file paths (default: repository root)

#### Page Configuration

- **`pageId`** (required): Confluence page ID (number) or unique identifier for new pages
- **`file`** (required): Path to file in repository (relative to `fileRoot`)
- **`title`**: Page title (defaults to filename)
- **`spaceKey`**: Space key (required for creating new pages)
- **`parentId`**: Parent page ID (optional, for creating new pages)

## Advanced Usage

### Multiple File Types

```yaml
- uses: simonloynes/happi-file-sync-confluence@v2
  with:
    file-mappings: |
      {
        "baseUrl": "https://company.atlassian.net/wiki",
        "user": "${{ secrets.CONFLUENCE_USER }}",
        "pass": "${{ secrets.CONFLUENCE_PASS }}",
        "fileRoot": "docs",
        "pages": [
          {
            "pageId": "123456789",
            "file": "api/readme.md",
            "title": "API Documentation"
          },
          {
            "pageId": "987654321",
            "file": "changelog.html",
            "title": "Release Notes"
          },
          {
            "pageId": "555666777",
            "file": "deployment-guide.txt",
            "title": "Deployment Guide"
          }
        ]
      }
```

### Creating New Pages

```yaml
file-mappings: |
  {
    "baseUrl": "https://company.atlassian.net/wiki",
    "user": "${{ secrets.CONFLUENCE_USER }}",
    "pass": "${{ secrets.CONFLUENCE_PASS }}",
    "pages": [
      {
        "pageId": "new-api-docs",
        "file": "docs/api.md",
        "title": "API Documentation",
        "spaceKey": "DEV",
        "parentId": "123456789"
      }
    ]
  }
```

### Conditional Sync

```yaml
name: Sync Documentation
on:
  push:
    branches: [main]
    paths: ["docs/**"]

jobs:
  sync:
    if: contains(github.event.head_commit.message, '[sync-docs]')
    runs-on: ubuntu-latest
    steps:
      # ... sync steps
```

## Local Development & Testing

### Prerequisites

```bash
# Install dependencies
pnpm install
# or
npm install
```

### Setup Environment

1. **Create a `.env` file** in the project root (if it doesn't exist)

2. **Configure your credentials** in `.env`:
   ```bash
   INPUT_FILE_MAPPINGS='{"baseUrl":"https://company.atlassian.net/wiki","user":"your.email@company.com","pass":"your-token","pages":[...]}'
   INPUT_DEBUG=true
   ```

### Testing Commands

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Show help and available options      |
| `npm run dev:safe`     | Safe dry-run with test configuration |
| `npm run dev:dry-run`  | Dry-run mode (no changes made)       |
| `npm run dev:validate` | Validate credentials and page access |
| `npm run dev:update`   | Test updating existing pages         |
| `npm run dev:create`   | Test creating new pages              |

### Safe Testing

```bash
# Always start with dry-run mode
npm run dev:safe

# Test with your configuration
npm run dev:update -- --dry-run --validate-only
```

## Release Process

This project uses a comprehensive release process with Release Candidates for safe testing:

### Creating a Release Candidate

```bash
# Create RC for testing
./create-rc.sh v1.0.4

# This creates v1.0.4-rc.1 which gets built and tagged automatically
```

### Testing Release Candidates

```yaml
# Test the RC in your workflow
- uses: simonloynes/happi-file-sync-confluence@v2.0.4-rc.1
  with:
    # ... your configuration
```

### Promoting to Stable Release

```bash
# After testing passes
./release.sh --promote-rc v1.0.4-rc.1

# Or create a fresh release
./release.sh v1.0.4
```

## Troubleshooting

### Common Issues

**"Configuration not provided"**

- Ensure `file-mappings` input is provided
- Verify JSON format is valid

**"Page not found" / "Unauthorized"**

- Check your Confluence token permissions
- Verify page IDs exist and are accessible
- Confirm base URL format: `https://company.atlassian.net/wiki`

**"Cannot create pages without space key"**

- Add `spaceKey` field for new pages
- Ensure you have create permissions in the space

**File not found errors**

- Check file paths are relative to repository root or `fileRoot`
- Verify files exist in the repository

### Debug Mode

Enable debug logging for detailed information:

```yaml
- uses: simonloynes/happi-file-sync-confluence@v2
  with:
    debug: "true"
    file-mappings: |
      # ... your config
```

### Getting Help

1. Check the [GitHub Issues](https://github.com/simonloynes/happi-file-sync-confluence/issues)
2. Review the [Action logs](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs) in your workflow
3. Test locally using the development commands above

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Test your changes: `npm run test`
4. Create a Release Candidate: `./create-rc.sh v1.x.x`
5. Test the RC in a real workflow
6. Submit a Pull Request

---

**Made with ❤️ for better documentation workflows**
