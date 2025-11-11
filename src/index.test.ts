import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("index module", () => {
	it("should export run function", async () => {
		const indexModule = await import("./index.ts");

		assert.ok(indexModule.run, "run function should be exported");
		assert.equal(typeof indexModule.run, "function", "exported run should be a function");
	});

	it("should have correct function signature", async () => {
		const { run } = await import("./index.ts");

		// Verify the function exists and is async
		assert.ok(run, "run function should exist");
		assert.equal(typeof run, "function", "run should be a function");
		assert.equal(run.constructor.name, "AsyncFunction", "run should be async");
	});
});
