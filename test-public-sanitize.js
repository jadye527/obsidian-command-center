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

function sanitizeCosts(costs, budget) {
  if (!costs || Object.keys(costs).length === 0) return null;
  const total = Object.values(costs).reduce((s, c) => s + (c.amount || 0), 0);
  return { total, budget: budget || 0 };
}

function sanitizeData(raw) {
  return {
    updated: raw.updated,
    agents: (raw.agents || []).map(sanitizeAgent),
    trading: sanitizeTrading(raw.trading),
    prdProgress: raw.prdProgress || {},
    costs: sanitizeCosts(raw.costs, raw.budget),
    tasks: (raw.tasks || []).map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
    })),
    timeline: (raw.timeline || []).map(t => ({
      time: t.time,
      agent: t.agent,
      action: t.action,
    })),
    health: (raw.health || []).map(h => ({
      name: h.name,
      status: h.status,
      detail: h.detail,
    })),
    delegations: (raw.delegations || []).map(d => ({
      from: d.from,
      to: d.to,
      task: d.task,
      status: d.status,
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
console.log('\n=== Test: sanitizeCosts keeps totals only ===');

const costs = sanitizeCosts(rawData.costs, rawData.budget);

assert(costs.total === 220, 'computes correct total');
assert(costs.budget === 250, 'preserves budget');
assert(costs.claudeMax === undefined, 'strips individual cost line items');
assert(costs.codex === undefined, 'strips individual cost line items (codex)');

// ============================================================
console.log('\n=== Test: sanitizeCosts handles empty/null ===');

assert(sanitizeCosts(null, 250) === null, 'returns null for null costs');
assert(sanitizeCosts({}, 250) === null, 'returns null for empty costs');
assert(sanitizeCosts(undefined, 250) === null, 'returns null for undefined costs');

// ============================================================
console.log('\n=== Test: sanitizeData keeps allowed sections ===');

const clean = sanitizeData(rawData);

assert(clean.updated === rawData.updated, 'preserves updated timestamp');
assert(Array.isArray(clean.agents), 'agents is array');
assert(clean.agents.length === 2, 'preserves agent count');
assert(clean.trading !== null, 'preserves trading');
assert(clean.trading.pnl === undefined, 'trading pnl still stripped');
assert(Object.keys(clean.prdProgress).length === 1, 'preserves prdProgress');
assert(clean.prdProgress.growthKit.pct === 100, 'preserves prdProgress data');

// ============================================================
console.log('\n=== Test: sanitizeData costs are totals only ===');

assert(clean.costs !== null, 'costs present');
assert(clean.costs.total === 220, 'costs total correct');
assert(clean.costs.budget === 250, 'costs budget correct');
assert(clean.budget === undefined, 'top-level budget not exposed');

// ============================================================
console.log('\n=== Test: sanitizeData preserves health ===');

assert(Array.isArray(clean.health), 'health is array');
assert(clean.health.length === 2, 'preserves health count');
assert(clean.health[0].name === 'METAR Daemon', 'preserves health name');
assert(clean.health[0].status === 'healthy', 'preserves health status');
assert(clean.health[0].detail === 'PID active', 'preserves health detail');

// ============================================================
console.log('\n=== Test: sanitizeData preserves delegations ===');

assert(Array.isArray(clean.delegations), 'delegations is array');
assert(clean.delegations.length === 2, 'preserves delegation count');
assert(clean.delegations[0].from === 'jason', 'preserves delegation from');
assert(clean.delegations[0].to === 'obsidian', 'preserves delegation to');
assert(clean.delegations[0].task === 'Build agent dashboard', 'preserves delegation task');
assert(clean.delegations[0].status === 'active', 'preserves delegation status');

// ============================================================
console.log('\n=== Test: sanitizeData tasks are titles only ===');

assert(clean.tasks.length === 2, 'preserves task count');
assert(clean.tasks[0].title === 'Add Stripe checkout', 'preserves task title');
assert(clean.tasks[0].status === 'backlog', 'preserves task status');
assert(clean.tasks[0].id === 1, 'preserves task id');
assert(clean.tasks[0].agent === undefined, 'strips task agent');
assert(clean.tasks[0].priority === undefined, 'strips task priority');
assert(clean.tasks[0].description === undefined, 'strips task description');
assert(clean.tasks[1].agent === undefined, 'strips second task agent');
assert(clean.tasks[1].priority === undefined, 'strips second task priority');

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
assert(minimal.costs === null, 'null costs for missing');
assert(minimal.health.length === 0, 'empty health for missing');
assert(minimal.delegations.length === 0, 'empty delegations for missing');
assert(Object.keys(minimal.prdProgress).length === 0, 'empty prdProgress for missing');

// ============================================================
console.log('\n=== Test: public.html file content checks ===');

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/public.html', 'utf8');

assert(html.includes('Monthly Cost Summary'), 'has cost summary section');
assert(!html.includes('cost-breakdown'), 'no per-service cost breakdown');
assert(html.includes('System Health'), 'has system health section');
assert(html.includes('Delegation Map'), 'has delegation map section');
assert(!html.includes('localStorage'), 'no localStorage usage');
assert(!html.includes('notification-dot'), 'no notification dot logic');
assert(html.includes('Public View'), 'has Public View badge');
assert(html.includes('sanitizeData'), 'uses sanitizeData function');
assert(html.includes('sanitizeAgent'), 'uses sanitizeAgent function');
assert(html.includes('sanitizeTrading'), 'uses sanitizeTrading function');
assert(html.includes('sanitizeCosts'), 'uses sanitizeCosts function');
assert(html.includes('renderDelegations'), 'has renderDelegations function');
assert(html.includes('renderHealth'), 'has renderHealth function');
assert(html.includes('renderCosts'), 'has renderCosts function');
assert(html.includes('dashboard-state.json'), 'fetches live data');
assert(html.includes('fetchAndRender'), 'has auto-refresh');

// ============================================================
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
