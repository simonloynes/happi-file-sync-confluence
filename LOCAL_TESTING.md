# Local Testing Guide

## Quick Start

1. **Copy environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your credentials:**

   ```bash
   # Edit the INPUT_FILE_MAPPINGS with your Confluence details
   nano .env
   ```

3. **Run a safe test first:**
   ```bash
   npm run dev:safe
   ```

## Available Commands

| Command                | Description            | Example                        |
| ---------------------- | ---------------------- | ------------------------------ |
| `npm run dev`          | Show help              |                                |
| `npm run dev:dry-run`  | Preview changes (safe) | See what would be synced       |
| `npm run dev:validate` | Test credentials only  | Check connection & permissions |
| `npm run dev:update`   | Test updating pages    | Uses `update-test.json` config |
| `npm run dev:create`   | Test creating pages    | Uses `create-test.json` config |
| `npm run dev:safe`     | Safe sandbox test      | Uses `dry-run.json` config     |

## Configuration Methods

### Method 1: Environment Variables (.env file)

```bash
INPUT_FILE_MAPPINGS='{"baseUrl":"https://company.atlassian.net/wiki",...}'
INPUT_DEBUG=true
npm run dev:dry-run
```

### Method 2: Configuration Files

```bash
npx tsx src/local-runner.ts --config test-data/configs/update-test.json --dry-run
```

### Method 3: Command Line Environment

```bash
INPUT_FILE_MAPPINGS='{"baseUrl":"..."}' npx tsx src/local-runner.ts --validate-only
```

## Authentication Examples

**Personal Access Token (Recommended):**

```json
{
	"baseUrl": "https://company.atlassian.net/wiki",
	"personalAccessToken": "ATATT3xFfGF0..."
}
```

**Username/Password:**

```json
{
	"baseUrl": "https://company.atlassian.net/wiki",
	"user": "your-email@company.com",
	"pass": "your-api-token"
}
```

## Page Configuration Examples

**Update existing page:**

```json
{
	"pageId": "123456789",
	"file": "docs/readme.md",
	"title": "Updated Documentation"
}
```

**Create new page:**

```json
{
	"pageId": "new-page",
	"file": "docs/feature.md",
	"title": "New Feature",
	"spaceKey": "DEV",
	"parentId": "987654321"
}
```

## Test Files

The `test-data/` directory contains:

- **`sample.md`** - Markdown file with headers, code blocks, lists
- **`sample.html`** - HTML content for testing HTML sync
- **`sample.txt`** - Plain text for basic formatting tests

## Configuration Files

- **`test-data/configs/update-test.json`** - Test updating existing pages
- **`test-data/configs/create-test.json`** - Test creating new pages
- **`test-data/configs/dry-run.json`** - Safe testing configuration

## Safety Features

- **🔍 Dry-run mode**: Default for most commands - shows what would change
- **✅ Validation mode**: Tests connectivity without making changes
- **📝 Verbose logging**: See exactly what will be modified
- **🔐 Credential protection**: `.env` files are git-ignored

## Troubleshooting

**"Configuration not provided"**

- Ensure `.env` file exists or use `--config` flag
- Check that `INPUT_FILE_MAPPINGS` is valid JSON

**"Page not found"**

- Verify `pageId` is correct
- Check authentication credentials
- Use `--validate-only` to test connectivity first

**Authentication errors**

- For Atlassian Cloud, use API tokens instead of passwords
- Verify base URL format: `https://company.atlassian.net/wiki`

**File not found**

- Check `fileRoot` path in configuration
- Ensure test files exist in `test-data/` directory

## Example Workflow

1. **Start with validation:**

   ```bash
   npm run dev:validate
   ```

2. **Test with dry-run:**

   ```bash
   npm run dev:update -- --dry-run
   ```

3. **Run actual sync:**

   ```bash
   npm run dev:update
   ```

4. **Check results in Confluence**
