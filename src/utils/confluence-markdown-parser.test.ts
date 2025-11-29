import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { convertMarkdownToConfluenceStorage } from "./confluence-markdown-parser.ts";

describe("confluence-markdown-parser", () => {
	describe("basic markdown features", () => {
		it("should convert simple paragraph text", () => {
			const markdown = "Hello world";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<p>Hello world</p>"), "should contain paragraph tag");
		});

		it("should convert multiple paragraphs", () => {
			const markdown = "First paragraph.\n\nSecond paragraph.";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<p>First paragraph.</p>"), "should contain first paragraph");
			assert.ok(result.includes("<p>Second paragraph.</p>"), "should contain second paragraph");
		});

		it("should convert headers", () => {
			const markdown = "# H1 Header\n## H2 Header\n### H3 Header";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<h1>H1 Header</h1>"), "should contain h1");
			assert.ok(result.includes("<h2>H2 Header</h2>"), "should contain h2");
			assert.ok(result.includes("<h3>H3 Header</h3>"), "should contain h3");
		});

		it("should convert bold text", () => {
			const markdown = "This is **bold** text";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<strong>bold</strong>"), "should contain strong tag");
		});

		it("should convert italic text", () => {
			const markdown = "This is *italic* text";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<em>italic</em>"), "should contain em tag");
		});

		it("should convert links", () => {
			const markdown = "Visit [example](https://example.com)";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes('<a href="https://example.com">example</a>'), "should contain link");
		});
	});

	describe("code blocks", () => {
		it("should convert code blocks to Confluence macro format", () => {
			const markdown = "```\nconst x = 1;\n```";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(
				result.includes('<ac:structured-macro ac:name="code">'),
				"should contain Confluence code macro"
			);
			assert.ok(
				result.includes("<ac:plain-text-body>"),
				"should contain plain-text-body tag"
			);
			assert.ok(
				result.includes("<![CDATA[const x = 1;]]>"),
				"should contain code in CDATA"
			);
		});

		it("should convert code blocks with language", () => {
			const markdown = "```javascript\nconst x = 1;\n```";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(
				result.includes('<ac:structured-macro ac:name="code">'),
				"should contain Confluence code macro"
			);
			assert.ok(
				result.includes("<![CDATA[const x = 1;]]>"),
				"should contain code in CDATA"
			);
		});

		it("should handle code blocks with special characters", () => {
			const markdown = "```\nif (x < 5 && y > 10) {\n  return \"test\";\n}\n```";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(
				result.includes('<ac:structured-macro ac:name="code">'),
				"should contain Confluence code macro"
			);
			// Check that special characters are properly decoded
			assert.ok(result.includes("<![CDATA["), "should contain CDATA section");
			assert.ok(result.includes("if (x < 5 && y > 10)"), "should decode < and >");
			assert.ok(result.includes('return "test"'), "should decode quotes");
		});

		it("should handle code blocks with HTML entities", () => {
			const markdown = "```\n<div>test</div>\n```";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(
				result.includes('<ac:structured-macro ac:name="code">'),
				"should contain Confluence code macro"
			);
			// The HTML entities should be decoded in the CDATA
			assert.ok(result.includes("<![CDATA[<div>test</div>]]>"), "should decode HTML entities");
		});

		it("should trim leading and trailing newlines from code blocks", () => {
			const markdown = "```\n\nconst x = 1;\n\n```";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(
				result.includes("<![CDATA[const x = 1;]]>"),
				"should trim newlines and contain code"
			);
			assert.ok(
				!result.includes("<![CDATA[\n\nconst x = 1;]]>"),
				"should not have leading newlines"
			);
		});

		it("should handle multiple code blocks", () => {
			const markdown = "```\ncode1\n```\n\n```\ncode2\n```";
			const result = convertMarkdownToConfluenceStorage(markdown);

			const macroCount = (result.match(/<ac:structured-macro ac:name="code">/g) || []).length;
			assert.equal(macroCount, 2, "should contain two code macros");
		});
	});

	describe("inline code", () => {
		it("should convert inline code", () => {
			const markdown = "Use `const x = 1;` in your code";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<code>const x = 1;</code>"), "should contain code tag");
		});

		it("should handle inline code with special characters", () => {
			const markdown = "Check `x < 5 && y > 10`";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<code>"), "should contain code tag");
		});
	});

	describe("lists", () => {
		it("should convert unordered lists", () => {
			const markdown = "- Item 1\n- Item 2\n- Item 3";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<ul>"), "should contain ul tag");
			assert.ok(result.includes("<li>Item 1</li>"), "should contain list items");
		});

		it("should convert ordered lists", () => {
			const markdown = "1. First\n2. Second\n3. Third";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<ol>"), "should contain ol tag");
			assert.ok(result.includes("<li>First</li>"), "should contain list items");
		});
	});

	describe("tables", () => {
		it("should convert markdown tables", () => {
			const markdown = "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(result.includes("<table>"), "should contain table tag");
			assert.ok(result.includes("<th>Header 1</th>"), "should contain table headers");
			assert.ok(result.includes("<td>Cell 1</td>"), "should contain table cells");
		});
	});

	describe("edge cases", () => {
		it("should handle empty string", () => {
			const markdown = "";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(typeof result === "string", "should return a string");
		});

		it("should handle whitespace-only content", () => {
			const markdown = "   \n\n   ";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(typeof result === "string", "should return a string");
		});

		it("should handle code block with empty content", () => {
			const markdown = "```\n\n```";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(
				result.includes('<ac:structured-macro ac:name="code">'),
				"should contain Confluence code macro even for empty code"
			);
		});

		it("should handle mixed content with code blocks and text", () => {
			const markdown = "Here's some text.\n\n```\nconst x = 1;\n```\n\nMore text here.";
			const result = convertMarkdownToConfluenceStorage(markdown);

			// Check that the text content is present (apostrophe might be encoded)
			assert.ok(
				result.includes("Here") && result.includes("some text"),
				"should contain first paragraph text"
			);
			assert.ok(
				result.includes('<ac:structured-macro ac:name="code">'),
				"should contain code macro"
			);
			assert.ok(
				result.includes("More text here"),
				"should contain second paragraph text"
			);
			// Verify paragraph tags are present
			assert.ok(result.includes("<p>"), "should contain paragraph tags");
		});

		it("should handle code blocks with ampersands", () => {
			const markdown = "```\nif (x && y) {}\n```";
			const result = convertMarkdownToConfluenceStorage(markdown);

			assert.ok(
				result.includes("<![CDATA[if (x && y) {}]]>"),
				"should properly decode ampersands"
			);
		});
	});
});

