async function apiFetch(cfg, path, opts = {}) {
  const base = cfg.baseUrl ?? "http://127.0.0.1:9867";
  const qs = opts.query ? Object.entries(opts.query).filter(([, v]) => v !== void 0 && v !== "").map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&") : "";
  const url = `${base}${path}${qs ? `?${qs}` : ""}`;
  const headers = {};
  if (cfg.session) {
    headers["Authorization"] = `Bearer ${cfg.session}`;
  } else if (cfg.token) {
    headers["Authorization"] = `Bearer ${cfg.token}`;
  }
  if (cfg.agentId) headers["X-Agent-Id"] = cfg.agentId;
  if (opts.body !== void 0) headers["Content-Type"] = "application/json";
  const method = opts.method ?? (opts.body !== void 0 ? "POST" : "GET");
  const controller = new AbortController();
  const timeout = cfg.timeout ?? 6e4;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: opts.body !== void 0 ? JSON.stringify(opts.body) : void 0,
      signal: controller.signal
    });
    if (opts.rawResponse) return res;
    const text = await res.text();
    if (!res.ok) {
      const err = { error: `${res.status} ${res.statusText}`, body: text, status: res.status };
      throw err;
    }
    if (!text) return void 0;
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  } catch (err) {
    const e = err;
    if (e?.error) throw err;
    if (e?.name === "AbortError") {
      throw { error: `Request timed out after ${timeout}ms: ${path}` };
    }
    throw { error: `Connection failed: ${e?.message ?? String(err)}` };
  } finally {
    clearTimeout(timer);
  }
}
class PinchTabClient {
  constructor(cfg) {
    this.cfg = cfg;
  }
  cfg;
  /**
   * Sends a `POST /tabs/{tabId}/action` request.
   * @internal
   */
  action(tabId, body) {
    return apiFetch(this.cfg, `/tabs/${tabId}/action`, { body });
  }
  // -------------------------------------------------------------------------
  // Health
  // -------------------------------------------------------------------------
  /**
   * Check server health (`GET /health`).
   * @returns Server status, tab count, engine variant, and crash/failure info.
   */
  health() {
    return apiFetch(this.cfg, "/health");
  }
  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------
  /**
   * Navigate to a URL, reusing an existing tab if one already has a matching URL.
   * @param instanceId - Instance ID to scope tab lookup (`GET /instances/{id}/tabs`).
   * @param url        - Destination URL.
   * @param opts       - Optional wait conditions applied after navigation.
   * @param newTab     - Force opening a new tab even if a matching tab exists.
   * @returns Tab info after navigation.
   */
  async nav(instanceId, url, opts, newTab = false) {
    if (newTab !== true) {
      const tabs = instanceId ? await this.instanceTabsList(instanceId) : await this.instancesTabsAll();
      const tab2 = tabs.find((t) => t.url === url);
      if (tab2) {
        await this.tabNav(tab2.tabId, url);
        if (opts) await this.wait(tab2.tabId, opts);
        return { tabId: tab2.tabId, url, instanceId };
      }
    }
    const tab = await this.instanceTabsOpen(instanceId, url);
    if (opts) await this.wait(tab.tabId, opts);
    return tab;
  }
  /**
   * Navigate back in tab history (`POST /tabs/{id}/back`).
   * @param tabId - Target tab identifier.
   */
  back(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/back`, { body: {} });
  }
  /**
   * Navigate forward in tab history (`POST /tabs/{id}/forward`).
   * @param tabId - Target tab identifier.
   */
  forward(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/forward`, { body: {} });
  }
  /**
   * Reload the current page (`POST /tabs/{id}/reload`).
   * @param tabId - Target tab identifier.
   */
  reload(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/reload`, { body: {} });
  }
  // -------------------------------------------------------------------------
  // Tab management
  // -------------------------------------------------------------------------
  /**
   * Open a new browser tab (`POST /tab` with `action: "new"`).
   * @param url - Optional URL to navigate to immediately.
   */
  tabNew(url) {
    const body = { action: "new" };
    if (url) body.url = url;
    return apiFetch(this.cfg, "/tab", { body });
  }
  /**
   * Close a tab (`POST /tabs/{id}/close`).
   * @param tabId - Tab to close.
   */
  tabClose(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/close`, { method: "POST" });
  }
  /**
   * Navigate to a URL (`POST /tabs/{id}/navigate`).
   * @param tabId - Target tab identifier.
   * @param url   - Destination URL.
   * @param opts  - Optional navigation settings (blockImages, timeout…).
   * @returns Final URL and title after navigation.
   */
  async tabNav(tabId, url, opts) {
    if (!tabId || tabId.length == 0) {
      throw { error: "tabId is required for tabNav" };
    }
    if (!url || url.length == 0) {
      throw { error: "url is required for tabNav" };
    }
    const body = { url };
    if (opts?.newTab) body.newTab = true;
    if (opts?.blockImages) body.blockImages = true;
    if (opts?.blockMedia) body.blockMedia = true;
    if (opts?.blockAds) body.blockAds = true;
    if (opts?.waitTitle !== void 0) body.waitTitle = opts.waitTitle;
    if (opts?.waitFor !== void 0) body.waitFor = opts.waitFor;
    if (opts?.waitSelector !== void 0) body.waitSelector = opts.waitSelector;
    if (opts?.timeout !== void 0) body.timeout = opts.timeout;
    return apiFetch(this.cfg, `/tabs/${tabId}/navigate`, { body });
  }
  /**
   * Bring a tab to the foreground (`POST /tab` with `action: "focus"`).
   * @param tabId - Tab to focus.
   */
  tabFocus(tabId) {
    return apiFetch(this.cfg, "/tab", { body: { action: "focus", tabId } });
  }
  /**
   * Read Chrome DevTools memory and DOM metrics for a tab (`GET /tabs/{id}/metrics`).
   * @param tabId - Tab to inspect.
   */
  tabMetrics(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/metrics`);
  }
  /**
   * Acquire an exclusive lock on a tab (`POST /tabs/{id}/lock`).
   * While locked, other agents that attempt to act on the tab receive HTTP 423.
   * @param tabId - Tab to lock.
   * @param owner - Identifier for the lock holder (e.g. your agent ID).
   * @param opts  - Optional timeout (default 300 s).
   */
  tabLock(tabId, owner, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/lock`, { body: { owner, timeoutSec: opts?.timeoutSec } });
  }
  /**
   * Release a previously acquired tab lock (`POST /tabs/{id}/unlock`).
   * @param tabId - Locked tab.
   * @param owner - Must match the owner passed to `tabLock()`.
   */
  tabUnlock(tabId, owner) {
    return apiFetch(this.cfg, `/tabs/${tabId}/unlock`, { body: { owner } });
  }
  // -------------------------------------------------------------------------
  // Snapshot
  // -------------------------------------------------------------------------
  /**
   * Capture an accessibility tree snapshot of the current page (`GET /tabs/{id}/snapshot`).
   *
   * The returned `nodes[].ref` values are used as element identifiers in all
   * action methods (`click`, `fill`, `focus`, etc.).
   *
   * @param tabId - Target tab identifier.
   * @param opts  - Filter, format, selector, token budget, depth, diff mode.
   * @returns Snapshot nodes, page URL/title, and truncation metadata.
   */
  snap(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/snapshot`, {
      query: {
        filter: opts?.filter,
        format: opts?.format,
        selector: opts?.selector,
        maxTokens: opts?.maxTokens,
        depth: opts?.depth,
        diff: opts?.diff ? "true" : void 0
      }
    });
  }
  /**
   * Fetch HTML attributes via the unified `POST /tabs/{id}/attributes` endpoint.
   *
   * Two discovery modes:
   *   - **selector**: CSS selector (shadow-DOM-piercing), ideal for Web Components.
   *     No RefCache / /snapshot needed.
   *   - **nodes**:   Specific elements by ref (from /snapshot) or backend node ID.
   *
   * @param tabId - Target tab identifier.
   * @param opts  - AttributesRequest with `selector` or `nodes`, optional `attrNames` and `limit`.
   * @returns Array of matched elements with their attributes, in order.
   *
   * @example
   * // Fetch Reddit post metadata without JS injection
   * const items = await client.getAttributes(tabId, {
   *   selector: "shreddit-post",
   *   attrNames: ["post-title", "permalink", "score", "comment-count", "author"],
   *   limit: 25,
   * });
   */
  getAttributes(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/attributes`, {
      method: "POST",
      body: opts
    }).then((res) => res.items);
  }
  // -------------------------------------------------------------------------
  // Content extraction
  // -------------------------------------------------------------------------
  /**
   * Capture a JPEG screenshot of the current viewport (`GET /tabs/{id}/screenshot`).
   * @param tabId - Target tab identifier.
   * @param opts  - Optional JPEG quality (0–100), element selector, and css1x flag.
   * @returns Raw `Response` object — read with `.arrayBuffer()` or `.blob()`.
   */
  screenshot(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/screenshot`, {
      query: { quality: opts?.quality, selector: opts?.selector, css1x: opts?.css1x },
      rawResponse: true
    });
  }
  /**
   * Extract readable text content from the page (`GET /tabs/{id}/text`).
   * Uses Mozilla Readability by default; pass `raw: true` to skip it.
   * @param tabId - Target tab identifier.
   * @param opts  - Optional `raw` flag and element `selector` (v0.10.0).
   */
  text(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/text`, {
      query: { mode: opts?.raw ? "raw" : void 0, selector: opts?.selector }
    });
  }
  // -------------------------------------------------------------------------
  // PDF export
  // -------------------------------------------------------------------------
  /**
   * Export the current page as a PDF (`GET /tabs/{id}/pdf`).
   * @param tabId - Target tab identifier.
   * @param opts  - Paper size, margins, orientation, header/footer templates, etc.
   * @returns Raw `Response` object — read with `.arrayBuffer()` or `.blob()`.
   */
  pdf(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/pdf`, {
      query: {
        landscape: opts?.landscape,
        scale: opts?.scale,
        paperWidth: opts?.paperWidth,
        paperHeight: opts?.paperHeight,
        marginTop: opts?.marginTop,
        marginBottom: opts?.marginBottom,
        marginLeft: opts?.marginLeft,
        marginRight: opts?.marginRight,
        pageRanges: opts?.pageRanges,
        preferCSSPageSize: opts?.preferCSSPageSize,
        displayHeaderFooter: opts?.displayHeaderFooter,
        headerTemplate: opts?.headerTemplate,
        footerTemplate: opts?.footerTemplate,
        generateTaggedPDF: opts?.generateTaggedPDF,
        generateDocumentOutline: opts?.generateDocumentOutline,
        fileOutput: opts?.fileOutput,
        path: opts?.path
      },
      rawResponse: true
    });
  }
  // -------------------------------------------------------------------------
  // Element interaction
  // -------------------------------------------------------------------------
  /**
   * Click an element (`POST /tabs/{id}/action` with `kind: "click"`).
   * @param tabId - Target tab identifier.
   * @param opts  - `ref` (from snapshot), `css`, or `x`/`y` coordinates.
   *               Pass `dialogAction` to automatically handle a dialog that appears after the click (v0.10.0).
   */
  click(tabId, opts) {
    return this.action(tabId, { kind: "click", ref: opts.ref, selector: opts.css, nodeId: opts.nodeId, x: opts.x, y: opts.y, waitNav: opts.waitNav, dialogAction: opts.dialogAction, dialogText: opts.dialogText });
  }
  /**
   * Double-click an element (`POST /tabs/{id}/action` with `kind: "dblclick"`).
   * @param tabId - Target tab identifier.
   * @param opts  - `ref`, `css`, or `x`/`y` coordinates.
   */
  dblclick(tabId, opts) {
    return this.action(tabId, { kind: "dblclick", ref: opts.ref, selector: opts.css, nodeId: opts.nodeId, x: opts.x, y: opts.y });
  }
  /**
   * Hover the pointer over an element (`POST /tabs/{id}/action` with `kind: "hover"`).
   * @param tabId - Target tab identifier.
   * @param opts  - `ref`, `css`, or `x`/`y` coordinates.
   */
  hover(tabId, opts) {
    return this.action(tabId, { kind: "hover", ref: opts.ref, selector: opts.css, nodeId: opts.nodeId, x: opts.x, y: opts.y });
  }
  /**
   * Move keyboard focus to an element (`POST /tabs/{id}/action` with `kind: "focus"`).
   * @param tabId - Target tab identifier.
   * @param ref   - Element ref from a snapshot (e.g. `"e5"`).
   */
  focus(tabId, ref) {
    return this.action(tabId, { kind: "focus", ref });
  }
  /**
   * Scroll an element into the visible viewport (`POST /tabs/{id}/action` with `kind: "scrollintoview"`).
   * @param tabId - Target tab identifier.
   * @param ref   - Element ref from a snapshot.
   */
  scrollIntoView(tabId, ref) {
    return this.action(tabId, { kind: "scrollintoview", ref });
  }
  /**
   * Drag an element or coordinate to a target position (`POST /tabs/{id}/action` with `kind: "drag"`).
   * @param tabId - Target tab identifier.
   * @param opts  - Source ref/coordinates and required destination coordinates.
   */
  drag(tabId, opts) {
    return this.action(tabId, { kind: "drag", ref: opts.ref, selector: opts.selector, x: opts.x, y: opts.y, dragX: opts.dragX, dragY: opts.dragY });
  }
  /**
   * Type text into a focused element by dispatching keyboard events
   * (`POST /tabs/{id}/action` with `kind: "type"`).
   * @param tabId - Target tab identifier.
   * @param ref   - Element ref from a snapshot.
   * @param text  - Text to type character by character.
   */
  type(tabId, ref, text) {
    return this.action(tabId, { kind: "type", ref, text });
  }
  /**
   * Directly set an input element's value without keyboard events
   * (`POST /tabs/{id}/action` with `kind: "fill"`).
   * Faster than `type()` and avoids triggering keystroke handlers.
   * @param tabId - Target tab identifier.
   * @param ref   - Element ref from a snapshot.
   * @param text  - Value to set.
   */
  fill(tabId, ref, text) {
    return this.action(tabId, { kind: "fill", ref, text });
  }
  /**
   * Press a named keyboard key (`POST /tabs/{id}/action` with `kind: "press"`).
   * @param tabId - Target tab identifier.
   * @param key   - Key name (e.g. `"Enter"`, `"Tab"`, `"ArrowDown"`, `"Escape"`).
   */
  press(tabId, key) {
    return this.action(tabId, { kind: "press", key });
  }
  /**
   * Scroll an element or the page by a pixel amount (`POST /tabs/{id}/action` with `kind: "scroll"`).
   * @param tabId       - Target tab identifier.
   * @param ref         - Element ref or `"window"` to scroll the page.
   * @param scrollY     - Vertical scroll delta in pixels (positive = down).
   * @param direction   - Scroll direction (`"up"` | `"down"` | `"left"` | `"right"`). v0.10.0.
   * @param scrollSteps - Number of scroll steps for segmented scrolling. Default: `1`. v0.10.0.
   */
  scroll(tabId, ref, scrollY, direction, scrollSteps) {
    return this.action(tabId, { kind: "scroll", ref, scrollY, scrollDirection: direction, scrollSteps });
  }
  /**
   * Select an option in a `<select>` element (`POST /tabs/{id}/action` with `kind: "select"`).
   * @param tabId  - Target tab identifier.
   * @param ref    - Element ref of the `<select>`.
   * @param value  - Option value to select.
   */
  select(tabId, ref, value) {
    return this.action(tabId, { kind: "select", ref, value });
  }
  /**
   * Check a checkbox or radio button (`POST /tabs/{id}/action` with `kind: "check"`).
   * @param tabId    - Target tab identifier.
   * @param selector - CSS selector for the input element.
   */
  check(tabId, selector) {
    return this.action(tabId, { kind: "check", selector });
  }
  /**
   * Uncheck a checkbox (`POST /tabs/{id}/action` with `kind: "uncheck"`).
   * @param tabId    - Target tab identifier.
   * @param selector - CSS selector for the checkbox element.
   */
  uncheck(tabId, selector) {
    return this.action(tabId, { kind: "uncheck", selector });
  }
  /**
   * Hold a keyboard key down (`POST /tabs/{id}/action` with `kind: "keydown"`).
   * Pair with `keyup()` to simulate key-hold gestures.
   * @param tabId - Target tab identifier.
   * @param key   - Key name (e.g. `"Shift"`, `"Control"`).
   */
  keydown(tabId, key) {
    return this.action(tabId, { kind: "keydown", key });
  }
  /**
   * Release a held keyboard key (`POST /tabs/{id}/action` with `kind: "keyup"`).
   * @param tabId - Target tab identifier.
   * @param key   - Key name (e.g. `"Shift"`, `"Control"`).
   */
  keyup(tabId, key) {
    return this.action(tabId, { kind: "keyup", key });
  }
  /**
   * Move the mouse pointer to a position (`POST /tabs/{id}/action` with `kind: "mouse-move"`).
   * @param tabId - Target tab identifier.
   * @param opts  - Target coordinates or element ref.
   */
  mouseMove(tabId, opts) {
    return this.action(tabId, { kind: "mouse-move", ref: opts.ref, selector: opts.selector, x: opts.x, y: opts.y });
  }
  /**
   * Press a mouse button down (`POST /tabs/{id}/action` with `kind: "mouse-down"`).
   * @param tabId - Target tab identifier.
   * @param opts  - Position, optional button (default `"left"`).
   */
  mouseDown(tabId, opts) {
    return this.action(tabId, { kind: "mouse-down", ref: opts.ref, selector: opts.selector, x: opts.x, y: opts.y, button: opts.button });
  }
  /**
   * Release a mouse button (`POST /tabs/{id}/action` with `kind: "mouse-up"`).
   * @param tabId - Target tab identifier.
   * @param opts  - Position, optional button (default `"left"`).
   */
  mouseUp(tabId, opts) {
    return this.action(tabId, { kind: "mouse-up", ref: opts.ref, selector: opts.selector, x: opts.x, y: opts.y, button: opts.button });
  }
  /**
   * Dispatch a mouse wheel event (`POST /tabs/{id}/action` with `kind: "mouse-wheel"`).
   * @param tabId - Target tab identifier.
   * @param opts  - Position and `deltaX`/`deltaY` scroll amounts.
   */
  mouseWheel(tabId, opts) {
    return this.action(tabId, { kind: "mouse-wheel", ref: opts.ref, selector: opts.selector, x: opts.x, y: opts.y, deltaX: opts.deltaX, deltaY: opts.deltaY });
  }
  // -------------------------------------------------------------------------
  // Keyboard & batch operations
  // -------------------------------------------------------------------------
  /**
   * Type text using keyboard events without targeting a specific element
   * (`POST /tabs/{id}/action` with `kind: "keyboard-type"`).
   * Types into whichever element currently has focus.
   * @param tabId - Target tab identifier.
   * @param text  - Text to type.
   */
  keyboardType(tabId, text) {
    return apiFetch(this.cfg, `/tabs/${tabId}/action`, { body: { kind: "keyboard-type", text } });
  }
  /**
   * Insert text using a clipboard-paste approach — no keyboard events fired
   * (`POST /tabs/{id}/action` with `kind: "keyboard-inserttext"`).
   * @param tabId - Target tab identifier.
   * @param text  - Text to insert.
   */
  keyboardInsertText(tabId, text) {
    return apiFetch(this.cfg, `/tabs/${tabId}/action`, { body: { kind: "keyboard-inserttext", text } });
  }
  /**
   * Execute multiple actions atomically in a single request (`POST /tabs/{id}/actions`).
   * More efficient than sequential individual calls for multi-step interactions.
   * @param tabId   - Target tab identifier.
   * @param actions - Ordered list of actions to execute.
   * @param opts    - Optional owner and stopOnError flag.
   */
  actions(tabId, actions, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/actions`, {
      body: { actions, owner: opts?.owner, stopOnError: opts?.stopOnError }
    });
  }
  /**
   * Run a macro — a named action sequence with per-step timeouts
   * (`POST /macro`).
   * @param tabId - Target tab identifier.
   * @param steps - Ordered list of steps to execute.
   * @param opts  - Owner, stopOnError, and per-step timeout.
   */
  macro(tabId, steps, opts) {
    return apiFetch(this.cfg, `/macro`, {
      body: { tabId, steps, owner: opts?.owner, stopOnError: opts?.stopOnError, stepTimeout: opts?.stepTimeout }
    });
  }
  /**
   * List available CAPTCHA solver engines (`GET /solvers`).
   * @returns `{ solvers: string[] }`
   */
  solvers() {
    return apiFetch(this.cfg, "/solvers");
  }
  /**
   * Detect and solve a CAPTCHA or browser challenge on the current page
   * (`POST /tabs/{id}/solve`).
   * @param tabId - Target tab identifier.
   * @param opts  - Solver engine, max attempts, and timeout.
   */
  solve(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/solve`, {
      body: { solver: opts?.solver, maxAttempts: opts?.maxAttempts, timeout: opts?.timeout }
    });
  }
  // -------------------------------------------------------------------------
  // Find
  // -------------------------------------------------------------------------
  /**
   * Find an element using a natural language description (`POST /tabs/{id}/find`).
   * Returns the best-matching element ref plus confidence score.
   * @param tabId - Target tab identifier.
   * @param query - Natural language description (e.g. `"submit button"`).
   * @param opts  - Optional similarity threshold and refOnly flag.
   */
  find(tabId, query, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/find`, {
      body: {
        query,
        threshold: opts?.threshold,
        refOnly: opts?.refOnly,
        topK: opts?.topK,
        lexicalWeight: opts?.lexicalWeight,
        embeddingWeight: opts?.embeddingWeight,
        explain: opts?.explain
      }
    });
  }
  // -------------------------------------------------------------------------
  // Wait
  // -------------------------------------------------------------------------
  /**
   * Wait for a page condition before continuing (`POST /tabs/{id}/wait`).
   * Conditions include CSS selector, text, notText, URL, load state, JS predicate, or delay.
   * @param tabId - Target tab identifier.
   * @param opts  - At least one wait condition must be provided.
   */
  wait(tabId, opts) {
    const body = {};
    if (opts.selector !== void 0) body.selector = opts.selector;
    if (opts.text !== void 0) body.text = opts.text;
    if (opts.notText !== void 0) body.notText = opts.notText;
    if (opts.url !== void 0) body.url = opts.url;
    if (opts.load !== void 0) body.load = opts.load;
    if (opts.fn !== void 0) body.fn = opts.fn;
    if (opts.ms !== void 0) body.ms = opts.ms;
    if (opts.elementState !== void 0) body.state = opts.elementState;
    if (opts.timeout !== void 0) body.timeout = opts.timeout;
    if (opts.idleFor !== void 0) body.idleFor = opts.idleFor;
    return apiFetch(this.cfg, `/tabs/${tabId}/wait`, { body });
  }
  // -------------------------------------------------------------------------
  // JavaScript evaluation
  // -------------------------------------------------------------------------
  /**
   * Execute a JavaScript expression in the page context (`POST /tabs/{id}/evaluate`).
   * The expression's return value is serialized as JSON.
   * @param tabId      - Target tab identifier.
   * @param expression - JavaScript expression to evaluate.
   * @returns Serialized return value.
   */
  evaluate(tabId, expression) {
    return apiFetch(this.cfg, `/tabs/${tabId}/evaluate`, { body: { expression } });
  }
  /**
   * Execute JavaScript in an isolated world with optional DOM node ID extraction
   * (`POST /evaluate/v2`).
   *
   * When `returnNodeId: true` and the expression returns a single DOM element, the
   * response includes a `nodeId` that can be passed directly to `/action` (click,
   * hover, etc.).
   *
   * @param tabId        - Target tab identifier.
   * @param expression   - JavaScript expression to evaluate.
   * @param returnNodeId - When true, return CDP BackendNodeID + element metadata
   *                       for single DOM element results.
   *
   * @example
   * ```ts
   * const { nodeId, isElement } = await pt.evaluateV2("tab_abc", "document.querySelector('#submit-btn')", true);
   * if (isElement) await pt.click("tab_abc", { ref: String(nodeId) });
   * ```
   */
  evaluateV2(tabId, expression, returnNodeId) {
    return apiFetch(this.cfg, "/evaluate/v2", { body: { tabId, expression, returnNodeId } });
  }
  // -------------------------------------------------------------------------
  // Network monitoring
  // -------------------------------------------------------------------------
  /**
   * List network requests captured for a tab (`GET /tabs/{id}/network`).
   * PinchTab buffers requests automatically; use filters to narrow results.
   * @param tabId - Target tab identifier.
   * @param opts  - URL filter, method, status, type, limit, bufferSize, clear.
   */
  networkList(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/network`, {
      query: {
        filter: opts?.filter,
        method: opts?.method,
        status: opts?.status,
        type: opts?.type,
        limit: opts?.limit,
        bufferSize: opts?.bufferSize,
        clear: opts?.clear
      }
    });
  }
  /**
   * Get full detail for a single captured request, optionally including the response body
   * (`GET /tabs/{id}/network/{requestId}`).
   * @param tabId       - Target tab identifier.
   * @param requestId   - CDP request ID from a `NetworkEntry`.
   * @param includeBody - Fetch the response body. Default: `false`.
   */
  networkGet(tabId, requestId, includeBody = false) {
    return apiFetch(this.cfg, `/tabs/${tabId}/network/${requestId}`, { query: { body: includeBody } });
  }
  /**
   * Clear the network capture buffer for a tab (`POST /network/clear`).
   * @param tabId - Target tab identifier.
   */
  networkClear(tabId) {
    return apiFetch(this.cfg, `/network/clear`, { method: "POST", query: { tabId } });
  }
  /**
   * Export the captured network log as HAR or NDJSON (`GET /tabs/{id}/network/export`).
   * @param tabId - Target tab identifier.
   * @param opts  - Format, response body inclusion, header redaction, and filters.
   */
  networkExport(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/network/export`, {
      query: {
        format: opts?.format,
        body: opts?.includeBody,
        redact: opts?.redact,
        filter: opts?.filter,
        method: opts?.method,
        status: opts?.status,
        type: opts?.type,
        limit: opts?.limit
      }
    });
  }
  // -------------------------------------------------------------------------
  // Console & error logs
  // -------------------------------------------------------------------------
  /**
   * Retrieve browser console messages (`GET /console`).
   * @param tabId - Filter to this tab's console output.
   * @param opts  - Optional limit and clear-after-read flag.
   */
  consoleLogs(tabId, opts) {
    return apiFetch(this.cfg, "/console", { query: { tabId, limit: opts?.limit } });
  }
  /**
   * Clear all buffered console messages (`POST /console/clear`).
   */
  consoleClear() {
    return apiFetch(this.cfg, "/console/clear", { method: "POST" });
  }
  /**
   * Retrieve captured browser JavaScript errors (`GET /errors`).
   * @param tabId - Filter to this tab's errors.
   * @param opts  - Optional limit and clear-after-read flag.
   */
  errorLogs(tabId, opts) {
    return apiFetch(this.cfg, "/errors", { query: { tabId, limit: opts?.limit } });
  }
  /**
   * Clear all buffered JS error entries (`POST /errors/clear`).
   */
  errorsClear() {
    return apiFetch(this.cfg, "/errors/clear", { method: "POST" });
  }
  // -------------------------------------------------------------------------
  // Dialog handling
  // -------------------------------------------------------------------------
  /**
   * Accept a pending `alert`, `confirm`, or `prompt` dialog (`POST /tabs/{id}/dialog`).
   * @param tabId - Tab with the pending dialog.
   * @param opts  - Optional `text` for prompt dialogs.
   */
  dialogAccept(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/dialog`, { body: { action: "accept", text: opts?.text } });
  }
  /**
   * Dismiss (cancel) a pending `confirm` or `prompt` dialog (`POST /tabs/{id}/dialog`).
   * @param tabId - Tab with the pending dialog.
   */
  dialogDismiss(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/dialog`, { body: { action: "dismiss" } });
  }
  // -------------------------------------------------------------------------
  // Clipboard
  // -------------------------------------------------------------------------
  /**
   * Read the current clipboard text content (`GET /clipboard/read`).
   */
  clipboardRead() {
    return apiFetch(this.cfg, "/clipboard/read");
  }
  /**
   * Write text to the clipboard (`POST /clipboard/write`).
   * @param text - Text to place on the clipboard.
   */
  clipboardWrite(text) {
    return apiFetch(this.cfg, "/clipboard/write", { body: { text } });
  }
  /**
   * Paste the current clipboard content into the focused element (`POST /clipboard/paste`).
   */
  clipboardPaste() {
    return apiFetch(this.cfg, "/clipboard/paste");
  }
  // -------------------------------------------------------------------------
  // Stealth & fingerprint
  // -------------------------------------------------------------------------
  /**
   * Get the current stealth / anti-detection configuration (`GET /stealth/status`).
   * @param tabId - Optional tab ID to include per-tab fingerprint overrides.
   */
  stealthStatus(tabId) {
    return apiFetch(this.cfg, "/stealth/status", { query: { tabId } });
  }
  /**
   * Rotate the browser fingerprint to a new random or specified identity
   * (`POST /fingerprint/rotate`).
   * @param opts - OS, browser, screen, language, timezone, and component flags.
   */
  fingerprintRotate(opts) {
    return apiFetch(this.cfg, "/fingerprint/rotate", { body: opts ?? {} });
  }
  /**
   * Set fingerprint configuration for a profile (`POST /profiles/{id}/fingerprint`).
   * @param profileId     - Profile ID or name.
   * @param config - Fingerprint configuration object.
   */
  fingerprintSet(profileId, config) {
    return apiFetch(this.cfg, `/profiles/${profileId}/fingerprint`, {
      method: "POST",
      body: config
    });
  }
  /**
   * Delete fingerprint configuration for a profile (`DELETE /profiles/{id}/fingerprint`).
   * Tolerates 404 (already deleted) as a no-op.
   * @param profileId - Profile ID or name.
   */
  async fingerprintDelete(profileId) {
    try {
      return await apiFetch(this.cfg, `/profiles/${profileId}/fingerprint`, { method: "DELETE" });
    } catch (e) {
      if (e?.status === 404) return {};
      throw e;
    }
  }
  // -------------------------------------------------------------------------
  // Screencast
  // -------------------------------------------------------------------------
  /**
   * List tabs available for screencast streaming (`GET /screencast/tabs`).
   * Requires `security.allowScreencast = true` on the server.
   */
  screencastTabs() {
    return apiFetch(this.cfg, "/screencast/tabs");
  }
  /**
   * Build a WebSocket URL for live tab screencast (`GET /screencast`).
   * Returns the full WebSocket URL to connect to — the caller opens the WS themselves.
   * Requires `security.allowScreencast = true` on the server.
   * @param opts - Tab ID, quality, maxWidth, fps, everyNthFrame.
   */
  screencastUrl(opts) {
    const base = (this.cfg.baseUrl ?? "http://127.0.0.1:9867").replace(/^http/, "ws");
    const qs = opts ? Object.entries(opts).filter(([, v]) => v !== void 0).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&") : "";
    return `${base}/screencast${qs ? `?${qs}` : ""}`;
  }
  // -------------------------------------------------------------------------
  // Cache
  // -------------------------------------------------------------------------
  /**
   * Clear the browser cache for an instance (`POST /instances/{id}/cache/clear`).
   * @param id - Instance identifier.
   */
  cacheClear(id) {
    return apiFetch(this.cfg, `/instances/${id}/cache/clear`, { method: "POST" });
  }
  /**
   * Check whether the browser cache can be cleared for an instance (`GET /instances/{id}/cache/status`).
   * @param id - Instance identifier.
   */
  cacheStatus(id) {
    return apiFetch(this.cfg, `/instances/${id}/cache/status`);
  }
  // -------------------------------------------------------------------------
  // Download & upload
  // -------------------------------------------------------------------------
  /**
   * Download a file using the browser's session/cookies (`GET /tabs/{id}/download`).
   * Returns Base64-encoded content by default, or saves to disk when `opts.output` is set.
   * @param tabId - Target tab identifier (whose session/cookies are used).
   * @param url   - URL of the file to download.
   * @param opts  - Optional server-side output path.
   */
  download(tabId, url, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/download`, { query: { url, output: opts?.output } });
  }
  /**
   * Attach a local file to a `<input type="file">` element (`POST /tabs/{id}/upload`).
   * @param tabId    - Target tab identifier.
   * @param filePath - Server-side path to the file to attach.
   * @param opts     - Optional CSS selector for the file input (defaults to `input[type=file]`).
   */
  upload(tabId, filePath, opts) {
    const body = { selector: opts?.selector };
    if (opts?.files) body.files = opts.files;
    if (opts?.paths) body.paths = opts.paths;
    if (!opts?.files && !opts?.paths) body.path = filePath;
    return apiFetch(this.cfg, `/tabs/${tabId}/upload`, { body });
  }
  // -------------------------------------------------------------------------
  // Cookies
  // -------------------------------------------------------------------------
  /**
   * Get all cookies visible to the current page (`GET /tabs/{id}/cookies`).
   * @param tabId - Target tab identifier.
   * @param opts  - Optional URL and name filters.
   */
  cookiesGet(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/cookies`, {
      query: { url: opts?.url, name: opts?.name }
    });
  }
  /**
   * Set one or more cookies (`POST /tabs/{id}/cookies`).
   * @param tabId   - Target tab identifier.
   * @param cookies - Cookie objects to set.
   * @param url     - URL to set cookies for (optional, defaults to current tab URL).
   */
  cookiesSet(tabId, cookies, url) {
    return apiFetch(this.cfg, `/tabs/${tabId}/cookies`, { body: { url, cookies } });
  }
  // -------------------------------------------------------------------------
  // Web storage
  // -------------------------------------------------------------------------
  /**
   * Read localStorage and/or sessionStorage for the current page (`GET /storage`).
   * @param tabId - Target tab identifier.
   * @param opts  - Optional storage type and key filters.
   */
  storageGet(tabId, opts) {
    return apiFetch(this.cfg, "/storage", { query: { type: opts?.type, key: opts?.key, tabId } });
  }
  /**
   * Write a key-value entry to localStorage or sessionStorage (`POST /storage`).
   * @param tabId - Target tab identifier.
   * @param key   - Storage key.
   * @param value - Value to store (string).
   * @param opts  - Optional storage type (default `"local"`).
   */
  storageSet(tabId, key, value, opts) {
    return apiFetch(this.cfg, "/storage", { body: { key, value, type: opts?.type ?? "local", tabId } });
  }
  /**
   * Delete a specific key from storage (`DELETE /storage`).
   * Omit `opts.key` to clear the entire store.
   * @param tabId - Target tab identifier.
   * @param opts  - Storage type and optional key.
   */
  storageDelete(tabId, opts) {
    return apiFetch(this.cfg, "/storage", {
      method: "DELETE",
      query: { type: opts?.type ?? "local", key: opts?.key, tabId }
    });
  }
  /**
   * Clear localStorage, sessionStorage, or both (`DELETE /storage`).
   * @param tabId - Target tab identifier.
   * @param opts  - Storage type to clear; use `all: true` to clear both.
   */
  storageClear(tabId, opts) {
    return apiFetch(this.cfg, "/storage", {
      method: "DELETE",
      query: { type: opts?.all ? void 0 : opts?.type ?? "local", all: opts?.all, tabId }
    });
  }
  // -------------------------------------------------------------------------
  // Tab Hash Store (per-tab in-memory key-value, Redis Hash semantics)
  // -------------------------------------------------------------------------
  /**
   * Set one or more field→value pairs (`POST /tabs/{id}/hash`).
   * Resembles Redis HSET. Data is automatically cleared on page navigation or tab close.
   * @param tabId - Target tab identifier.
   * @param key   - Field name, or an array of { key, value } pairs (batch).
   * @param value - Value to store. Omit when `key` is an array.
   */
  hset(tabId, key, value) {
    const flat = {};
    if (Array.isArray(key)) {
      for (const f of key) flat[f.key] = f.value;
    } else {
      flat[key] = value ?? "";
    }
    return apiFetch(this.cfg, `/tabs/${tabId}/hash`, { body: flat });
  }
  /**
   * Get a single field value (`GET /tabs/{id}/hash?key=...`).
   * Resembles Redis HGET.
   * @param tabId - Target tab identifier.
   * @param key   - Field name to retrieve.
   */
  hget(tabId, key) {
    return apiFetch(this.cfg, `/tabs/${tabId}/hash`, { query: { key } });
  }
  /**
   * Get all field→value pairs for a tab (`GET /tabs/{id}/hash`).
   * Resembles Redis HGETALL.
   * @param tabId - Target tab identifier.
   */
  hgetall(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/hash`);
  }
  /**
   * Delete one or more fields (`DELETE /tabs/{id}/hash?key=...`).
   * Resembles Redis HDEL.
   * @param tabId - Target tab identifier.
   * @param key   - Field name to delete. Omit to clear all fields for the tab.
   */
  hdel(tabId, key) {
    if (key) {
      return apiFetch(this.cfg, `/tabs/${tabId}/hash`, { method: "DELETE", query: { key } });
    }
    return apiFetch(this.cfg, `/tabs/${tabId}/hash`, { method: "DELETE" });
  }
  /**
   * Check if a field exists (`GET /tabs/{id}/hash/exists?key=...`).
   * Resembles Redis HEXISTS.
   * @param tabId - Target tab identifier.
   * @param key   - Field name to check.
   */
  hexists(tabId, key) {
    return apiFetch(this.cfg, `/tabs/${tabId}/hash/exists`, { query: { key } });
  }
  /**
   * List all field names in the tab's store (`GET /tabs/{id}/hash/keys`).
   * Resembles Redis HKEYS.
   * @param tabId - Target tab identifier.
   */
  hkeys(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/hash/keys`);
  }
  /**
   * Get the number of fields stored (`GET /tabs/{id}/hash/length`).
   * Resembles Redis HLEN.
   * @param tabId - Target tab identifier.
   */
  hlen(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/hash/length`);
  }
  /**
   * List all saved browser session states (`GET /state/list`).
   * States contain cookies and web storage, optionally encrypted.
   */
  stateList() {
    return apiFetch(this.cfg, "/state/list");
  }
  /**
   * Capture and persist the current browser session state (`POST /state/save`).
   * Saves cookies and web storage for the tab's current origin.
   * @param tabId - Tab whose session to capture.
   * @param opts  - Optional name and encryption flag.
   */
  stateSave(tabId, opts) {
    return apiFetch(this.cfg, "/state/save", {
      body: { name: opts?.name, encrypt: opts?.encrypt, tabId }
    });
  }
  /**
   * Restore a previously saved session state into the browser (`POST /state/load`).
   * @param tabId - Tab to restore the state into.
   * @param opts  - State name (exact or prefix match).
   */
  stateLoad(tabId, opts) {
    return apiFetch(this.cfg, "/state/load", { body: { name: opts.name, tabId } });
  }
  /**
   * Inspect the full content of a saved state file (`GET /state/show`).
   * Returns all cookies and storage entries in plaintext.
   * @param name - Exact state name.
   */
  stateShow(name) {
    return apiFetch(this.cfg, "/state/show", { query: { name } });
  }
  /**
   * Permanently delete a saved state file (`DELETE /state`).
   * @param name - Exact state name to delete.
   */
  stateDelete(name) {
    return apiFetch(this.cfg, "/state", { method: "DELETE", query: { name } });
  }
  /**
   * Remove state files older than a threshold (`POST /state/clean`).
   * @param opts - `olderThan` in hours (default: 24).
   */
  stateClean(opts) {
    return apiFetch(this.cfg, "/state/clean", { body: { olderThan: opts?.olderThan ?? 24 } });
  }
  // -------------------------------------------------------------------------
  // Page inspect (2026-04-29)
  // -------------------------------------------------------------------------
  /** Get current page title (`GET /tabs/{id}/title`). */
  pageTitle(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/title`);
  }
  /** Get current page URL (`GET /tabs/{id}/url`). */
  pageUrl(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/url`);
  }
  /** Get page HTML, optionally scoped to a selector (`GET /tabs/{id}/html`). */
  pageHtml(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/html`, {
      query: { selector: opts?.selector, ref: opts?.ref, frameId: opts?.frameId, maxChars: opts?.maxChars }
    });
  }
  /** Get computed CSS styles for an element (`GET /tabs/{id}/styles`). */
  pageStyles(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/styles`, {
      query: { selector: opts?.selector, ref: opts?.ref, frameId: opts?.frameId, prop: opts?.prop }
    });
  }
  /** Get `.value` property of a form element by ref (`GET /tabs/{id}/value`). */
  elementValue(tabId, ref) {
    return apiFetch(this.cfg, `/tabs/${tabId}/value`, { query: { ref } });
  }
  /** Get an HTML attribute of an element by ref (`GET /tabs/{id}/attr`). */
  elementAttr(tabId, ref, name) {
    return apiFetch(this.cfg, `/tabs/${tabId}/attr`, { query: { ref, name } });
  }
  /** Count elements matching a CSS selector (`GET /tabs/{id}/count`). */
  elementCount(tabId, selector) {
    return apiFetch(this.cfg, `/tabs/${tabId}/count`, { query: { selector } });
  }
  /** Get bounding box of an element by ref (`GET /tabs/{id}/box`). */
  elementBox(tabId, ref) {
    return apiFetch(this.cfg, `/tabs/${tabId}/box`, { query: { ref } });
  }
  /** Check if an element is visible (`GET /tabs/{id}/visible`). */
  elementVisible(tabId, ref) {
    return apiFetch(this.cfg, `/tabs/${tabId}/visible`, { query: { ref } });
  }
  /** Check if an element is enabled (`GET /tabs/{id}/enabled`). */
  elementEnabled(tabId, ref) {
    return apiFetch(this.cfg, `/tabs/${tabId}/enabled`, { query: { ref } });
  }
  /** Check if a checkbox/radio is checked (`GET /tabs/{id}/checked`). */
  elementChecked(tabId, ref) {
    return apiFetch(this.cfg, `/tabs/${tabId}/checked`, { query: { ref } });
  }
  // -------------------------------------------------------------------------
  // Handoff (2026-04-25)
  // -------------------------------------------------------------------------
  /**
   * Pause a tab for human intervention (`POST /tabs/{id}/handoff`).
   * While paused, action/macro/evaluate requests return HTTP 409.
   */
  handoff(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/handoff`, {
      body: { reason: opts?.reason, timeoutSec: opts?.timeoutSec }
    });
  }
  /**
   * Resume a paused tab, clearing handoff state (`POST /tabs/{id}/resume`).
   */
  resume(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/resume`, { body: {} });
  }
  /**
   * Query the handoff status of a tab (`GET /tabs/{id}/handoff`).
   */
  handoffStatus(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/handoff`);
  }
  // -------------------------------------------------------------------------
  // Network route / intercept (2026-05-04)
  // -------------------------------------------------------------------------
  /**
   * Add an HTTP request intercept rule (`POST /tabs/{id}/network/route`).
   * Requires `security.allowNetworkIntercept = true`.
   */
  networkRouteAdd(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/network/route`, { body: opts });
  }
  /**
   * Remove intercept rule(s) (`DELETE /tabs/{id}/network/route`).
   * Omit `pattern` to clear all rules.
   */
  networkRouteRemove(tabId, pattern) {
    return apiFetch(this.cfg, `/tabs/${tabId}/network/route`, {
      method: "DELETE",
      query: { pattern }
    });
  }
  /**
   * List current intercept rules (`GET /tabs/{id}/network/route`).
   */
  networkRouteList(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/network/route`);
  }
  // -------------------------------------------------------------------------
  // Emulation (2026-05-04)
  // -------------------------------------------------------------------------
  /**
   * Get current page viewport and scroll state (`GET /tabs/{id}/emulation/viewport`).
   *
   * Returns `{ vh, vw, scrollY, scrollHeight, clientHeight, atBottom }`.
   * Useful for scroll-position checks without evaluating raw JS.
   */
  viewportGet(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/emulation/viewport`, { method: "GET" });
  }
  /** Set viewport size (`POST /tabs/{id}/emulation/viewport`). */
  emulationViewport(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/emulation/viewport`, { body: { ...opts, tabId } });
  }
  /** Set geolocation (`POST /tabs/{id}/emulation/geolocation`). */
  emulationGeolocation(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/emulation/geolocation`, { body: { ...opts, tabId } });
  }
  /** Emulate CSS media feature (`POST /tabs/{id}/emulation/media`). */
  emulationMedia(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/emulation/media`, { body: { ...opts, tabId } });
  }
  /** Enable/disable offline mode or throttle network (`POST /tabs/{id}/emulation/offline`). */
  emulationOffline(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/emulation/offline`, { body: { ...opts, tabId } });
  }
  /** Set extra request headers (`POST /tabs/{id}/emulation/headers`). */
  emulationHeaders(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/emulation/headers`, { body: { ...opts, tabId } });
  }
  /** Set HTTP Basic Auth credentials (`POST /tabs/{id}/emulation/credentials`). */
  emulationCredentials(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/emulation/credentials`, { body: { ...opts, tabId } });
  }
  // -------------------------------------------------------------------------
  // Instances (Orchestrator)
  // -------------------------------------------------------------------------
  /**
   * List all managed PinchTab instances (`GET /instances`). Orchestrator only.
   */
  instances() {
    return apiFetch(this.cfg, "/instances");
  }
  /**
   * Start a new PinchTab instance (`POST /instances/start`). Orchestrator only.
   * @param opts - Profile, mode, port, and extension paths.
   */
  instanceNew(opts) {
    return apiFetch(this.cfg, "/instances/start", { body: opts ?? {} });
  }
  /**
   * Get details of a specific instance by ID (`GET /instances/{id}`). Orchestrator only.
   * @param id - Instance ID.
   */
  instanceGet(id) {
    return apiFetch(this.cfg, `/instances/${id}`);
  }
  /**
   * Attach to an external Chrome DevTools Protocol instance (`POST /instances/attach`). Orchestrator only.
   * @param opts - CDP WebSocket URL and optional name.
   */
  instanceAttach(opts) {
    return apiFetch(this.cfg, "/instances/attach", { body: opts });
  }
  /**
   * Attach to an external PinchTab Bridge server (`POST /instances/attach-bridge`). Orchestrator only.
   * @param opts - Remote base URL, optional name and auth token.
   */
  instanceAttachBridge(opts) {
    return apiFetch(this.cfg, "/instances/attach-bridge", { body: opts });
  }
  /**
   * Stop a running instance (`POST /instances/{id}/stop`). Orchestrator only.
   * @param id - Instance ID.
   */
  instanceStop(id) {
    return apiFetch(this.cfg, `/instances/${id}/stop`, { method: "POST" });
  }
  /**
   * Start a stopped instance (`POST /instances/{id}/start`). Orchestrator only.
   * @param id - Instance ID.
   */
  instanceStart(id) {
    return apiFetch(this.cfg, `/instances/${id}/start`, { method: "POST" });
  }
  /**
   * Soft-restart an instance without closing the browser (`POST /instances/{id}/restart`).
   * @param id - Instance ID.
   */
  instanceRestart(id) {
    return apiFetch(this.cfg, `/instances/${id}/restart`, { method: "POST" });
  }
  /**
   * Retrieve stdout/stderr logs for an instance as plain text (`GET /instances/{id}/logs`).
   * @param id - Instance ID.
   */
  instanceLogs(id) {
    return apiFetch(this.cfg, `/instances/${id}/logs`);
  }
  /**
   * List all open tabs inside a specific instance (`GET /instances/{id}/tabs`). Orchestrator only.
   * @param id - Instance ID.
   */
  async instanceTabsList(id) {
    const tabs = await apiFetch(this.cfg, `/instances/${id}/tabs`);
    return tabs.map((tab) => ({ ...tab, tabId: tab.id }));
  }
  /**
   * Open a new tab inside a specific instance (`POST /instances/{id}/tabs/open`). Orchestrator only.
   * @param id  - Instance ID.
   * @param url - Optional URL to navigate to.
   */
  instanceTabsOpen(id, url) {
    return apiFetch(this.cfg, `/instances/${id}/tabs/open`, { body: { url } });
  }
  /**
   * Get all tabs across all managed instances (`GET /instances/tabs`). Orchestrator only.
   */
  async instancesTabsAll() {
    const tabs = await apiFetch(this.cfg, "/instances/tabs");
    return tabs.map((tab) => ({ ...tab, tabId: tab.id }));
  }
  /**
   * Get resource metrics (CPU, memory) for all instances (`GET /instances/metrics`). Orchestrator only.
   */
  instancesMetrics() {
    return apiFetch(this.cfg, "/instances/metrics");
  }
  // -------------------------------------------------------------------------
  // Profiles
  // -------------------------------------------------------------------------
  /**
   * List all available browser profiles (`GET /profiles`). Orchestrator only.
   */
  profiles() {
    return apiFetch(this.cfg, "/profiles");
  }
  /**
   * Get a single browser profile by ID or name (`GET /profiles/{id}`).
   * @param id - Profile ID or name.
   */
  profileGet(id) {
    return apiFetch(this.cfg, `/profiles/${id}`);
  }
  /**
   * Start an instance from a profile (`POST /profiles/{id}/start`). Orchestrator only.
   * @param id   - Profile ID or name.
   * @param opts - Optional port and headless flag.
   */
  profileStart(id, opts) {
    return apiFetch(this.cfg, `/profiles/${id}/start`, { method: "POST", body: opts ?? {} });
  }
  /**
   * Stop the running instance for a profile (`POST /profiles/{id}/stop`). Orchestrator only.
   * @param id - Profile ID or name.
   */
  profileStop(id) {
    return apiFetch(this.cfg, `/profiles/${id}/stop`, { method: "POST" });
  }
  /**
   * Get the currently running instance associated with a profile (`GET /profiles/{id}/instance`). Orchestrator only.
   * @param id - Profile ID or name.
   */
  profileInstance(id) {
    return apiFetch(this.cfg, `/profiles/${id}/instance`);
  }
  /**
   * Ensure a profile has a running instance, returning it.
   * When `profileId` is omitted, the default profile is used
   * (the one named `"default"`).
   *
   * If the profile already has a running instance it is returned directly;
   * otherwise a new instance is started.
   *
   * @param profileId - Profile ID or name. Omit to use the default profile.
   * @returns The running instance for the profile.
   */
  async profileEnsure(profileId) {
    if (!profileId) {
      const profiles = await this.profiles();
      const def = (profiles ?? []).find((p) => p.name === "default");
      if (!def) {
        throw { error: "No profiles available" };
      }
      profileId = def.id;
    }
    const result = await this.profileInstance(profileId);
    if (!result.running) {
      const instance = await this.profileStart(profileId);
      if (!instance.id) {
        throw { error: "Failed to start instance. profileId: " + profileId };
      }
      result.id = instance.id;
      result.running = true;
    }
    let ret = await this.instanceStart(result.id);
    const deadline = Date.now() + 15e3;
    while (ret.status === "starting" && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 500));
      ret = await this.instanceStart(result.id);
    }
    if (ret.status === "running" || ret.status === "chrome_ready") {
      return await this.instanceGet(result.id);
    } else {
      throw { error: "Failed to start instance. profileId: " + profileId + ", status: " + ret.status };
    }
  }
  // -------------------------------------------------------------------------
  // Activity & session
  // -------------------------------------------------------------------------
  /**
   * Retrieve the PinchTab activity log (`GET /api/activity`).
   * Each event represents an API request handled by the server.
   * @param tabId - Filter events to this tab.
   * @param opts  - Optional `limit` and `ageSec` (age filter in seconds).
   */
  activity(tabId, opts) {
    return apiFetch(this.cfg, "/api/activity", {
      query: { tabId, limit: opts?.limit, ageSec: opts?.ageSec }
    });
  }
  /**
   * Get details about the current agent session (`GET /sessions/me`).
   * Returns the session ID, agent ID, and creation timestamp.
   */
  sessionInfo() {
    return apiFetch(this.cfg, "/sessions/me");
  }
  // -------------------------------------------------------------------------
  // Human-V2 — anti-detection human simulation
  // -------------------------------------------------------------------------
  /**
   * Move the pointer along a natural Bézier curve (`POST /tabs/{id}/human-v2/mouse-move`).
   * Position is remembered for subsequent relative moves.
   */
  humanMouseMove(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-move`, { method: "POST", body: opts });
  }
  /**
   * Human-like left-click: Bézier move → press → Gaussian hold → release
   * (`POST /tabs/{id}/human-v2/mouse-click`).
   */
  humanMouseClick(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-click`, { method: "POST", body: opts });
  }
  /**
   * Human-like double-click (`POST /tabs/{id}/human-v2/mouse-dblclick`).
   */
  humanMouseDblClick(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-dblclick`, { method: "POST", body: opts });
  }
  /**
   * Human-like drag: Bézier move from (x,y) to (toX,toY) while holding the button
   * (`POST /tabs/{id}/human-v2/mouse-drag`).
   */
  humanMouseDrag(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-drag`, { method: "POST", body: opts });
  }
  /**
   * Move and dwell at a position without clicking (`POST /tabs/{id}/human-v2/mouse-hover`).
   */
  humanMouseHover(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-hover`, { method: "POST", body: opts });
  }
  /**
   * Smooth scroll via `Input.dispatchMouseEvent` wheel events
   * (`POST /tabs/{id}/human-v2/mouse-wheel`).
   */
  humanMouseWheel(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-wheel`, { method: "POST", body: opts });
  }
  /**
   * Natural chunked scroll with optional backtrack gesture
   * (`POST /tabs/{id}/human-v2/mouse-scroll`).
   */
  humanMouseScroll(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-scroll`, { method: "POST", body: opts });
  }
  /**
   * Scroll until a CSS selector enters the central viewport zone (20%–80%).
   * Recalibrates element position every 3 chunks; stops as soon as it is visible.
   * (`POST /tabs/{id}/human-v2/mouse-scroll-into-view`).
   */
  humanMouseScrollIntoView(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-scroll-into-view`, { method: "POST", body: opts });
  }
  /**
   * Single mouse-wheel tick (one notch up or down)
   * (`POST /tabs/{id}/human-v2/mouse-wheeltick`).
   */
  humanMouseWheelTick(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-wheeltick`, { method: "POST", body: opts });
  }
  /**
   * Human-like right-click: Bézier move → right-mousePressed (force=0.5) → hold → right-mouseReleased
   * (`POST /tabs/{id}/human-v2/mouse-rightclick`).
   */
  humanMouseRightClick(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-rightclick`, { method: "POST", body: opts });
  }
  /**
   * Press and hold mouse button without releasing (`POST /tabs/{id}/human-v2/mouse-mousedown`).
   * Must be paired with `humanMouseUp()` to release.
   */
  humanMouseDown(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-mousedown`, { method: "POST", body: opts });
  }
  /**
   * Release a held mouse button (`POST /tabs/{id}/human-v2/mouse-mouseup`).
   * Must be preceded by `humanMouseDown()`.
   */
  humanMouseUp(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-mouseup`, { method: "POST", body: opts });
  }
  /**
   * Type text character-by-character with natural timing variation
   * (`POST /tabs/{id}/human-v2/keyboard-type`).
   */
  humanKeyboardType(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/keyboard-type`, { method: "POST", body: opts });
  }
  /**
   * Press a single key with natural timing (`POST /tabs/{id}/human-v2/keyboard-press`).
   */
  humanKeyboardPress(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/keyboard-press`, { method: "POST", body: opts });
  }
  /**
   * Insert text directly into the focused element without key simulation
   * (`POST /tabs/{id}/human-v2/keyboard-insert`).
   */
  humanKeyboardInsert(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/keyboard-insert`, { method: "POST", body: opts });
  }
  /**
   * Press a keyboard shortcut (modifier + key) (`POST /tabs/{id}/human-v2/keyboard-combo`).
   * @example `humanKeyboardCombo(id, { modifiers: ["ctrl"], key: "a" })`
   */
  humanKeyboardCombo(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/keyboard-combo`, { method: "POST", body: opts });
  }
  /**
   * Select text using keyboard shortcuts (`POST /tabs/{id}/human-v2/keyboard-select`).
   * @example `humanKeyboardSelect(id, { mode: "all" })` → Ctrl+A
   */
  humanKeyboardSelect(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/keyboard-select`, { method: "POST", body: opts });
  }
  /**
   * Copy selected text to clipboard and return the copied text
   * (`POST /tabs/{id}/human-v2/clipboard-copy`).
   */
  humanClipboardCopy(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/clipboard-copy`, { method: "POST", body: {} });
  }
  /**
   * Cut selected text to clipboard and return the cut text
   * (`POST /tabs/{id}/human-v2/clipboard-cut`).
   */
  humanClipboardCut(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/clipboard-cut`, { method: "POST", body: {} });
  }
  /**
   * Paste text into the focused element (`POST /tabs/{id}/human-v2/clipboard-paste`).
   * Optionally triggers Ctrl+V after writing to the clipboard.
   */
  humanClipboardPaste(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/clipboard-paste`, { method: "POST", body: opts ?? {} });
  }
  /**
   * Focus an element using CSS selector, BackendNodeId, or click coordinates
   * (`POST /tabs/{id}/human-v2/element-focus`).
   *
   * Priority: `selector` → `nodeId` → `x`+`y` coordinates (fallback click).
   */
  humanElementFocus(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/element-focus`, { method: "POST", body: opts });
  }
  /**
   * Tiny jitter ±6px then return to original position — simulates natural
   * hand micro-movement during a reading pause
   * (`POST /tabs/{id}/human-v2/mouse-tremor`).
   *
   * No request body needed. The server uses the last known pointer position.
   */
  humanMouseTremor(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-tremor`, { method: "POST", body: {} });
  }
  /**
   * Idle cursor micro-drift: the pointer wanders ±driftPx for durationMs,
   * simulating unconscious hand movement while the user reads.
   * Unlike tremor, the cursor does NOT return to its starting position.
   * (`POST /tabs/{id}/human-v2/mouse-idle-drift`).
   */
  humanMouseIdleDrift(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-idle-drift`, { method: "POST", body: opts ?? {} });
  }
  /**
   * Run a 4-layer actionability probe on the element matched by `opts.selector`.
   *
   * Checks (all in a single CDP round-trip):
   * - **visible**: not hidden via display/visibility/opacity and has non-zero size
   * - **enabled**: not disabled/aria-disabled/inert
   * - **pointerEvents**: computed `pointer-events` style value
   * - **occluded**: whether another element covers the centre point
   *
   * Returns `actionable=true` when all four layers pass.
   * Throws HTTP 404 when the selector matches no element.
   *
   * `POST /tabs/{tabId}/human-v2/element-actionability`
   */
  humanElementActionability(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/element-actionability`, { method: "POST", body: opts });
  }
  /**
   * Click an input/textarea element using a left-biased click point.
   * Pass the element's `getBoundingClientRect()` values directly.
   *
   * `POST /tabs/{tabId}/human-v2/mouse-click-input`
   */
  humanMouseClickInput(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/mouse-click-input`, { method: "POST", body: opts });
  }
  /**
   * Poll actionability with exponential back-off until the element is ready or times out.
   * Returns HTTP 408 on timeout; HTTP 404 if the selector never matched.
   *
   * `POST /tabs/{tabId}/human-v2/element-wait-actionable`
   */
  humanElementWaitActionable(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/element-wait-actionable`, { method: "POST", body: opts });
  }
  /**
  * Resolve a CSS selector (with optional `>>>` shadow-root piercing) and
  * return the element's viewport-relative bounding rect and optional attributes.
  * Mirrors `locateByJS` / `locateAndScrollByJS` behaviour.
  *
  * ```ts
  * // locate and read aria-label
  * const loc = await pt.humanLocator(t1, {
  *   selector: "shreddit-player >>> shreddit-media-ui >>> button.play-pause-button",
  *   attrs: ["aria-label"],
  * });
  * if (loc.found) await pt.humanMouseClick(t1, { x: loc.x!, y: loc.y! });
  *
  * // locate + scroll into view in one call
  * const loc2 = await pt.humanLocator(t1, {
  *   selector: "shreddit-app >>> shreddit-post >>> faceplate-tracker",
  *   scrollIntoView: true,
  * });
  * ```
  *
  * `POST /tabs/{id}/human-v2/locator`
  */
  humanLocator(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/locator`, { method: "POST", body: opts });
  }
  /**
   * Human-like click that opens a file dialog, intercepts it via CDP,
   * and fills it with the specified files (`POST /tabs/{id}/human-v2/upload`).
   * Unlike `upload()`, this produces a real `change` event on the page.
   * @param tabId - Target tab identifier.
   * @param opts  - File paths/data and click target (selector or x/y coords).
   */
  humanUpload(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/human-v2/upload`, { body: opts });
  }
  // -------------------------------------------------------------------------
  // Virtual WebAuthn authenticator (tab-scoped)
  //
  // Enables the CDP WebAuthn domain with enableUI:false so reddit's native
  // "Use your security key" dialog never appears during passkey enrollment,
  // then registers a virtual authenticator that auto-succeeds user presence +
  // verification. Call `webauthnEnable` before the registration flow reaches
  // the passkey step; call `webauthnGetCredentials` after success to export
  // the enrolled passkey (incl. private key) for caller-side persistence.
  // -------------------------------------------------------------------------
  /**
   * Enable the virtual WebAuthn authenticator for a tab
   * (`POST /tabs/{id}/webauthn/enable`).
   *
   * Suppresses the native security-key dialog. Returns the CDP
   * `authenticatorId` (rarely needed by callers — the server tracks it
   * per-tab automatically).
   */
  webauthnEnable(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/webauthn/enable`, { body: {} });
  }
  /**
   * Export all credentials (incl. private keys) from the tab's virtual
   * authenticator (`GET /tabs/{id}/webauthn/credentials`).
   *
   * Call after a successful `navigator.credentials.create()` to retrieve the
   * enrolled passkey. The caller is responsible for persisting the private key
   * (industry-standard: PinchTab does not auto-save it).
   */
  webauthnGetCredentials(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/webauthn/credentials`, {});
  }
  /**
   * Inject a previously-exported credential into the tab's virtual
   * authenticator (`POST /tabs/{id}/webauthn/credentials`).
   *
   * Used at login time so `navigator.credentials.get()` can sign reddit's
   * challenge with the stored passkey — enabling passwordless login.
   * Requires `webauthnEnable` to have been called first on this tab.
   */
  webauthnAddCredential(tabId, opts) {
    return apiFetch(this.cfg, `/tabs/${tabId}/webauthn/credentials`, { body: opts });
  }
  /**
   * Remove the tab's virtual authenticator and disable the WebAuthn domain
   * (`DELETE /tabs/{id}/webauthn`).
   *
   * Safe to call even if no authenticator was enabled (no-op). Typically called
   * after credential export to clean up the tab's CDP state.
   */
  webauthnDisable(tabId) {
    return apiFetch(this.cfg, `/tabs/${tabId}/webauthn`, { method: "DELETE" });
  }
  /**
   * Write an info-level entry to the server-side per-tab log store.
   * Also prints to stdout via console.log.
   * Errors are silently swallowed so logging never interrupts script flow.
   */
  async logInfo(tabId, msg, tags) {
    await apiFetch(this.cfg, `/tabs/${tabId}/client_log`, {
      method: "POST",
      body: { msg, level: "info", ...tags?.length ? { tags } : {} }
    }).catch(() => {
    });
  }
  /**
   * Write a warn-level entry to the server-side per-tab log store.
   * Also prints to stdout via console.log.
   * Errors are silently swallowed so logging never interrupts script flow.
   */
  async logWarn(tabId, msg, tags) {
    await apiFetch(this.cfg, `/tabs/${tabId}/client_log`, {
      method: "POST",
      body: { msg, level: "warn", ...tags?.length ? { tags } : {} }
    }).catch(() => {
    });
  }
  /**
   * Write an error-level entry to the server-side per-tab log store.
   * Also prints to stdout via console.log.
   * Errors are silently swallowed so logging never interrupts script flow.
   */
  async logError(tabId, msg, tags) {
    await apiFetch(this.cfg, `/tabs/${tabId}/client_log`, {
      method: "POST",
      body: { msg, level: "error", ...tags?.length ? { tags } : {} }
    }).catch(() => {
    });
  }
}
function createClient(cfg) {
  return new PinchTabClient(cfg);
}
export {
  PinchTabClient,
  apiFetch,
  createClient
};
