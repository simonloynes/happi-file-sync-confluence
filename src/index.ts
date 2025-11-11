import * as core from "@actions/core";
import { syncFiles } from "./syncFiles";
import { FileMappingsSchema } from "./types";
import { createLogger } from "./utils/logging";

export async function run(): Promise<void> {
	const debug = core.getInput("debug") === "true";

	const filesInput = JSON.parse(core.getInput("file-mappings"));
	const fileMaps = FileMappingsSchema.parse(filesInput);

	const logger = createLogger(debug, "FileSyncConfluence");
	logger.info(`Starting sync for ${fileMaps.pages.length} pages`);

	await Promise.all(
		fileMaps.pages.map(async (page) => {
			await syncFiles({ fileMap: fileMaps, page });
		})
	);

	logger.info("All pages synced successfully");
}
