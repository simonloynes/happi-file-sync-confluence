/**
 * Types for HTML to Confluence storage format conversion
 */
export interface HtmlParserOptions {
	/**
	 * Whether to wrap the HTML content in a paragraph tag if it's not already wrapped
	 * @default true
	 */
	wrapInParagraph?: boolean;
}

/**
 * Convert HTML content to Confluence storage format
 * 
 * If content is already HTML, wrap it in basic Confluence storage format.
 * This is a basic implementation - for production use, consider using a proper HTML parser
 * to ensure the HTML is valid and properly formatted for Confluence.
 * 
 * @param content - HTML content to convert
 * @param options - Parser options
 * @returns HTML content wrapped in Confluence storage format
 */
export function convertHtmlToConfluenceStorage(
	content: string,
	options: HtmlParserOptions = {}
): string {
	const { wrapInParagraph = true } = options;

	if (!wrapInParagraph) {
		return content;
	}

	// If content is already HTML, wrap it in basic Confluence storage format
	return `<p>${content}</p>`;
}

