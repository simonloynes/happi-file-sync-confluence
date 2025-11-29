import { convertHtmlToConfluenceStorage, HtmlParserOptions } from "./confluence-html-parser";
import { convertMarkdownToConfluenceStorage } from "./confluence-markdown-parser";
import { convertPlainTextToConfluenceStorage, PlainTextParserOptions } from "./confluence-plaintext-parser";

/**
 * Content type for conversion
 */
export type ContentType = "markdown" | "html" | "plain";

/**
 * Options for content conversion
 */
export interface ConverterOptions {
	html?: HtmlParserOptions;
	plain?: PlainTextParserOptions;
}

/**
 * Convert content to Confluence storage format
 * 
 * This function routes content to the appropriate parser based on the content type.
 * 
 * @param content - Content to convert
 * @param contentType - Type of content (markdown, html, or plain)
 * @param options - Optional parser-specific options
 * @returns HTML content in Confluence storage format
 */
export function convertToConfluenceStorage(
	content: string,
	contentType: ContentType = "plain",
	options: ConverterOptions = {}
): string {
	switch (contentType) {
		case "html":
			return convertHtmlToConfluenceStorage(content, options.html);
		case "markdown":
			return convertMarkdownToConfluenceStorage(content);
		case "plain":
		default:
			return convertPlainTextToConfluenceStorage(content, options.plain);
	}
}

