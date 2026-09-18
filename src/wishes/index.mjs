import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');

const css = read('wishes.css')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .replace(/\n\s*/g, '')
  .trim();

const COLORS = ['#ffe28a', '#ffc4d6', '#b9f0d6', '#bfe1ff', '#dccbff', '#ffd0a6'];
const NAMES = ['Yellow', 'Pink', 'Mint', 'Sky', 'Lavender', 'Peach'];

const SPARK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2.5l2.4 6.6 6.6 2.4-6.6 2.4L12 20.5l-2.4-6.6L3 11.5l6.6-2.4z" fill="currentColor"/></svg>';
const HEART = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20.3 4.6 13a4.8 4.8 0 0 1 6.8-6.8l.6.6.6-.6a4.8 4.8 0 1 1 6.8 6.8z" fill="currentColor"/></svg>';
const FLAME = '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M10 18c-3.3 0-5.5-2.3-5.5-5.2 0-3.4 3-5 3.3-8.8 2.6 1.6 4 3.6 4.1 6 .8-.6 1.3-1.5 1.4-2.6 1.4 1.4 2.2 3.2 2.2 5.2 0 3-2.3 5.4-5.5 5.4z" fill="currentColor"/></svg>';
const CLOCK = '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 6v4.3l2.8 1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const GLOBE = '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.8 10h14.4M10 2.8c2.2 2.3 2.2 12.1 0 14.4M10 2.8c-2.2 2.3-2.2 12.1 0 14.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const PLUS = '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

export const wishPage = {
  head: `<style>${css}</style>`,
  body: `<p class="lead">Which tool should we build next? Hang a wish, or tap ♥ on the ones you want too.</p>
<section class="ww" id="ww" aria-label="Wish wall">
<div class="sky" aria-hidden="true"><i class="moon"></i><i class="shoot"></i></div>
<form class="cmp" id="cmp" autocomplete="off">
<span class="cstr" aria-hidden="true"></span>
<div class="ctag">
<span class="hole" aria-hidden="true"></span>
<label class="vh" for="wtext">Your wish</label>
<textarea id="wtext" name="text" maxlength="80" rows="3" placeholder="I wish Toolman had…" required></textarea>
<input class="hp" type="text" name="website" tabindex="-1" aria-label="Leave this empty" aria-hidden="true">
<div class="crow">
<div class="sw" role="radiogroup" aria-label="Tag colour">${COLORS.map((c, i) => `<button type="button" role="radio" data-c="${i}" style="--c:${c}" aria-label="${NAMES[i]}" aria-checked="false"></button>`).join('')}</div>
<span class="cnt" id="wcnt" aria-live="polite">0/80</span>
</div>
</div>
<div class="cact">
<button class="hang-btn" type="submit">${SPARK}Hang it</button>
<a class="pub" href="/privacy/#wishes" title="Wishes are sent to our server and shown to everyone. Please do not include personal details.">${GLOBE}Public</a>
</div>
<p class="msg" id="wmsg" role="status" aria-live="polite"></p>
</form>
<div class="bar2">
<div class="tally"><span class="tw1" title="Wishes">${SPARK}<b id="nW">–</b><span class="vh"> wishes</span></span><span class="th1" title="Hearts">${HEART}<b id="nH">–</b><span class="vh"> hearts</span></span></div>
<div class="sort" role="group" aria-label="Order"><button type="button" data-sort="top" aria-pressed="true">${FLAME}Top</button><button type="button" data-sort="new" aria-pressed="false">${CLOCK}New</button></div>
</div>
<div class="ropes" id="ropes" role="list" aria-label="Wishes" aria-busy="true"></div>
<div class="more" id="wmore" hidden><button type="button" aria-label="Show more wishes">${PLUS}More</button></div>
</section>
<noscript><p class="muted">The wish wall needs JavaScript.</p></noscript>`,
  script: read('wishes.client.js'),
};
