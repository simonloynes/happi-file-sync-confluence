import { z } from "zod";

export const FileMappingsSchema = z.object({
	baseUrl: z.string(),
	user: z.string().optional(),
	pass: z.string().optional(),
	prefix: z.string().optional(),
	fileRoot: z.string().optional(),
	pages: z.array(
		z.object({
			pageId: z.string(),
			file: z.string(),
			title: z.string().optional(),
			spaceKey: z.string().optional(),
			parentId: z.string().optional()
		})
	)
});

export interface SyncFilesOptions {
	fileMap: FileMappingType;
	page: {
		pageId: string;
		file: string;
		title?: string;
		spaceKey?: string;
		parentId?: string;
	};
}

export type FileMappingType = z.infer<typeof FileMappingsSchema>;
