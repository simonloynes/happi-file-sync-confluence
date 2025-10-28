import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import { syncFiles } from "./syncFiles";
import { FileMappingsSchema } from "./types";
import { createLogger } from "./utils/logging";

export async function run(): Promise<void> {
  const githubToken = core.getInput("github-token", { required: true });
  const debug = core.getInput("debug") === "true";

  const filesInput = JSON.parse(core.getInput("file-mappings"));
  const fileMaps = FileMappingsSchema.parse(filesInput);

  const logger = createLogger(debug, "Octokit");

  const octokit = new Octokit({
    auth: githubToken,
    log: logger,
    debug,
  });

  await Promise.all(
    Object.keys(fileMaps).map(async (key: string) => {
      await syncFiles({ octokit, fileMap: fileMaps[key] })
    })
  )
}