/**
 * Tests for the PRD Progress panel.
 * Run with: node test-prd-progress.js
 */

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

// ---- Minimal DOM stub ----
const elements = {};
function makeEl() {
  return { textContent: '', className: '', style: {}, innerHTML: '' };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = makeEl();
    return elements[id];
  }
};
global.window = { DATA: {} };

// ---- Replicate renderPrdProgress ----
function renderPrdProgress(DATA) {
  const container = document.getElementById('prd-progress');
  const section = document.getElementById('prd-progress-section');
  const prds = DATA.prdProgress;
  if (!prds || Object.keys(prds).length === 0) { section.style.display = 'none'; return; }
  section.style.display = '';

  container.innerHTML = Object.entries(prds).map(([key, p]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    const barColor = p.pct === 100 ? 'bg-green-500' : p.pct >= 60 ? 'bg-purple-500' : 'bg-blue-500';
    const glowClass = p.pct === 100 ? 'glow-green' : '';
    return `
      <div class="mb-4 last:mb-0 ${glowClass}">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium text-white">${label}</span>
          <span class="text-xs mono text-gray-400">${p.done}/${p.total} tasks — ${p.pct}%</span>
        </div>
        <div class="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500 ${barColor}" style="width: ${p.pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Tests ----

console.log('\nPRD Progress Panel Tests\n');

// Test 1: Completed project shows green bar
console.log('1. Completed project (100%)');
renderPrdProgress({ prdProgress: { growthKit: { done: 15, total: 15, pct: 100 } } });
assert(elements['prd-progress'].innerHTML.includes('bg-green-500'), 'Bar is green at 100%');
assert(elements['prd-progress'].innerHTML.includes('15/15 tasks'), 'Shows 15/15 tasks');
assert(elements['prd-progress'].innerHTML.includes('100%'), 'Shows 100%');
assert(elements['prd-progress'].innerHTML.includes('Growth Kit'), 'camelCase key converted to title');
assert(elements['prd-progress'].innerHTML.includes('glow-green'), 'Green glow at 100%');
assert(elements['prd-progress-section'].style.display === '', 'Section is visible');

// Test 2: In-progress project (high progress)
console.log('2. In-progress project (75%)');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderPrdProgress({ prdProgress: { agentDashboard: { done: 6, total: 8, pct: 75 } } });
assert(elements['prd-progress'].innerHTML.includes('bg-purple-500'), 'Bar is purple at 75%');
assert(elements['prd-progress'].innerHTML.includes('6/8 tasks'), 'Shows 6/8 tasks');
assert(elements['prd-progress'].innerHTML.includes('Agent Dashboard'), 'camelCase key converted to title');
assert(!elements['prd-progress'].innerHTML.includes('glow-green'), 'No green glow when not 100%');

// Test 3: Low progress project
console.log('3. Low progress project (30%)');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderPrdProgress({ prdProgress: { tradingBot: { done: 3, total: 10, pct: 30 } } });
assert(elements['prd-progress'].innerHTML.includes('bg-blue-500'), 'Bar is blue at 30%');
assert(elements['prd-progress'].innerHTML.includes('3/10 tasks'), 'Shows 3/10 tasks');

// Test 4: Multiple projects
console.log('4. Multiple projects');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderPrdProgress({ prdProgress: {
  growthKit: { done: 15, total: 15, pct: 100 },
  agentDashboard: { done: 4, total: 10, pct: 40 }
} });
assert(elements['prd-progress'].innerHTML.includes('Growth Kit'), 'First project rendered');
assert(elements['prd-progress'].innerHTML.includes('Agent Dashboard'), 'Second project rendered');
assert(elements['prd-progress'].innerHTML.includes('bg-green-500'), 'Completed project has green bar');
assert(elements['prd-progress'].innerHTML.includes('bg-blue-500'), 'Low-progress project has blue bar');

// Test 5: Missing prdProgress hides section
console.log('5. Missing prdProgress data');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderPrdProgress({});
assert(elements['prd-progress-section'].style.display === 'none', 'Section hidden when no data');

// Test 6: Empty prdProgress object hides section
console.log('6. Empty prdProgress object');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderPrdProgress({ prdProgress: {} });
assert(elements['prd-progress-section'].style.display === 'none', 'Section hidden when empty object');

// Test 7: Zero progress
console.log('7. Zero progress project');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderPrdProgress({ prdProgress: { newProject: { done: 0, total: 5, pct: 0 } } });
assert(elements['prd-progress'].innerHTML.includes('0/5 tasks'), 'Shows 0/5 tasks');
assert(elements['prd-progress'].innerHTML.includes('width: 0%'), 'Bar width is 0%');
assert(elements['prd-progress'].innerHTML.includes('bg-blue-500'), 'Bar is blue at 0%');

// Test 8: Boundary at 60%
console.log('8. Boundary at 60%');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderPrdProgress({ prdProgress: { proj: { done: 6, total: 10, pct: 60 } } });
assert(elements['prd-progress'].innerHTML.includes('bg-purple-500'), 'Bar is purple at exactly 60%');

// Test 9: Just below 60%
console.log('9. Just below 60%');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderPrdProgress({ prdProgress: { proj: { done: 59, total: 100, pct: 59 } } });
assert(elements['prd-progress'].innerHTML.includes('bg-blue-500'), 'Bar is blue at 59%');

// ---- Summary ----
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
