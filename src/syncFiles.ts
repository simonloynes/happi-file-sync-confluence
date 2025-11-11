import * as core from "@actions/core";
import { SyncFilesOptions } from "./types";
import { createLogger } from "./utils/logging";

export async function syncFiles(options: SyncFilesOptions): Promise<void> {
	const { fileMap, page } = options;
	const { baseUrl, user, pass, personalAccessToken, cachePath, prefix, insecure, force, fileRoot } = fileMap;

	const logger = createLogger(core.getInput("debug") === "true", "Cosmere");

	logger.info(`Starting sync for page ${page.pageId}: ${page.file} -> ${page.title || "untitled"}`);

	try {
		// Import filesystem utilities
		const fs = await import("fs/promises");
		const path = await import("path");

		// Check if file exists locally
		const filePath = path.resolve(fileRoot || process.cwd(), page.file);
		logger.info(`Reading file from local filesystem: ${filePath}`);

		try {
			await fs.access(filePath);
		} catch {
			throw new Error(`File ${page.file} not found at ${filePath}`);
		}

		// Prepare cosmere configuration for this specific page
		const cosmereConfig = {
			baseUrl,
			user,
			pass,
			personalAccessToken,
			cachePath: cachePath || "build",
			prefix: prefix || "This document is automatically generated. Please don't edit it directly!",
			insecure: insecure || false,
			force: force || false,
			fileRoot: fileRoot || process.cwd(),
			pages: [
				{
					pageId: page.pageId,
					file: page.file,
					title: page.title
				}
			]
		};

		logger.info(`Syncing ${page.file} to Confluence page ${page.pageId}`);

		// Sync with Confluence using cosmere
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const cosmereLib = require("cosmere/dist/src/lib") as (config: any) => Promise<void>;
		await cosmereLib(cosmereConfig);

		logger.info(`Successfully synced ${page.file} to Confluence page ${page.pageId}`);

		// Set GitHub Actions outputs
		core.setOutput("page-id", page.pageId);
		core.setOutput("page-title", page.title || "untitled");
		core.setOutput("file-path", page.file);
		core.setOutput("status", "success");
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(`Error syncing ${page.file} to Confluence page ${page.pageId}: ${errorMessage}`);

		if (error instanceof Error && error.stack) {
			logger.debug(`Error stack: ${error.stack}`);
		}

		// Set failure outputs
		core.setOutput("status", "failed");
		core.setOutput("error", errorMessage);

		// Re-throw to maintain error behavior
		throw error;
	}
}
