# Sample Markdown Document

This is a **sample markdown document** for testing the Confluence sync functionality.

## Features Demonstrated

- **Headers**: Multiple levels of headers
- **Text Formatting**: _italic_, **bold**, and `inline code`
- **Lists**: Both numbered and bulleted lists
- **Links**: [Link to Atlassian](https://www.atlassian.com)

### Code Blocks

Here's a code block example:

```javascript
function sayHello(name) {
	console.log(`Hello, ${name}!`);
	return `Welcome to Confluence sync, ${name}`;
}

sayHello("Developer");
```

### Lists

1. First item
2. Second item
3. Third item with **bold** text

#### Bullet Points

- Simple bullet point
- Another bullet point
- Bullet with `code`

## Testing Notes

This document is used to test:

- Markdown to Confluence storage format conversion
- Local test runner functionality
- Dry-run mode validation
- Content synchronization

---

_Last updated: This will be synced automatically via the GitHub Action_

## Integration Test Scenarios

This file can be used to test various scenarios:

1. **Update existing page**: Set pageId to an existing page
2. **Create new page**: Set pageId to non-existent ID with spaceKey
3. **Content formatting**: Verify markdown conversion works correctly
4. **Error handling**: Test with invalid credentials or missing pages
