# Happi File Sync Confluence

A tool to sync files from GitHub repositories to Confluence pages using the Cosmere library.

## Features

- Sync markdown files from GitHub to Confluence
- Configurable file mappings
- Integration with GitHub API via Octokit
- Built on top of the Cosmere library for Confluence synchronization

## Installation

```bash
npm install
# or
pnpm install
```

## Usage

The tool uses TypeScript and requires configuration of file mappings to specify which GitHub files should sync to which Confluence pages.

## Configuration

File mappings are defined using the `FileMappingsSchema` which includes:

- **baseUrl**: Confluence base URL (including `/rest/api`)
- **user/pass**: Username/password authentication (optional)
- **personalAccessToken**: Personal access token authentication (optional)
- **cachePath**: Build cache directory (default: "build")
- **prefix**: Optional prefix text for generated pages
- **pages**: Array of page mappings with:
  - `pageId`: Confluence page ID
  - `file`: GitHub file path
  - `title`: Optional page title

## Local Development & Testing

### Quick Start

1. **Setup environment**:

   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your Confluence credentials
   nano .env
   ```

2. **Run safe test first**:

   ```bash
   # Dry run - shows what would be synced without making changes
   npm run dev:safe
   ```

3. **Test with your configuration**:
   ```bash
   # Edit test-data/configs/update-test.json with your page IDs
   npm run dev:update -- --dry-run
   ```

### Available Commands

| Command                | Description                                 |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Show help and available options             |
| `npm run dev:dry-run`  | Run sync in dry-run mode (safe, no changes) |
| `npm run dev:validate` | Validate credentials and page accessibility |
| `npm run dev:update`   | Test updating existing pages                |
| `npm run dev:create`   | Test creating new pages                     |
| `npm run dev:safe`     | Safe dry-run with sandbox configuration     |

### Configuration Options

**Method 1: Environment Variables (.env file)**

```bash
INPUT_FILE_MAPPINGS='{"baseUrl":"https://company.atlassian.net/wiki",...}'
INPUT_DEBUG=true
```

**Method 2: Configuration Files**

```bash
# Use a JSON config file
tsx src/local-runner.ts --config test-data/configs/update-test.json
```

**Method 3: Command Line**

```bash
# Combine config file with options
npm run dev:update -- --dry-run --validate-only
```

### Authentication Options

1. **Personal Access Token (Recommended)**:

   ```json
   {
   	"baseUrl": "https://company.atlassian.net/wiki",
   	"personalAccessToken": "your-pat-token"
   }
   ```

2. **Username/Password**:
   ```json
   {
   	"baseUrl": "https://company.atlassian.net/wiki",
   	"user": "your-email@company.com",
   	"pass": "your-api-token"
   }
   ```

### Test Files Structure

```
test-data/
├── sample.md          # Sample markdown file
├── sample.html        # Sample HTML file
├── sample.txt         # Sample plain text
└── configs/
    ├── update-test.json   # Test updating existing pages
    ├── create-test.json   # Test creating new pages
    └── dry-run.json       # Safe testing configuration
```

### Page Configuration

**Update existing page**:

```json
{
	"pageId": "123456789",
	"file": "sample.md",
	"title": "Updated Page Title"
}
```

**Create new page**:

```json
{
	"pageId": "new-page-id",
	"file": "sample.md",
	"title": "New Page Title",
	"spaceKey": "DEV",
	"parentId": "parent-page-id"
}
```

### Safety Features

- **🔍 Dry-run mode**: Preview changes without making them
- **✅ Validation mode**: Check credentials and page access only
- **📝 Verbose logging**: See exactly what will be modified
- **🔐 Credential protection**: .env files are git-ignored
- **🚫 Safe defaults**: Dry-run enabled by default

### Troubleshooting

**Common Issues:**

1. **"Configuration not provided"**
   - Ensure .env file exists or use --config flag
   - Check INPUT_FILE_MAPPINGS format is valid JSON

2. **"Page not found"**
   - Verify pageId is correct
   - Check authentication credentials
   - Use --validate-only to test connectivity

3. **"Cannot create new pages without space key"**
   - Add "spaceKey" field to page configuration
   - Ensure you have permissions to create pages in that space

4. **Authentication errors**
   - For Atlassian Cloud, use API tokens instead of passwords
   - Verify base URL format: `https://company.atlassian.net/wiki`

### Development

This project is built with:

- TypeScript
- Node.js fetch API for Confluence REST API
- Zod for schema validation
- GitHub Actions core for CI/CD integration

## License

MIT
