import { Octokit } from "@octokit/rest";
import { z } from "zod";

export const FileMappingsSchema = z.object({
});

export interface SyncFilesOptions {
	fileMap: FileMappingType;
	octokit: Octokit;
}

export type FileMappingType = z.infer<typeof FileMappingsSchema>;
// export type FileMappingsType = z.infer<typeof FileMappingsSchema>;