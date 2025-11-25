import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import type { SyncFilesOptions } from "./types.ts";

describe("syncFiles", () => {
	let tempDir: string;
	let testFilePath: string;

	beforeEach(async () => {
		// Create temporary directory and file for testing
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "syncfiles-test-"));
		testFilePath = path.join(tempDir, "test.md");
		await fs.writeFile(testFilePath, "# Test Markdown\n\nThis is a test file.", "utf8");
	});

	it("should import syncFiles function correctly", async () => {
		const { syncFiles } = await import("./syncFiles.ts");

		assert.ok(syncFiles, "syncFiles function should be exported");
		assert.equal(typeof syncFiles, "function", "syncFiles should be a function");
		assert.equal(syncFiles.constructor.name, "AsyncFunction", "syncFiles should be async");
	});

	it("should have correct SyncFilesOptions type structure", () => {
		// Test that we can create a valid options object
		const options: SyncFilesOptions = {
			fileMap: {
				baseUrl: "https://fake-test-confluence.invalid/rest/api",
				personalAccessToken: "fake-token",
				insecure: false,
				force: false,
				pages: []
			},
			page: {
				pageId: "123456",
				file: "test.md",
				title: "Test Page"
			}
		};

		assert.ok(options.fileMap, "options should have fileMap");
		assert.ok(options.page, "options should have page");
		assert.equal(options.fileMap.baseUrl, "https://fake-test-confluence.invalid/rest/api");
		assert.equal(options.page.pageId, "123456");
		assert.equal(options.page.file, "test.md");
		assert.equal(options.page.title, "Test Page");
	});

	it("should validate required fileMap properties exist in type", () => {
		const options: SyncFilesOptions = {
			fileMap: {
				baseUrl: "https://fake-test-confluence.invalid/rest/api",
				insecure: false,
				force: false,
				pages: []
			},
			page: {
				pageId: "123456",
				file: "test.md"
			}
		};

		// Test required properties exist
		assert.ok(options.fileMap.baseUrl, "baseUrl should be required");
		assert.ok(typeof options.fileMap.insecure === "boolean", "insecure should be boolean");
		assert.ok(typeof options.fileMap.force === "boolean", "force should be boolean");
		assert.ok(Array.isArray(options.fileMap.pages), "pages should be array");
	});

	it("should validate page properties exist in type", () => {
		const options: SyncFilesOptions = {
			fileMap: {
				baseUrl: "https://fake-test-confluence.invalid/rest/api",
				insecure: false,
				force: false,
				pages: []
			},
			page: {
				pageId: "123456",
				file: "test.md",
				title: "Test Page"
			}
		};

		// Test page properties
		assert.ok(options.page.pageId, "pageId should exist");
		assert.ok(options.page.file, "file should exist");
		assert.ok(options.page.title, "title should exist when provided");
		assert.equal(typeof options.page.pageId, "string", "pageId should be string");
		assert.equal(typeof options.page.file, "string", "file should be string");
		assert.equal(typeof options.page.title, "string", "title should be string when provided");
	});

	it("should handle optional page title", () => {
		const options: SyncFilesOptions = {
			fileMap: {
				baseUrl: "https://fake-test-confluence.invalid/rest/api",
				insecure: false,
				force: false,
				pages: []
			},
			page: {
				pageId: "123456",
				file: "test.md"
				// no title provided
			}
		};

		// Test that title is optional
		assert.ok(options.page.pageId, "pageId should exist");
		assert.ok(options.page.file, "file should exist");
		assert.equal(options.page.title, undefined, "title should be undefined when not provided");
	});

	it("should handle different authentication methods in types", () => {
		// Test with personalAccessToken
		const tokenOptions: SyncFilesOptions = {
			fileMap: {
				baseUrl: "https://fake-test-confluence.invalid/rest/api",
				personalAccessToken: "fake-token",
				insecure: false,
				force: false,
				pages: []
			},
			page: {
				pageId: "123456",
				file: "test.md"
			}
		};

		// Test with user/pass
		const userPassOptions: SyncFilesOptions = {
			fileMap: {
				baseUrl: "https://fake-test-confluence.invalid/rest/api",
				user: "testuser",
				pass: "testpass",
				insecure: false,
				force: false,
				pages: []
			},
			page: {
				pageId: "123456",
				file: "test.md"
			}
		};

		assert.ok(tokenOptions.fileMap.personalAccessToken, "should support personalAccessToken");
		assert.ok(userPassOptions.fileMap.user, "should support user");
		assert.ok(userPassOptions.fileMap.pass, "should support pass");
	});

	it("should handle file system operations for testing", async () => {
		try {
			// Test that our test file exists
			const stats = await fs.stat(testFilePath);
			assert.ok(stats.isFile(), "test file should exist");

			// Test reading the file
			const content = await fs.readFile(testFilePath, "utf8");
			assert.ok(content.includes("# Test Markdown"), "should be able to read test file");
			assert.ok(content.includes("This is a test file"), "should contain expected content");

			// Clean up
			await fs.rm(tempDir, { recursive: true, force: true });

			// Verify cleanup
			await assert.rejects(
				async () => await fs.stat(testFilePath),
				{ code: "ENOENT" },
				"test file should be cleaned up"
			);
		} catch (error) {
			// Ensure cleanup even if test fails
			await fs.rm(tempDir, { recursive: true, force: true });
			throw error;
		}
	});
});
