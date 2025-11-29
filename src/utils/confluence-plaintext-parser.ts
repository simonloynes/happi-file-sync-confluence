/**
 * Types for Plain text to Confluence storage format conversion
 */
export interface PlainTextParserOptions {
	/**
	 * Whether to split content into paragraphs based on double newlines
	 * @default true
	 */
	splitParagraphs?: boolean;
}

/**
 * Convert plain text content to Confluence storage format
 * 
 * Plain text is wrapped in paragraphs and handles line breaks.
 * Content is split into paragraphs based on double newlines.
 * 
 * @param content - Plain text content to convert
 * @param options - Parser options
 * @returns HTML content in Confluence storage format
 */
export function convertPlainTextToConfluenceStorage(
	content: string,
	options: PlainTextParserOptions = {}
): string {
	const { splitParagraphs = true } = options;

	if (!splitParagraphs) {
		// Just wrap the entire content in a paragraph and replace newlines with <br/>
		return `<p>${content.replace(/\n/g, "<br/>")}</p>`;
	}

	// Plain text - wrap in paragraphs and handle line breaks
	const paragraphs = content
		.split("\n\n")
		.map((p) => p.trim())
		.filter((p) => p.length > 0);

	if (paragraphs.length === 0) {
		return "<p></p>";
	}

	return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
}

