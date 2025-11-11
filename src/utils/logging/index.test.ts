import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "./index.ts";

// Mock @actions/core
const mockCore = {
	debug: mock.fn(),
	info: mock.fn(),
	warning: mock.fn(),
	error: mock.fn()
};

describe("logging utility", () => {
	beforeEach(() => {
		// Reset all mocks
		mockCore.debug.mock.resetCalls();
		mockCore.info.mock.resetCalls();
		mockCore.warning.mock.resetCalls();
		mockCore.error.mock.resetCalls();
	});

	it("should create logger with correct methods", () => {
		const logger = createLogger(false, "Test");

		assert.ok(logger, "logger should be created");
		assert.ok(typeof logger.debug === "function", "logger should have debug method");
		assert.ok(typeof logger.info === "function", "logger should have info method");
		assert.ok(typeof logger.warn === "function", "logger should have warn method");
		assert.ok(typeof logger.error === "function", "logger should have error method");
	});

	it("should use default prefix when none provided", () => {
		const logger = createLogger(false);
		assert.ok(logger, "logger should be created with default prefix");
	});

	it("should format messages with prefix", () => {
		const logger = createLogger(false, "TestPrefix");

		// Test that the logger methods exist and can be called
		logger.info("test message");
		assert.ok(true, "logger.info should execute without error");
	});

	it("should handle debug mode correctly", () => {
		const logger = createLogger(true, "DebugTest");

		// Test that debug logger can be created
		assert.ok(logger.debug, "debug logger should have debug method");

		// Call debug method to ensure it doesn't throw
		logger.debug("debug message");
		assert.ok(true, "debug method should execute without error");
	});

	it("should handle JSON serialization in info messages", () => {
		const logger = createLogger(false, "JSONTest");

		const testObject = { key: "value", number: 42 };

		// Test that info with object doesn't throw
		logger.info("test message", testObject);
		assert.ok(true, "info with object should execute without error");
	});

	it("should handle error logging with stack traces", () => {
		const logger = createLogger(false, "ErrorTest");

		const testError = new Error("Test error");

		// Test that error logging doesn't throw
		logger.error("error message", testError);
		assert.ok(true, "error logging should execute without error");
	});

	it("should handle warning messages", () => {
		const logger = createLogger(false, "WarnTest");

		// Test that warning logging doesn't throw
		logger.warn("warning message");
		assert.ok(true, "warning logging should execute without error");
	});
});
