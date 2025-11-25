import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FileMappingsSchema } from "./types.ts";

describe("types and schemas", () => {
	it("should validate correct FileMappingsSchema", () => {
		const validConfig = {
			baseUrl: "https://fake-test-confluence.invalid/rest/api",
			personalAccessToken: "fake-token",
			prefix: "Auto-generated",
			insecure: false,
			force: false,
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
		assert.equal(result.personalAccessToken, validConfig.personalAccessToken);
		assert.equal(result.pages.length, 1);
		assert.equal(result.pages[0].pageId, "123456");
		assert.equal(result.pages[0].file, "README.md");
		assert.equal(result.pages[0].title, "Test Page");
	});

	it("should apply default values for optional fields", () => {
		const minimalConfig = {
			baseUrl: "https://fake-test-confluence.invalid/rest/api",
			personalAccessToken: "fake-token",
			pages: [
				{
					pageId: "123456",
					file: "README.md"
				}
			]
		};

		const result = FileMappingsSchema.parse(minimalConfig);

		assert.ok(result, "minimal config should parse successfully");
		assert.equal(result.insecure, false, "should apply default insecure");
		assert.equal(result.force, false, "should apply default force");
		assert.equal(result.pages[0].title, undefined, "optional title should remain undefined");
	});

	it("should reject invalid config missing required fields", () => {
		const invalidConfig = {
			// Missing required baseUrl
			personalAccessToken: "fake-token",
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
			personalAccessToken: "fake-token",
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
		assert.equal(result.personalAccessToken, undefined);
	});

	it("should handle empty pages array", () => {
		const emptyPagesConfig = {
			baseUrl: "https://fake-test-confluence.invalid/rest/api",
			personalAccessToken: "fake-token",
			pages: []
		};

		const result = FileMappingsSchema.parse(emptyPagesConfig);

		assert.ok(result, "empty pages config should parse successfully");
		assert.equal(result.pages.length, 0);
	});

	it("should handle boolean type validation", () => {
		const booleanConfig = {
			baseUrl: "https://fake-test-confluence.invalid/rest/api",
			personalAccessToken: "fake-token",
			insecure: true,
			force: true,
			pages: []
		};

		const result = FileMappingsSchema.parse(booleanConfig);

		assert.ok(result, "boolean config should parse successfully");
		assert.equal(result.insecure, true);
		assert.equal(result.force, true);
	});
});
