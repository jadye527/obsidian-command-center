// Test: public.html sanitization — ensures sensitive data is stripped
// Run: node test-public-sanitize.js

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

// --- Extract sanitize functions from public.html ---
// Re-implement the same logic here for unit testing

function sanitizeAgent(a) {
  return {
    id: a.id,
    name: a.name,
    role: a.role,
    emoji: a.emoji,
    status: a.status,
    model: a.model,
    color: a.color,
  };
}

function sanitizeTrading(t) {
  if (!t) return null;
  return {
    total: t.total,
    resolved: t.resolved,
    wins: t.wins,
    winRate: t.winRate,
    lastTrade: t.lastTrade,
  };
}

function sanitizeData(raw) {
  return {
    updated: raw.updated,
    agents: (raw.agents || []).map(sanitizeAgent),
    trading: sanitizeTrading(raw.trading),
    prdProgress: raw.prdProgress || {},
    tasks: (raw.tasks || []).map(t => ({
      id: t.id,
      title: t.title,
      agent: t.agent,
      status: t.status,
      priority: t.priority,
    })),
    timeline: (raw.timeline || []).map(t => ({
      time: t.time,
      agent: t.agent,
      action: t.action,
    })),
  };
}

// --- Test data (mimics dashboard-state.json with sensitive fields) ---
const rawData = {
  updated: "2026-03-11T06:30:01Z",
  agents: [
    {
      id: "obsidian", name: "Obsidian", role: "CEO / Strategy",
      emoji: "\u{1f9e0}", status: "active", model: "Claude Opus",
      color: "purple", uptime: "99.2%", tasksToday: 12,
      lastAction: "Wrote Chapter 11, fixed Sentinel routing",
      warning: "some internal warning"
    },
    {
      id: "sentinel", name: "Sentinel", role: "Trading Ops",
      emoji: "\u{1f6e1}\ufe0f", status: "warning", model: "Claude Sonnet",
      color: "red", uptime: "34%", tasksToday: 0,
      lastAction: "METAR daemon restarted",
      warning: "PERFORMANCE WARNING: 0 trades in 18 days"
    }
  ],
  costs: {
    claudeMax: { label: "Claude Max", amount: 200, icon: "\u{1f9e0}" },
    codex: { label: "Codex / ChatGPT", amount: 20, icon: "\u{1f528}" },
  },
  budget: 250,
  trading: {
    total: 11, resolved: 11, wins: 3, winRate: 27,
    pnl: -50.05, lastTrade: "2026-02-20T12:22:24.752571"
  },
  health: [
    { name: "METAR Daemon", status: "healthy", detail: "PID active" },
    { name: "Ralph (tmux)", status: "healthy", detail: "Task 6/18" }
  ],
  delegations: [
    { from: "jason", to: "obsidian", task: "Build agent dashboard", status: "active" },
    { from: "obsidian", to: "ralph", task: "Growth Kit code improvements", status: "active" }
  ],
  tasks: [
    { id: 1, title: "Add Stripe checkout", agent: "obsidian", status: "backlog", priority: "high", description: "Integrate Stripe payment flow for the Growth Kit landing page." },
    { id: 2, title: "Kalshi integration", agent: "sentinel", status: "progress", priority: "high", description: "Connect to Kalshi weather markets." }
  ],
  timeline: [
    { time: "5:46 PM", agent: "obsidian", action: "Chapter 11 committed" }
  ],
  prdProgress: { growthKit: { done: 15, total: 15, pct: 100 } }
};

// ============================================================
console.log('\n=== Test: sanitizeAgent strips sensitive fields ===');

const agent = rawData.agents[0];
const sanitized = sanitizeAgent(agent);

assert(sanitized.id === 'obsidian', 'preserves id');
assert(sanitized.name === 'Obsidian', 'preserves name');
assert(sanitized.role === 'CEO / Strategy', 'preserves role');
assert(sanitized.status === 'active', 'preserves status');
assert(sanitized.model === 'Claude Opus', 'preserves model');
assert(sanitized.color === 'purple', 'preserves color');
assert(sanitized.emoji === '\u{1f9e0}', 'preserves emoji');
assert(sanitized.uptime === undefined, 'strips uptime');
assert(sanitized.tasksToday === undefined, 'strips tasksToday');
assert(sanitized.lastAction === undefined, 'strips lastAction');
assert(sanitized.warning === undefined, 'strips warning');

// ============================================================
console.log('\n=== Test: sanitizeTrading strips P&L ===');

const trading = sanitizeTrading(rawData.trading);

assert(trading.total === 11, 'preserves total');
assert(trading.wins === 3, 'preserves wins');
assert(trading.winRate === 27, 'preserves winRate');
assert(trading.lastTrade === '2026-02-20T12:22:24.752571', 'preserves lastTrade');
assert(trading.resolved === 11, 'preserves resolved');
assert(trading.pnl === undefined, 'strips pnl');

// ============================================================
console.log('\n=== Test: sanitizeTrading handles null ===');

assert(sanitizeTrading(null) === null, 'returns null for null input');
assert(sanitizeTrading(undefined) === null, 'returns null for undefined input');

// ============================================================
console.log('\n=== Test: sanitizeData strips top-level sensitive sections ===');

const clean = sanitizeData(rawData);

assert(clean.updated === rawData.updated, 'preserves updated timestamp');
assert(clean.costs === undefined, 'strips costs');
assert(clean.budget === undefined, 'strips budget');
assert(clean.health === undefined, 'strips health');
assert(clean.delegations === undefined, 'strips delegations');

// ============================================================
console.log('\n=== Test: sanitizeData preserves safe sections ===');

assert(Array.isArray(clean.agents), 'agents is array');
assert(clean.agents.length === 2, 'preserves agent count');
assert(clean.trading !== null, 'preserves trading');
assert(clean.trading.pnl === undefined, 'trading pnl still stripped');
assert(Object.keys(clean.prdProgress).length === 1, 'preserves prdProgress');
assert(clean.prdProgress.growthKit.pct === 100, 'preserves prdProgress data');

// ============================================================
console.log('\n=== Test: sanitizeData strips task descriptions ===');

assert(clean.tasks.length === 2, 'preserves task count');
assert(clean.tasks[0].title === 'Add Stripe checkout', 'preserves task title');
assert(clean.tasks[0].agent === 'obsidian', 'preserves task agent');
assert(clean.tasks[0].status === 'backlog', 'preserves task status');
assert(clean.tasks[0].priority === 'high', 'preserves task priority');
assert(clean.tasks[0].description === undefined, 'strips task description');
assert(clean.tasks[1].description === undefined, 'strips second task description');

// ============================================================
console.log('\n=== Test: sanitizeData preserves timeline ===');

assert(clean.timeline.length === 1, 'preserves timeline count');
assert(clean.timeline[0].time === '5:46 PM', 'preserves timeline time');
assert(clean.timeline[0].agent === 'obsidian', 'preserves timeline agent');
assert(clean.timeline[0].action === 'Chapter 11 committed', 'preserves timeline action');

// ============================================================
console.log('\n=== Test: sanitizeData handles empty/missing fields ===');

const minimal = sanitizeData({ updated: "2026-01-01T00:00:00Z" });
assert(minimal.agents.length === 0, 'empty agents for missing');
assert(minimal.tasks.length === 0, 'empty tasks for missing');
assert(minimal.timeline.length === 0, 'empty timeline for missing');
assert(minimal.trading === null, 'null trading for missing');
assert(Object.keys(minimal.prdProgress).length === 0, 'empty prdProgress for missing');

// ============================================================
console.log('\n=== Test: public.html file content checks ===');

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/public.html', 'utf8');

assert(!html.includes('Monthly Cost Tracker'), 'no cost tracker section');
assert(!html.includes('System Health'), 'no system health section');
assert(!html.includes('Delegation Map'), 'no delegation map section');
assert(!html.includes('localStorage'), 'no localStorage usage');
assert(!html.includes('notification-dot'), 'no notification dot logic');
assert(html.includes('Public View'), 'has Public View badge');
assert(html.includes('sanitizeData'), 'uses sanitizeData function');
assert(html.includes('sanitizeAgent'), 'uses sanitizeAgent function');
assert(html.includes('sanitizeTrading'), 'uses sanitizeTrading function');
assert(!html.includes('renderDelegations'), 'no renderDelegations function');
assert(!html.includes('renderHealth'), 'no renderHealth function');
assert(!html.includes('renderCosts'), 'no renderCosts function');
assert(html.includes('dashboard-state.json'), 'fetches live data');
assert(html.includes('fetchAndRender'), 'has auto-refresh');

// ============================================================
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
