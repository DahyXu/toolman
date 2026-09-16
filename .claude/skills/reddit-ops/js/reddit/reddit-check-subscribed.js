import { PinchTabClient } from "../api.js";
import { getCliOptions, requireTabId, runMain } from "./cli.js";
async function main() {
  const cli = await getCliOptions();
  const tabId = requireTabId();
  const pt = new PinchTabClient({ baseUrl: cli.baseUrl, token: cli.token });
  const r = await pt.evaluateV2(tabId, `
        (function() {
            var section = document.getElementById('communities_section');
            if (!section) return { error: 'no communities_section' };

            var controllers = section.getElementsByTagName('left-nav-communities-controller');
            if (controllers.length === 0) return { error: 'no controller element' };

            var jsonStr = controllers[0].getAttribute('initialstatejson');
            if (!jsonStr) return { error: 'no initialstatejson attr' };

            var data = JSON.parse(jsonStr);
            var subs = [];
            for (var i = 0; i < data.length; i++) {
                var name = data[i].prefixedName || '';
                if (name) subs.push(name.replace('r/', '').toLowerCase());
            }
            return subs;
        })()
    `);
  const data = r.result;
  if (data && data.error) {
    console.log(JSON.stringify({ success: false, error: data.error }));
  } else {
    const subs = Array.isArray(data) ? data.sort() : [];
    console.log(JSON.stringify({ success: true, data: subs, count: subs.length }));
  }
}
runMain(main, "reddit-check-subscribed.ts");
