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

## Development

This project is built with:

- TypeScript
- Octokit for GitHub API integration
- Zod for schema validation
- Cosmere for Confluence synchronization

## License

MIT
