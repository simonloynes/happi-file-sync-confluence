import { createLogger } from "./utils/logging";

export interface ConfluenceConfig {
	baseUrl: string;
	user?: string;
	pass?: string;
	personalAccessToken?: string;
}

export interface ConfluencePage {
	id: string;
	type: string;
	status: string;
	title: string;
	body: {
		storage: {
			value: string;
			representation: string;
		};
	};
	version: {
		number: number;
	};
	space?: {
		key: string;
	};
}

export interface ConfluencePageCreate {
	type: "page";
	title: string;
	space: {
		key: string;
	};
	body: {
		storage: {
			value: string;
			representation: "storage";
		};
	};
	ancestors?: Array<{ id: string }>;
}

export interface ConfluencePageUpdate {
	id: string;
	type: "page";
	title: string;
	body: {
		storage: {
			value: string;
			representation: "storage";
		};
	};
	version: {
		number: number;
	};
}

/**
 * Convert content to Confluence storage format
 * This is a basic implementation that handles plain text and some basic markdown
 */
export function convertToConfluenceStorage(
	content: string,
	contentType: "markdown" | "html" | "plain" = "plain"
): string {
	if (contentType === "html") {
		// If content is already HTML, wrap it in basic Confluence storage format
		return `<p>${content}</p>`;
	}

	if (contentType === "markdown") {
		// Basic markdown to Confluence storage conversion
		// This is a simplified implementation - for production use, consider using a proper markdown parser
		let converted = content
			// Headers
			.replace(/^# (.*$)/gim, "<h1>$1</h1>")
			.replace(/^## (.*$)/gim, "<h2>$1</h2>")
			.replace(/^### (.*$)/gim, "<h3>$1</h3>")
			// Bold and italic
			.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
			.replace(/\*(.*?)\*/g, "<em>$1</em>")
			// Code blocks
			.replace(
				/```([\s\S]*?)```/g,
				'<ac:structured-macro ac:name="code"><ac:plain-text-body><![CDATA[$1]]></ac:plain-text-body></ac:structured-macro>'
			)
			.replace(/`(.*?)`/g, "<code>$1</code>")
			// Links
			.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2">$1</a>')
			// Line breaks
			.replace(/\n\n/g, "</p><p>")
			.replace(/\n/g, "<br/>");

		return `<p>${converted}</p>`;
	}

	// Plain text - wrap in paragraphs and handle line breaks
	const paragraphs = content
		.split("\n\n")
		.map((p) => p.trim())
		.filter((p) => p.length > 0);
	if (paragraphs.length === 0) {
		return "<p></p>";
	}

	return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
}

export class ConfluenceApiClient {
	private config: ConfluenceConfig;
	private logger = createLogger(false, "ConfluenceAPI");

	constructor(config: ConfluenceConfig, debug: boolean = false) {
		this.config = config;
		this.logger = createLogger(debug, "ConfluenceAPI");

		// Validate authentication
		if (!this.config.personalAccessToken && !(this.config.user && this.config.pass)) {
			throw new Error("Either personalAccessToken or both user and pass must be provided for authentication");
		}
	}

	/**
	 * Get authentication headers for API requests
	 */
	private getAuthHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			Accept: "application/json"
		};

		if (this.config.personalAccessToken) {
			headers["Authorization"] = `Bearer ${this.config.personalAccessToken}`;
		} else if (this.config.user && this.config.pass) {
			const credentials = Buffer.from(`${this.config.user}:${this.config.pass}`).toString("base64");
			headers["Authorization"] = `Basic ${credentials}`;
		}

		return headers;
	}

	/**
	 * Make an authenticated request to the Confluence API
	 */
	private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
		const url = `${this.config.baseUrl}/rest/api${endpoint}`;
		this.logger.debug(`Making ${options.method || "GET"} request to: ${url}`);

		const requestOptions: RequestInit = {
			...options,
			headers: {
				...this.getAuthHeaders(),
				...options.headers
			}
		};

		const response = await fetch(url, requestOptions);

		this.logger.debug(`Response status: ${response.status} ${response.statusText}`);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Confluence API request failed: ${response.status} ${response.statusText}\nResponse: ${errorText}`
			);
		}

		return response;
	}

	/**
	 * Get a page by ID
	 */
	async getPage(pageId: string): Promise<ConfluencePage | null> {
		try {
			this.logger.info(`Fetching page with ID: ${pageId}`);
			const response = await this.makeRequest(`/content/${pageId}?expand=body.storage,version,space`);
			const page = (await response.json()) as ConfluencePage;
			this.logger.info(`Successfully fetched page: ${page.title}`);
			return page;
		} catch (error) {
			if (error instanceof Error && error.message.includes("404")) {
				this.logger.info(`Page with ID ${pageId} not found`);
				return null;
			}
			this.logger.error(`Error fetching page ${pageId}: ${error}`);
			throw error;
		}
	}

	/**
	 * Create a new page
	 */
	async createPage(pageData: ConfluencePageCreate): Promise<ConfluencePage> {
		this.logger.info(`Creating new page: ${pageData.title}`);

		const response = await this.makeRequest("/content", {
			method: "POST",
			body: JSON.stringify(pageData)
		});

		const createdPage = (await response.json()) as ConfluencePage;
		this.logger.info(`Successfully created page with ID: ${createdPage.id}`);
		return createdPage;
	}

	/**
	 * Update an existing page
	 */
	async updatePage(pageData: ConfluencePageUpdate): Promise<ConfluencePage> {
		this.logger.info(`Updating page: ${pageData.title} (ID: ${pageData.id})`);

		const response = await this.makeRequest(`/content/${pageData.id}`, {
			method: "PUT",
			body: JSON.stringify(pageData)
		});

		const updatedPage = (await response.json()) as ConfluencePage;
		this.logger.info(`Successfully updated page with ID: ${updatedPage.id}`);
		return updatedPage;
	}

	/**
	 * Get space information by key
	 */
	async getSpace(spaceKey: string): Promise<any> {
		try {
			this.logger.debug(`Fetching space with key: ${spaceKey}`);
			const response = await this.makeRequest(`/space/${spaceKey}`);
			const space = await response.json();
			this.logger.debug(`Successfully fetched space: ${space.name}`);
			return space;
		} catch (error) {
			this.logger.error(`Error fetching space ${spaceKey}: ${error}`);
			throw error;
		}
	}
}
