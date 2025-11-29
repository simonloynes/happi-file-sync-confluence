import { marked } from "marked";


/**
 * Convert Markdown content to Confluence storage format
 * 
 * Uses the 'marked' library to parse markdown and converts the output
 * to Confluence storage format. Handles:
 * - All standard markdown features (headers, lists, tables, etc.)
 * - Code blocks (converted to Confluence code macro)
 * - Inline code
 * - Links, images, and other markdown elements
 * 
 * @param content - Markdown content to convert
 * @returns HTML content in Confluence storage format
 */
export function convertMarkdownToConfluenceStorage(
	content: string
): string {
	// Parse markdown to HTML using marked
	let html = marked.parse(content, {
		breaks: false,
		gfm: true, // GitHub Flavored Markdown
	}) as string;

	// Convert code blocks from <pre><code> to Confluence's code macro format
	// This regex matches <pre><code> blocks (with optional language class)
	html = html.replace(
		/<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g,
		(_match, _language, code) => {
			// Decode HTML entities in the code content
			// Note: Decode &amp; last since it's used to encode the & character
			const decodedCode = code
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/&amp;/g, "&");
			
			// Trim leading/trailing newlines
			const trimmedCode = decodedCode.replace(/^\n+|\n+$/g, "");
			
			return `<ac:structured-macro ac:name="code"><ac:plain-text-body><![CDATA[${trimmedCode}]]></ac:plain-text-body></ac:structured-macro>`;
		}
	);

	return html;
}

