#!/usr/bin/env tsx
import { PinchTabClient } from "../api.js";
import { getCliArg, getCliOptions, runMain } from "./cli.js";
async function main() {
  const cli = await getCliOptions();
  const instanceId = getCliArg("instance-id");
  if (!instanceId) {
    throw new Error("--instance-id is required");
  }
  const client = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const result = await client.instanceStop(instanceId);
  console.log(JSON.stringify({ status: "success", instanceId, result }));
}
runMain(main, "reddit-stop.ts");
