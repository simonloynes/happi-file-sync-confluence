import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FileMappingsSchema } from "./types.ts";

describe("types and schemas", () => {
	it("should validate correct FileMappingsSchema", () => {
		const validConfig = {
			baseUrl: "https://fake-test-confluence.invalid/rest/api",
			user: "testuser",
			pass: "testpass",
			prefix: "Auto-generated",
			fileRoot: "/test",
			pages: [
				{
					pageId: "123456",
					file: "README.md",
					title: "Test Page"
				}
			]
		};

		const result = FileMappingsSchema.parse(validConfig);

		assert.ok(result, "valid config should parse successfully");
		assert.equal(result.baseUrl, validConfig.baseUrl);
		assert.equal(result.user, validConfig.user);
		assert.equal(result.pass, validConfig.pass);
		assert.equal(result.pages.length, 1);
		assert.equal(result.pages[0].pageId, "123456");
		assert.equal(result.pages[0].file, "README.md");
		assert.equal(result.pages[0].title, "Test Page");
	});

	it("should apply default values for optional fields", () => {
		const minimalConfig = {
			baseUrl: "https://fake-test-confluence.invalid/rest/api",
			user: "testuser",
			pass: "testpass",
			pages: [
				{
					pageId: "123456",
					file: "README.md"
				}
			]
		};

		const result = FileMappingsSchema.parse(minimalConfig);

		assert.ok(result, "minimal config should parse successfully");
		assert.equal(result.pages[0].title, undefined, "optional title should remain undefined");
	});

	it("should reject invalid config missing required fields", () => {
		const invalidConfig = {
			// Missing required baseUrl
			user: "testuser",
			pass: "testpass",
			pages: []
		};

		assert.throws(
			() => FileMappingsSchema.parse(invalidConfig),
			{
				name: "ZodError"
			},
			"should throw ZodError for missing required fields"
		);
	});

	it("should reject invalid page config", () => {
		const invalidConfig = {
			baseUrl: "https://fake-test-confluence.invalid/rest/api",
			user: "testuser",
			pass: "testpass",
			pages: [
				{
					// Missing required pageId and file
					title: "Test Page"
				}
			]
		};

		assert.throws(
			() => FileMappingsSchema.parse(invalidConfig),
			{
				name: "ZodError"
			},
			"should throw ZodError for invalid page config"
		);
	});

	it("should handle user/pass authentication", () => {
		const userPassConfig = {
			baseUrl: "https://fake-test-confluence.invalid/rest/api",
			user: "testuser",
			pass: "testpass",
			pages: [
				{
					pageId: "123456",
					file: "README.md"
				}
			]
		};

		const result = FileMappingsSchema.parse(userPassConfig);

		assert.ok(result, "user/pass config should parse successfully");
		assert.equal(result.user, "testuser");
		assert.equal(result.pass, "testpass");
	});

	it("should handle empty pages array", () => {
		const emptyPagesConfig = {
			baseUrl: "https://fake-test-confluence.invalid/rest/api",
			user: "testuser",
			pass: "testpass",
			pages: []
		};

		const result = FileMappingsSchema.parse(emptyPagesConfig);

		assert.ok(result, "empty pages config should parse successfully");
		assert.equal(result.pages.length, 0);
	});

});
