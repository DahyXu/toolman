export default {
  slug: 'percentage-calculator',
  cat: 'convert',
  weight: 8,
  title: 'Percentage Calculator',
  metaTitle: 'Percentage Calculator — 6 Calculators in One | Toolman',
  short: 'Work out percentages, increases, decreases, discounts and tips.',
  desc:
    'Free online percentage calculator. Find what percent one number is of another, add or subtract a percentage, calculate percentage change, discounts, tips and reverse percentages — with the working shown.',
  intro: 'Six percentage calculations, each with the formula and the working shown.',
  body: `<div class="tool">
  <h2>What is X% of Y?</h2>
  <div class="row">
    <input type="number" id="a1" aria-label="Percentage" value="15" style="width:110px"> % of
    <input type="number" id="a2" aria-label="Of this number" value="200" style="width:130px">
    <strong id="ar" class="big" style="font-size:1.2rem"></strong>
  </div>
  <p class="muted" id="aw"></p>
</div>
<div class="tool">
  <h2>X is what percent of Y?</h2>
  <div class="row">
    <input type="number" id="b1" aria-label="This number" value="30" style="width:130px"> is what % of
    <input type="number" id="b2" aria-label="Is what percent of" value="200" style="width:130px">
    <strong id="br" class="big" style="font-size:1.2rem"></strong>
  </div>
  <p class="muted" id="bw"></p>
</div>
<div class="tool">
  <h2>Percentage increase or decrease</h2>
  <div class="row">
    From <input type="number" id="c1" aria-label="From value" value="80" style="width:130px">
    to <input type="number" id="c2" aria-label="To value" value="100" style="width:130px">
    <strong id="cr" class="big" style="font-size:1.2rem"></strong>
  </div>
  <p class="muted" id="cw"></p>
</div>
<div class="tool">
  <h2>Add or subtract a percentage</h2>
  <div class="row">
    <input type="number" id="d1" aria-label="Starting value" value="250" style="width:130px">
    <select id="dop" aria-label="Increase or decrease" style="width:auto"><option value="+">increased by</option><option value="-">decreased by</option></select>
    <input type="number" id="d2" aria-label="By this percentage" value="20" style="width:110px"> %
    <strong id="dr" class="big" style="font-size:1.2rem"></strong>
  </div>
  <p class="muted" id="dw"></p>
</div>
<div class="tool">
  <h2>Discount and sale price</h2>
  <div class="row">
    Original price <input type="number" id="e1" aria-label="Original price" value="89.99" step="0.01" style="width:130px">
    Discount <input type="number" id="e2" aria-label="Discount percentage" value="30" style="width:100px"> %
    <strong id="er" class="big" style="font-size:1.2rem"></strong>
  </div>
  <p class="muted" id="ew"></p>
</div>
<div class="tool">
  <h2>Tip calculator</h2>
  <div class="row">
    Bill <input type="number" id="f1" aria-label="Bill amount" value="64.50" step="0.01" style="width:120px">
    Tip <input type="number" id="f2" aria-label="Tip percentage" value="18" style="width:90px"> %
    Split <input type="number" id="f3" aria-label="Split between how many people" value="2" min="1" style="width:80px"> ways
    <strong id="fr" class="big" style="font-size:1.2rem"></strong>
  </div>
  <p class="muted" id="fw"></p>
</div>`,
  about: `<h2>The three percentage formulas worth memorising</h2>
<pre><code>Part of a whole    result = whole × percent ÷ 100
What percent       percent = part ÷ whole × 100
Percentage change  change  = (new − old) ÷ old × 100</code></pre>
<h2>Percentage points are not percent</h2>
<p>If a conversion rate rises from 4% to 6%, that is an increase of <strong>2 percentage points</strong> but <strong>50 percent</strong>. Mixing the two is the most common statistical error in business reporting, and the difference is rarely small — a headline "support fell 5%" means something very different from "support fell 5 points".</p>
<h2>Percentage changes do not cancel out</h2>
<p>A price that rises 50% then falls 50% does not return to where it started. 100 → 150 → 75. To reverse a rise of <em>p</em> percent you need a fall of <code>p ÷ (100 + p) × 100</code> percent — undoing a 50% rise takes a 33.3% cut. This is why a stock that drops 50% must gain 100% to break even.</p>
<h2>Working backwards from a total</h2>
<p>To find the original price from a discounted one, divide rather than adding the percentage back. An item costing 70 after 30% off was <code>70 ÷ 0.7 = 100</code>, not <code>70 × 1.3 = 91</code>. The same applies to extracting tax from a gross figure: at 20% VAT, the net is <code>gross ÷ 1.2</code>.</p>
<h2>Stacked discounts</h2>
<p>"30% off, then an extra 20% off" is not 50% off. It is <code>0.7 × 0.8 = 0.56</code>, so 44% off. Sequential percentages multiply; they never add.</p>
<h2>Tipping conventions</h2>
<table>
<tr><th>Country</th><th>Customary tip</th></tr>
<tr><td>United States</td><td>18–22% at restaurants; tipping is part of staff income</td></tr>
<tr><td>Canada</td><td>15–20%</td></tr>
<tr><td>United Kingdom</td><td>10–12.5%, often already added as a service charge</td></tr>
<tr><td>Most of Europe</td><td>Rounding up, or 5–10% for good service</td></tr>
<tr><td>Japan, South Korea</td><td>No tipping — it can cause offence</td></tr>
</table>`,
  faq: [
    { q: 'How do I calculate a percentage of a number?', a: 'Multiply the number by the percentage and divide by 100. 15% of 200 is 200 × 15 ÷ 100 = 30. A quick mental shortcut: 10% is the number with the decimal point moved one place left, and 5% is half of that.' },
    { q: 'How do I work out percentage increase?', a: 'Subtract the old value from the new one, divide by the old value, and multiply by 100. From 80 to 100 is (100 − 80) ÷ 80 × 100 = 25% increase.' },
    { q: 'What is the difference between percent and percentage points?', a: 'Percentage points measure the arithmetic gap between two percentages; percent measures the relative change. Going from 4% to 6% is +2 points and +50 percent.' },
    { q: 'How do I find the original price before a discount?', a: 'Divide the sale price by (1 − discount ÷ 100). An item at 70 after 30% off originally cost 70 ÷ 0.7 = 100.' },
    { q: 'How much should I tip?', a: '18–20% is standard in the United States; 10–15% in Canada and the UK, where a service charge is often included; little or nothing in Japan and much of continental Europe. Check the bill for a service charge before adding more.' },
    { q: 'Is 50% off then 20% off the same as 70% off?', a: 'No. The second discount applies to the already-reduced price: 0.5 × 0.8 = 0.4, so it is 60% off, not 70%.' },
  ],
  related: ['number-base-converter', 'color-converter', 'word-counter'],
  script: `
const $=s=>document.querySelector(s);
const n=id=>parseFloat($(id).value);
const f=(v,d)=>isFinite(v)?(+v.toFixed(d===undefined?2:d)).toLocaleString(undefined,{maximumFractionDigits:d===undefined?2:d}):'—';
function run(){
  const a1=n('#a1'),a2=n('#a2');
  const ar=a1*a2/100;
  $('#ar').textContent=isFinite(ar)?'= '+f(ar):'';
  $('#aw').textContent=isFinite(ar)?a2+' × '+a1+' ÷ 100 = '+f(ar):'';

  const b1=n('#b1'),b2=n('#b2');
  const br=b1/b2*100;
  $('#br').textContent=isFinite(br)?'= '+f(br,4).replace(/\\.?0+$/,'')+'%':'';
  $('#bw').textContent=isFinite(br)?b1+' ÷ '+b2+' × 100 = '+f(br,4).replace(/\\.?0+$/,'')+'%':'';

  const c1=n('#c1'),c2=n('#c2');
  const cr=(c2-c1)/Math.abs(c1)*100;
  const up=cr>=0;
  $('#cr').innerHTML=isFinite(cr)?'<span class="'+(up?'ok':'err')+'">'+(up?'▲ +':'▼ ')+f(cr)+'%</span>':'';
  $('#cw').textContent=isFinite(cr)?'('+c2+' − '+c1+') ÷ '+c1+' × 100 = '+f(cr)+'% '+(up?'increase':'decrease')+
    (up?'. To reverse it you would need a '+f(cr/(100+cr)*100)+'% decrease.':''):'';

  const d1=n('#d1'),d2=n('#d2'),op=$('#dop').value;
  const dr=op==='+'?d1*(1+d2/100):d1*(1-d2/100);
  $('#dr').textContent=isFinite(dr)?'= '+f(dr):'';
  $('#dw').textContent=isFinite(dr)?d1+' × '+(op==='+'?'1 + ':'1 − ')+d2+'/100 = '+f(dr)+'  (change of '+f(Math.abs(dr-d1))+')':'';

  const e1=n('#e1'),e2=n('#e2');
  const save=e1*e2/100,sale=e1-save;
  $('#er').textContent=isFinite(sale)?'= '+f(sale):'';
  $('#ew').textContent=isFinite(sale)?'You save '+f(save)+' — pay '+f(sale)+' ('+f(100-e2)+'% of the original).':'';

  const g1=n('#f1'),g2=n('#f2'),g3=Math.max(1,n('#f3')||1);
  const tip=g1*g2/100,total=g1+tip;
  $('#fr').textContent=isFinite(total)?'= '+f(total):'';
  $('#fw').textContent=isFinite(total)?'Tip '+f(tip)+' · total '+f(total)+' · '+f(total/g3)+' each across '+g3+(g3===1?' person':' people'):'';
}
document.addEventListener('input',run);
document.addEventListener('change',run);
run();
`,
};
