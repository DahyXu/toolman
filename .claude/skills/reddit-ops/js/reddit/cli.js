function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
async function processExit(code) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  process.exit(code);
}
const PROFILE_QUERY_URL = "http://automate.test.huya.info/pinchtab/profile/query";
const PROFILE_QUERY_TIMEOUT_MS = 5e3;
async function fetchProfileConnection(profileId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROFILE_QUERY_TIMEOUT_MS);
  const url = `${PROFILE_QUERY_URL}?profileId=${encodeURIComponent(profileId)}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`profile query failed for ${profileId}: HTTP ${response.status} ${response.statusText}`);
    }
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      throw new Error(`profile query failed for ${profileId}: invalid JSON response`);
    }
    const profile = data;
    if (typeof profile.url !== "string" || !/^https?:\/\//.test(profile.url)) {
      throw new Error(`profile query failed for ${profileId}: response has invalid url`);
    }
    if (typeof profile.token !== "string" || !profile.token) {
      throw new Error(`profile query failed for ${profileId}: response has invalid token`);
    }
    if (typeof profile.profileId === "string" && profile.profileId && profile.profileId !== profileId) {
      throw new Error(`profile query failed for ${profileId}: response profileId does not match`);
    }
    return { url: profile.url, token: profile.token };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`profile query timed out after ${PROFILE_QUERY_TIMEOUT_MS / 1e3}s for ${profileId}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
async function getCliOptions() {
  const args = process.argv.slice(2);
  const get = (name) => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 && index + 1 < args.length ? args[index + 1] : void 0;
  };
  const explicitBaseUrl = get("base-url");
  const explicitToken = get("token");
  const profileId = get("profile-id") ?? "";
  if (profileId && (!explicitBaseUrl || !explicitToken)) {
    const profile = await fetchProfileConnection(profileId);
    return {
      baseUrl: explicitBaseUrl ?? profile.url,
      token: explicitToken ?? profile.token,
      profileId
    };
  }
  return {
    baseUrl: explicitBaseUrl ?? "http://localhost:9867",
    token: explicitToken ?? "fakeToken",
    profileId
  };
}
function getCliArg(name) {
  const args = process.argv.slice(2);
  const index = args.indexOf(`--${name}`);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : void 0;
}
function requireCliArg(name) {
  const arg = getCliArg(name);
  if (!arg) {
    throw new Error(`--${name} is required`);
  }
  return arg;
}
function requireTabId() {
  return requireCliArg("tab-id");
}
function outputResult(result) {
  console.log(JSON.stringify(result));
  void processExit(result.status === "failed" || result.status === "invalid_page" ? 1 : 0);
}
function runMain(fn, filename) {
  // Scripts pass their own ".ts" filename; this build is transpiled to ".js",
  // so accept either extension.
  if (filename) {
    const entry = process.argv[1] ?? "";
    const alt = filename.replace(/\.ts$/, ".js");
    if (!entry.endsWith(filename) && !entry.endsWith(alt)) return;
  }
  fn().catch((err) => {
    console.log(JSON.stringify({ status: "failed", message: err?.message || err?.error || JSON.stringify(err) }));
    void processExit(1);
  });
}
export {
  getCliArg,
  getCliOptions,
  outputResult,
  processExit,
  requireCliArg,
  requireTabId,
  runMain
};
