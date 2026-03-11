#!/usr/bin/env node
/**
 * Tests that sensitive data (file paths, IP addresses, API references,
 * trade details, internal comms) have been removed from committed files.
 */
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  PASS: ${msg}`);
    passed++;
  } else {
    console.log(`  FAIL: ${msg}`);
    failed++;
  }
}

function readFile(name) {
  return fs.readFileSync(path.join(__dirname, name), 'utf-8');
}

// ============================================================
// 1. No hardcoded absolute file paths with usernames
// ============================================================
console.log('\n1. No hardcoded absolute user paths');
const allFiles = ['collect.py', 'update-and-push.sh', 'index.html', 'public.html', 'dashboard-state.json'];
for (const file of allFiles) {
  const content = readFile(file);
  assert(!content.includes('/home/jasondye'), `${file} has no /home/jasondye path`);
  assert(!content.includes('/home/jason/'), `${file} has no /home/jason/ path`);
}

// ============================================================
// 2. No hardcoded internal project paths in collect.py
// ============================================================
console.log('\n2. collect.py uses env vars instead of hardcoded paths');
const collectPy = readFile('collect.py');
assert(!collectPy.includes('polymarket-trading-bot'), 'No polymarket-trading-bot path');
assert(!collectPy.includes('paper_trades.db'), 'No paper_trades.db reference');
assert(!collectPy.includes('obsidian-growth-kit'), 'No obsidian-growth-kit path');
assert(!collectPy.includes('openclaw-workspace'), 'No openclaw-workspace path');
assert(collectPy.includes('os.environ.get'), 'Uses os.environ.get for configuration');
assert(collectPy.includes('TRADE_DB'), 'Has TRADE_DB env var');
assert(collectPy.includes('TMUX_SOCK'), 'Has TMUX_SOCK env var');

// ============================================================
// 3. No specific P&L amounts in public-facing files
// ============================================================
console.log('\n3. No specific P&L amounts');
const publicHtml = readFile('public.html');
const indexHtml = readFile('index.html');
const stateJson = readFile('dashboard-state.json');

assert(!publicHtml.includes('-50.05'), 'public.html has no -50.05 P&L');
assert(!indexHtml.includes('-50.05'), 'index.html has no -50.05 P&L');
assert(!stateJson.includes('-50.05'), 'dashboard-state.json has no -50.05 P&L');

// ============================================================
// 4. No specific internal process names in committed state
// ============================================================
console.log('\n4. No internal process names in dashboard-state.json');
assert(!stateJson.includes('METAR'), 'No METAR reference');
assert(!stateJson.includes('metar_aggressive'), 'No metar_aggressive process name');
assert(!stateJson.includes('five_min_monitor'), 'No five_min_monitor process name');
assert(!stateJson.includes('openclaw-gateway'), 'No openclaw-gateway process name');
assert(!stateJson.includes('ralph-dashboard'), 'No ralph-dashboard tmux session name');

// ============================================================
// 5. No internal process names in collect.py
// ============================================================
console.log('\n5. No hardcoded process names in collect.py');
assert(!collectPy.includes('metar_aggressive_daemon'), 'No metar_aggressive_daemon');
assert(!collectPy.includes('five_min_monitor'), 'No five_min_monitor');
assert(!collectPy.includes('xqueue next'), 'No xqueue next');
assert(!collectPy.includes('openclaw-gateway'), 'No openclaw-gateway');
assert(collectPy.includes('HEALTH_CHECKS'), 'Health checks loaded from env');

// ============================================================
// 6. No internal comms / sensitive delegations in committed state
// ============================================================
console.log('\n6. No sensitive delegations/comms in dashboard-state.json');
assert(!stateJson.includes('Company operations'), 'No "Company operations" delegation');
assert(!stateJson.includes('Market scanning & trading'), 'No "Market scanning & trading" delegation');
const state = JSON.parse(stateJson);
assert(Array.isArray(state.delegations) && state.delegations.length === 0, 'Delegations array is empty');
assert(Array.isArray(state.health) && state.health.length === 0, 'Health array is empty');

// ============================================================
// 7. No cost/budget details in committed state
// ============================================================
console.log('\n7. No cost details in dashboard-state.json');
assert(Object.keys(state.costs).length === 0, 'Costs object is empty');
assert(state.budget === 0, 'Budget is zeroed');

// ============================================================
// 8. No specific internal warnings in index.html
// ============================================================
console.log('\n8. No specific internal warnings in index.html');
assert(!indexHtml.includes('PERFORMANCE WARNING'), 'No PERFORMANCE WARNING text');
assert(!indexHtml.includes('0 trades in 18 days'), 'No specific trade gap warning');
assert(!indexHtml.includes('Telegram routing'), 'No Telegram routing reference');
assert(!indexHtml.includes('HEARTBEAT.md'), 'No HEARTBEAT.md reference');
assert(!indexHtml.includes('Stripe checkout'), 'No Stripe reference');
assert(!indexHtml.includes('Kalshi'), 'No Kalshi reference');

// ============================================================
// 9. No IP addresses anywhere
// ============================================================
console.log('\n9. No IP addresses in any file');
const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
for (const file of allFiles) {
  const content = readFile(file);
  assert(!ipRegex.test(content), `${file} has no IP addresses`);
}

// ============================================================
// 10. update-and-push.sh uses relative path
// ============================================================
console.log('\n10. update-and-push.sh uses relative path');
const updateSh = readFile('update-and-push.sh');
assert(updateSh.includes('$(dirname "$0")'), 'Uses $(dirname "$0") for cd');

// ============================================================
// 11. Public HTML sanitize function still strips sensitive fields
// ============================================================
console.log('\n11. public.html sanitize function works correctly');
assert(publicHtml.includes('// Omit: pnl'), 'sanitizeTrading omits pnl');
assert(publicHtml.includes('// Omit: uptime, tasksToday, lastAction, warning'), 'sanitizeAgent omits sensitive fields');
assert(publicHtml.includes('// Omit: costs, budget, health, delegations'), 'sanitizeData omits sensitive sections');

// ============================================================
// 12. No specific internal tool names leaked
// ============================================================
console.log('\n12. No internal tool names in index.html');
assert(!indexHtml.includes('xscout'), 'No xscout reference');
assert(!indexHtml.includes('xanalytics'), 'No xanalytics reference');
assert(!indexHtml.includes('xqueue'), 'No xqueue reference');
assert(!indexHtml.includes('xpost'), 'No xpost reference');

// ============================================================
// Summary
// ============================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All sanitization checks passed!');
