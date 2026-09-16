import { PinchTabClient } from "../api.js";
import { getCliArg, getCliOptions, runMain } from "./cli.js";
async function main() {
  const cli = await getCliOptions();
  const profileId = getCliArg("profile-id");
  if (!profileId) {
    throw new Error("--profile-id is required");
  }
  const pt = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const instance = await pt.profileEnsure(profileId);
  console.log(`instanceId: ${instance.id}`);
}
runMain(main, "reddit-start.ts");
