/**
 * Tests for agent filter buttons on activity timeline.
 * Run with: node test-timeline-filter.js
 *
 * Uses a minimal DOM stub — no npm dependencies needed.
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
  return {
    textContent: '',
    className: '',
    style: {},
    innerHTML: '',
    setAttribute(k, v) { this['_attr_' + k] = v; },
    getAttribute(k) { return this['_attr_' + k] || null; },
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c) {
        if (this._classes.has(c)) this._classes.delete(c);
        else this._classes.add(c);
      },
      contains(c) { return this._classes.has(c); }
    }
  };
}

// Track querySelectorAll targets
let filterBtns = [];

global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = makeEl();
    return elements[id];
  },
  querySelectorAll(sel) {
    if (sel === '.timeline-filter-btn') return filterBtns;
    return [];
  }
};
global.window = {};

// ---- Test data ----
const AGENTS = [
  { id: 'obsidian', name: 'Obsidian', emoji: '\u{1f9e0}', role: 'CEO', status: 'active', model: 'Claude Opus', color: 'purple' },
  { id: 'sentinel', name: 'Sentinel', emoji: '\u{1f6e1}\ufe0f', role: 'Trading', status: 'active', model: 'Claude Sonnet', color: 'red' },
  { id: 'ralph', name: 'Ralph', emoji: '\u{1f528}', role: 'Developer', status: 'active', model: 'Codex', color: 'green' }
];

const TIMELINE = [
  { time: '5:46 PM', agent: 'obsidian', action: 'Chapter 11 committed' },
  { time: '5:35 PM', agent: 'obsidian', action: 'Sentinel heartbeat written' },
  { time: '5:20 PM', agent: 'ralph', action: 'Completed xanalytics --help' },
  { time: '5:15 PM', agent: 'ralph', action: 'Completed xqueue --help' },
  { time: '9:00 AM', agent: 'sentinel', action: 'METAR daemon running' },
];

// Replicate functions from index.html
let activeTimelineFilter = 'all';

function renderTimeline(DATA) {
  const container = document.getElementById('timeline');
  const agentEmoji = {};
  DATA.agents.forEach(a => agentEmoji[a.id] = a.emoji);

  const items = activeTimelineFilter === 'all'
    ? DATA.timeline
    : DATA.timeline.filter(t => t.agent === activeTimelineFilter);

  if (items.length === 0) {
    container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">No activity for this agent.</p>';
    return;
  }

  container.innerHTML = items.map(t => `
    <div class="timeline-item relative pl-10 pb-4">
      <div class="absolute left-0 top-1 w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center text-sm">
        ${agentEmoji[t.agent] || '\u{1f464}'}
      </div>
      <p class="text-sm text-white">${t.action}</p>
      <p class="text-xs text-gray-500 mono mt-0.5">${t.time} — ${t.agent}</p>
    </div>
  `).join('');
}

function filterTimeline(agent) {
  activeTimelineFilter = agent;

  const agentColors = { obsidian: 'purple', sentinel: 'red', ralph: 'green' };
  document.querySelectorAll('.timeline-filter-btn').forEach(btn => {
    const f = btn.getAttribute('data-filter');
    if (f === agent) {
      const color = agentColors[f] || 'purple';
      btn.className = `timeline-filter-btn px-2 py-1 rounded text-xs font-medium bg-${color}-600/30 text-${color}-300 border border-${color}-500/30`;
    } else {
      btn.className = 'timeline-filter-btn px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-400 border border-white/5 hover:border-purple-500/20';
    }
  });

  renderTimeline({ agents: AGENTS, timeline: TIMELINE });
}

function makeData() {
  return { agents: AGENTS, timeline: TIMELINE };
}

function resetElements() {
  Object.keys(elements).forEach(k => elements[k] = makeEl());
  activeTimelineFilter = 'all';
}

// ---- Tests ----

console.log('\nTimeline Agent Filter Tests\n');

// Test 1: All items render with no filter
console.log('1. All timeline items render by default');
resetElements();
renderTimeline(makeData());
const html = elements['timeline'].innerHTML;
assert(html.includes('Chapter 11 committed'), 'Obsidian event present');
assert(html.includes('Completed xanalytics --help'), 'Ralph event present');
assert(html.includes('METAR daemon running'), 'Sentinel event present');

// Test 2: Filter by obsidian shows only obsidian events
console.log('2. Filter by obsidian');
resetElements();
filterBtns = [];
activeTimelineFilter = 'obsidian';
renderTimeline(makeData());
const obsHtml = elements['timeline'].innerHTML;
assert(obsHtml.includes('Chapter 11 committed'), 'Obsidian event present');
assert(obsHtml.includes('Sentinel heartbeat written'), 'Second obsidian event present');
assert(!obsHtml.includes('Completed xanalytics'), 'Ralph event not present');
assert(!obsHtml.includes('METAR daemon'), 'Sentinel event not present');

// Test 3: Filter by ralph shows only ralph events
console.log('3. Filter by ralph');
resetElements();
activeTimelineFilter = 'ralph';
renderTimeline(makeData());
const ralphHtml = elements['timeline'].innerHTML;
assert(ralphHtml.includes('Completed xanalytics --help'), 'Ralph event present');
assert(ralphHtml.includes('Completed xqueue --help'), 'Second ralph event present');
assert(!ralphHtml.includes('Chapter 11'), 'Obsidian event not present');
assert(!ralphHtml.includes('METAR daemon'), 'Sentinel event not present');

// Test 4: Filter by sentinel shows only sentinel events
console.log('4. Filter by sentinel');
resetElements();
activeTimelineFilter = 'sentinel';
renderTimeline(makeData());
const sentHtml = elements['timeline'].innerHTML;
assert(sentHtml.includes('METAR daemon running'), 'Sentinel event present');
assert(!sentHtml.includes('Chapter 11'), 'Obsidian event not present');
assert(!sentHtml.includes('Completed xanalytics'), 'Ralph event not present');

// Test 5: Filter back to "all" restores all items
console.log('5. Reset to all');
resetElements();
activeTimelineFilter = 'all';
renderTimeline(makeData());
const allHtml = elements['timeline'].innerHTML;
const itemCount = (allHtml.match(/timeline-item/g) || []).length;
assert(itemCount === 5, `All 5 items rendered (got ${itemCount})`);

// Test 6: Empty result shows message
console.log('6. Empty filter result');
resetElements();
activeTimelineFilter = 'nonexistent';
renderTimeline(makeData());
const emptyHtml = elements['timeline'].innerHTML;
assert(emptyHtml.includes('No activity for this agent'), 'Empty state message shown');

// Test 7: filterTimeline updates active filter and re-renders
console.log('7. filterTimeline function updates state');
resetElements();
filterBtns = [];
filterTimeline('ralph');
assert(activeTimelineFilter === 'ralph', 'activeTimelineFilter set to ralph');
const reRendered = elements['timeline'].innerHTML;
assert(reRendered.includes('Completed xanalytics'), 'Ralph event rendered after filterTimeline call');
assert(!reRendered.includes('Chapter 11'), 'Obsidian event excluded after filterTimeline call');

// Test 8: filterTimeline updates button styles
console.log('8. Button style updates');
resetElements();
const btnAll = makeEl(); btnAll._attr_data_filter = null; btnAll.getAttribute = k => k === 'data-filter' ? 'all' : null;
const btnObs = makeEl(); btnObs.getAttribute = k => k === 'data-filter' ? 'obsidian' : null;
const btnSent = makeEl(); btnSent.getAttribute = k => k === 'data-filter' ? 'sentinel' : null;
const btnRalph = makeEl(); btnRalph.getAttribute = k => k === 'data-filter' ? 'ralph' : null;
filterBtns = [btnAll, btnObs, btnSent, btnRalph];

filterTimeline('sentinel');
assert(btnSent.className.includes('bg-red-600/30'), 'Sentinel button gets active red style');
assert(btnAll.className.includes('bg-gray-800'), 'All button gets inactive style');
assert(btnObs.className.includes('bg-gray-800'), 'Obsidian button gets inactive style');
assert(btnRalph.className.includes('bg-gray-800'), 'Ralph button gets inactive style');

// Test 9: filterTimeline('all') uses purple active style
console.log('9. All button uses purple active style');
filterTimeline('all');
assert(btnAll.className.includes('bg-purple-600/30'), 'All button gets active purple style');
assert(btnSent.className.includes('bg-gray-800'), 'Sentinel button gets inactive style');

// Test 10: Agent emojis appear in filtered results
console.log('10. Agent emojis in filtered results');
resetElements();
filterBtns = [];
activeTimelineFilter = 'obsidian';
renderTimeline(makeData());
const emojiHtml = elements['timeline'].innerHTML;
assert(emojiHtml.includes('\u{1f9e0}'), 'Obsidian emoji appears in filtered timeline');

// ---- Summary ----
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
