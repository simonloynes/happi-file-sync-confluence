#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { syncFiles } from "./syncFiles";
import { FileMappingsSchema } from "./types";
import { createLogger } from "./utils/logging";

// Mock @actions/core for local development
interface MockCore {
	getInput(name: string): string;
	setOutput(name: string, value: any): void;
	setFailed(message: string): void;
	info(message: string): void;
	warning(message: string): void;
	error(message: string): void;
	debug(message: string): void;
}

class LocalRunner {
	private mockCore: MockCore;
	private logger = createLogger(true, "LocalRunner");
	private dryRun = false;
	private validateOnly = false;
	private config: any = null;

	constructor() {
		this.mockCore = this.createMockCore();
		this.parseArguments();
		this.loadEnvironment();
	}

	private parseArguments() {
		const args = process.argv.slice(2);

		for (let i = 0; i < args.length; i++) {
			const arg = args[i];

			if (arg === "--dry-run") {
				this.dryRun = true;
				this.logger.info("🔍 Running in DRY-RUN mode - no changes will be made");
			} else if (arg === "--validate-only") {
				this.validateOnly = true;
				this.logger.info("✓ Running in VALIDATION mode - checking connections only");
			} else if (arg === "--config" && i + 1 < args.length) {
				const configPath = resolve(args[i + 1]);
				if (!existsSync(configPath)) {
					throw new Error(`Configuration file not found: ${configPath}`);
				}
				this.config = JSON.parse(readFileSync(configPath, "utf-8"));
				this.logger.info(`📄 Loaded configuration from: ${configPath}`);
				i++; // Skip next argument as it's the config path
			} else if (arg === "--help" || arg === "-h") {
				this.showHelp();
				process.exit(0);
			}
		}
	}

	private loadEnvironment() {
		// Try to load .env file if it exists
		const envPath = resolve(".env");
		if (existsSync(envPath)) {
			const envContent = readFileSync(envPath, "utf-8");

			// Parse environment variables, handling multiline values
			const envVars = this.parseEnvFile(envContent);

			Object.entries(envVars).forEach(([key, value]) => {
				process.env[key] = value;
			});

			this.logger.info("📁 Loaded environment variables from .env file");
		}
	}

	private parseEnvFile(content: string): Record<string, string> {
		const envVars: Record<string, string> = {};
		const lines = content.split("\n");
		let i = 0;

		while (i < lines.length) {
			const line = lines[i].trim();

			// Skip empty lines and comments
			if (!line || line.startsWith("#")) {
				i++;
				continue;
			}

			// Check if this line contains a variable assignment
			const equalIndex = line.indexOf("=");
			if (equalIndex === -1) {
				i++;
				continue;
			}

			const key = line.substring(0, equalIndex).trim();
			let value = line.substring(equalIndex + 1).trim();

			// Handle quoted values and multiline JSON
			if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
				// Single-line quoted value
				value = value.slice(1, -1);
			} else if (value.startsWith("'") || value.startsWith('"')) {
				// Multiline quoted value - collect all lines until closing quote
				const quote = value[0];
				value = value.slice(1); // Remove opening quote
				i++;

				while (i < lines.length) {
					const nextLine = lines[i];
					if (nextLine.trim().endsWith(quote)) {
						// Found closing quote
						value += "\n" + nextLine.trim().slice(0, -1);
						break;
					} else {
						value += "\n" + nextLine;
					}
					i++;
				}
			}

			if (key && value !== undefined) {
				envVars[key] = value;
			}
			i++;
		}

		return envVars;
	}

	private createMockCore(): MockCore {
		const self = this;
		return {
			getInput: (name: string): string => {
				const envKey = `INPUT_${name.toUpperCase().replace(/-/g, "_")}`;
				let value = process.env[envKey] || "";

				// If we have a config file, use it for file-mappings
				if (name === "file-mappings" && self.config) {
					value = JSON.stringify(self.config);
				}

				self.logger.debug(`getInput(${name}) = ${value ? "[LOADED]" : "[EMPTY]"}`);
				return value;
			},
			setOutput: (name: string, value: any): void => {
				console.log(`🔧 OUTPUT: ${name}=${value}`);
			},
			setFailed: (message: string): void => {
				console.error(`❌ FAILED: ${message}`);
				process.exit(1);
			},
			info: (message: string): void => {
				console.log(`ℹ️  ${message}`);
			},
			warning: (message: string): void => {
				console.warn(`⚠️  ${message}`);
			},
			error: (message: string): void => {
				console.error(`❌ ${message}`);
			},
			debug: (message: string): void => {
				if (process.env.INPUT_DEBUG === "true") {
					console.log(`🐛 ${message}`);
				}
			}
		};
	}

	private showHelp() {
		console.log(`
🧪 Happi File Sync Confluence - Local Test Runner

Usage:
  tsx src/local-runner.ts [options]

Options:
  --config <path>     Load configuration from JSON file
  --dry-run          Preview changes without making them
  --validate-only    Only validate credentials and connectivity
  --help, -h         Show this help message

Environment Variables:
  INPUT_FILE_MAPPINGS    JSON configuration (or use --config file)
  INPUT_DEBUG           Enable debug logging (true/false)

Configuration can be loaded from:
  1. Command line --config flag
  2. INPUT_FILE_MAPPINGS environment variable
  3. .env file (automatically loaded if present)

Examples:
  # Using config file
  tsx src/local-runner.ts --config test-data/configs/update-test.json

  # Using environment variable (dry run)
  INPUT_FILE_MAPPINGS='{"baseUrl":"..."}' tsx src/local-runner.ts --dry-run

  # Validate credentials only
  tsx src/local-runner.ts --validate-only --config test-data/configs/update-test.json
`);
	}

	async run(): Promise<void> {
		try {
			// Get configuration
			const fileMappingsInput = this.mockCore.getInput("file-mappings");
			if (!fileMappingsInput) {
				throw new Error(
					"No configuration provided. Use --config flag or set INPUT_FILE_MAPPINGS environment variable."
				);
			}

			const fileMaps = FileMappingsSchema.parse(JSON.parse(fileMappingsInput));

			this.logger.info(`🚀 Starting local sync for ${fileMaps.pages.length} pages`);
			this.logger.info(`🔗 Base URL: ${fileMaps.baseUrl}`);

			if (this.dryRun) {
				this.logger.info("🔍 DRY-RUN MODE: No actual changes will be made");
			}

			// Validation mode - just check connectivity
			if (this.validateOnly) {
				await this.validateConfiguration(fileMaps);
				this.logger.info("✅ Validation completed successfully");
				return;
			}

			// Run the sync for each page
			const results = await Promise.allSettled(
				fileMaps.pages.map(async (page) => {
					this.logger.info(`\n📝 Processing: ${page.file} -> Page ${page.pageId}`);

					if (this.dryRun) {
						return this.dryRunSync({ fileMap: fileMaps, page });
					} else {
						return this.localSyncFiles({ fileMap: fileMaps, page });
					}
				})
			);

			// Report results
			const successful = results.filter((r) => r.status === "fulfilled").length;
			const failed = results.filter((r) => r.status === "rejected").length;

			this.logger.info(`\n📊 Results: ${successful} successful, ${failed} failed`);

			if (failed > 0) {
				this.logger.error("❌ Some pages failed to sync:");
				results.forEach((result, index) => {
					if (result.status === "rejected") {
						this.logger.error(`  - ${fileMaps.pages[index].file}: ${result.reason}`);
					}
				});
				process.exit(1);
			} else {
				this.logger.info("🎉 All pages synced successfully!");
			}
		} catch (error) {
			this.mockCore.setFailed(error instanceof Error ? error.message : String(error));
		}
	}

	private async localSyncFiles(options: any): Promise<void> {
		// Create a version of syncFiles that uses our mock core
		const originalCore = await import("@actions/core");

		// Temporarily replace core methods for this sync
		const originalGetInput = originalCore.getInput;
		const originalSetOutput = originalCore.setOutput;

		try {
			(originalCore as any).getInput = this.mockCore.getInput.bind(this.mockCore);
			(originalCore as any).setOutput = this.mockCore.setOutput.bind(this.mockCore);

			await syncFiles(options);
		} finally {
			// Restore original methods
			(originalCore as any).getInput = originalGetInput;
			(originalCore as any).setOutput = originalSetOutput;
		}
	}

	private async validateConfiguration(fileMaps: any): Promise<void> {
		const { ConfluenceApiClient } = await import("./confluence-api");

		this.logger.info("🔍 Validating Confluence connection...");

		const client = new ConfluenceApiClient(
			{
				baseUrl: fileMaps.baseUrl,
				user: fileMaps.user,
				pass: fileMaps.pass,
				personalAccessToken: fileMaps.personalAccessToken,
				insecure: fileMaps.insecure
			},
			true
		);

		// Test each page accessibility
		for (const page of fileMaps.pages) {
			try {
				this.logger.info(`  📄 Checking page ${page.pageId}...`);
				const existingPage = await client.getPage(page.pageId);

				if (existingPage) {
					this.logger.info(`    ✅ Found: "${existingPage.title}"`);
				} else {
					this.logger.info(`    📝 Page not found - would create new page`);
					if (!page.spaceKey) {
						this.logger.warn(`    ⚠️  No spaceKey provided for new page creation`);
					}
				}

				// Check if local file exists
				const fs = await import("fs/promises");
				const path = await import("path");
				const filePath = path.resolve(fileMaps.fileRoot || process.cwd(), page.file);

				try {
					await fs.access(filePath);
					const stats = await fs.stat(filePath);
					this.logger.info(`    📁 Local file: ${page.file} (${stats.size} bytes)`);
				} catch {
					this.logger.error(`    ❌ Local file not found: ${page.file}`);
				}
			} catch (error) {
				this.logger.error(`    ❌ Error checking page ${page.pageId}: ${error}`);
			}
		}
	}

	private async dryRunSync(options: any): Promise<void> {
		const fs = await import("fs/promises");
		const path = await import("path");
		const { convertToConfluenceStorage } = await import("./confluence-api");

		const { fileMap, page } = options;

		// Check if file exists
		const filePath = path.resolve(fileMap.fileRoot || process.cwd(), page.file);

		try {
			const fileContent = await fs.readFile(filePath, "utf-8");

			// Determine content type
			const fileExtension = path.extname(page.file).toLowerCase();
			let contentType: "markdown" | "html" | "plain" = "plain";
			if (fileExtension === ".md" || fileExtension === ".markdown") {
				contentType = "markdown";
			} else if (fileExtension === ".html" || fileExtension === ".htm") {
				contentType = "html";
			}

			const confluenceContent = convertToConfluenceStorage(fileContent, contentType);

			this.logger.info(`  📄 File: ${page.file} (${fileContent.length} chars)`);
			this.logger.info(`  🎯 Target: Page ${page.pageId}`);
			this.logger.info(`  📝 Title: ${page.title || "untitled"}`);
			this.logger.info(`  🔄 Content Type: ${contentType}`);
			this.logger.info(`  📦 Confluence Content: ${confluenceContent.length} chars`);

			if (page.spaceKey) {
				this.logger.info(`  🏢 Space: ${page.spaceKey}`);
			}
			if (page.parentId) {
				this.logger.info(`  👨‍👩‍👧‍👦 Parent: ${page.parentId}`);
			}

			this.logger.info(`  ✨ Would sync content (DRY-RUN)`);
		} catch (error) {
			this.logger.error(`  ❌ Error in dry run: ${error}`);
			throw error;
		}
	}
}

// Run the local runner if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const runner = new LocalRunner();
	runner.run().catch(console.error);
}

export { LocalRunner };
