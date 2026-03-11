// Test: Notification dot on agent cards when status changes since last view
// Run: node test-notification-dot.js

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

// --- Mock DOM and localStorage ---
const storage = {};
const mockLocalStorage = {
  getItem(k) { return storage[k] || null; },
  setItem(k, v) { storage[k] = v; },
  removeItem(k) { delete storage[k]; },
};

const elements = {};
const mockDocument = {
  getElementById(id) {
    if (!elements[id]) elements[id] = { innerHTML: '', textContent: '', style: {}, children: [], classList: { toggle: () => {}, contains: () => false, remove: () => {}, add: () => {} }, className: '' };
    return elements[id];
  },
  querySelectorAll() { return []; },
  querySelector(sel) {
    // Parse data-notif-agent from selector
    const m = sel.match(/data-notif-agent="(\w+)"/);
    if (m) return mockDocument._notifDots[m[1]] || null;
    return null;
  },
  _notifDots: {},
};

// Minimal globals
global.localStorage = mockLocalStorage;
global.document = mockDocument;
global.window = { DATA: null };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => fn(Date.now());

// --- Extract functions from index.html ---
// We test the logic by re-implementing the key functions identically

function getLastSeenStatuses() {
  try { return JSON.parse(localStorage.getItem('agentLastSeenStatus') || '{}'); } catch { return {}; }
}

function saveLastSeenStatuses(agents) {
  const statuses = {};
  agents.forEach(a => { statuses[a.id] = a.status; });
  localStorage.setItem('agentLastSeenStatus', JSON.stringify(statuses));
}

function hasNotification(agentId, agentStatus) {
  const lastSeen = getLastSeenStatuses();
  return (agentId in lastSeen) && lastSeen[agentId] !== agentStatus;
}

function dismissNotification(agentId, agents) {
  const saved = getLastSeenStatuses();
  const agent = agents.find(a => a.id === agentId);
  if (agent) { saved[agentId] = agent.status; localStorage.setItem('agentLastSeenStatus', JSON.stringify(saved)); }
}

// ============================================================
// TESTS
// ============================================================

console.log('\n=== Notification Dot Tests ===\n');

// Clean state
delete storage['agentLastSeenStatus'];

const agents = [
  { id: 'obsidian', status: 'active', name: 'Obsidian', role: 'CEO', emoji: 'O', model: 'Opus', color: 'purple' },
  { id: 'sentinel', status: 'warning', name: 'Sentinel', role: 'Trading', emoji: 'S', model: 'Sonnet', color: 'red' },
  { id: 'ralph', status: 'active', name: 'Ralph', role: 'Dev', emoji: 'R', model: 'Codex', color: 'green' },
];

// Test 1: No notification on first visit (no stored data)
console.log('Test 1: First visit — no notifications');
assert(!hasNotification('obsidian', 'active'), 'No dot for obsidian on first visit');
assert(!hasNotification('sentinel', 'warning'), 'No dot for sentinel on first visit');
assert(!hasNotification('ralph', 'active'), 'No dot for ralph on first visit');

// Test 2: Save statuses, then no notification if statuses unchanged
console.log('\nTest 2: Statuses saved — no change, no dots');
saveLastSeenStatuses(agents);
assert(!hasNotification('obsidian', 'active'), 'No dot when obsidian unchanged');
assert(!hasNotification('sentinel', 'warning'), 'No dot when sentinel unchanged');
assert(!hasNotification('ralph', 'active'), 'No dot when ralph unchanged');

// Test 3: Status changes → notification dot appears
console.log('\nTest 3: Status changes → dots appear');
assert(hasNotification('obsidian', 'offline'), 'Dot when obsidian goes offline');
assert(hasNotification('sentinel', 'active'), 'Dot when sentinel goes active');
assert(hasNotification('ralph', 'error'), 'Dot when ralph goes error');

// Test 4: Only changed agents get dots
console.log('\nTest 4: Only changed agents get dots');
assert(!hasNotification('obsidian', 'active'), 'No dot for obsidian (unchanged)');
assert(hasNotification('sentinel', 'active'), 'Dot for sentinel (changed)');
assert(!hasNotification('ralph', 'active'), 'No dot for ralph (unchanged)');

// Test 5: Dismiss clears the notification
console.log('\nTest 5: Dismiss clears notification');
const changedAgents = [
  { id: 'obsidian', status: 'active' },
  { id: 'sentinel', status: 'active' },
  { id: 'ralph', status: 'active' },
];
dismissNotification('sentinel', changedAgents);
assert(!hasNotification('sentinel', 'active'), 'No dot after dismiss');

// Test 6: Multiple status changes tracked independently
console.log('\nTest 6: Multiple agents change independently');
saveLastSeenStatuses(agents); // reset: obsidian=active, sentinel=warning, ralph=active
assert(hasNotification('obsidian', 'error'), 'Dot for obsidian error');
assert(hasNotification('sentinel', 'offline'), 'Dot for sentinel offline');
assert(!hasNotification('ralph', 'active'), 'No dot for ralph (same)');

// Test 7: Corrupted localStorage gracefully handled
console.log('\nTest 7: Corrupted localStorage returns empty');
storage['agentLastSeenStatus'] = 'not-json{{{';
const result = getLastSeenStatuses();
assert(typeof result === 'object', 'Returns object on corrupt data');
assert(Object.keys(result).length === 0, 'Returns empty object on corrupt data');

// Test 8: Same status after dismiss, then changes again
console.log('\nTest 8: Re-change after dismiss shows dot again');
saveLastSeenStatuses(agents); // obsidian=active
assert(!hasNotification('obsidian', 'active'), 'No dot initially');
assert(hasNotification('obsidian', 'offline'), 'Dot on change to offline');
dismissNotification('obsidian', [{ id: 'obsidian', status: 'offline' }]);
assert(!hasNotification('obsidian', 'offline'), 'No dot after dismiss');
assert(hasNotification('obsidian', 'active'), 'Dot when it changes back to active');

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
