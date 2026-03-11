/**
 * Tests for the Trading Stats panel.
 * Run with: node test-trading-panel.js
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
  return { textContent: '', className: '', style: {}, innerHTML: '' };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = makeEl();
    return elements[id];
  }
};
global.window = {};

// ---- Load renderTrading by extracting its logic ----
// We replicate the function here to test it in isolation.
function renderTrading(DATA) {
  const t = DATA.trading;
  if (!t) {
    document.getElementById('trading-panel').style.display = 'none';
    return;
  }

  const winColor = t.winRate >= 50 ? 'text-green-400' : 'text-red-400';
  const pnlColor = t.pnl >= 0 ? 'text-green-400' : 'text-red-400';
  const pnlSign = t.pnl >= 0 ? '+' : '';

  document.getElementById('trading-winrate').className = `text-2xl font-bold mono ${winColor}`;
  document.getElementById('trading-winrate').textContent = `${t.winRate}%`;

  document.getElementById('trading-pnl').className = `text-2xl font-bold mono ${pnlColor}`;
  document.getElementById('trading-pnl').textContent = t.pnl >= 0 ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`;

  document.getElementById('trading-total').textContent = t.total;

  const lastDate = new Date(t.lastTrade);
  document.getElementById('trading-last').textContent = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  document.getElementById('trading-record').textContent = `Record: ${t.wins}W / ${t.total - t.wins}L`;
  document.getElementById('trading-resolved').textContent = `${t.resolved} of ${t.total} resolved`;
}

// ---- Tests ----

console.log('\nTrading Stats Panel Tests\n');

// Test 1: Renders win rate with red color when < 50%
console.log('1. Win rate rendering (losing)');
renderTrading({ trading: { total: 11, resolved: 11, wins: 3, winRate: 27, pnl: -50.05, lastTrade: '2026-02-20T12:22:24.752571' } });
assert(elements['trading-winrate'].textContent === '27%', 'Win rate text is 27%');
assert(elements['trading-winrate'].className.includes('text-red-400'), 'Win rate is red when < 50%');

// Test 2: P&L shows negative with red color
console.log('2. P&L rendering (negative)');
assert(elements['trading-pnl'].textContent === '-$50.05', 'P&L shows -$50.05');
assert(elements['trading-pnl'].className.includes('text-red-400'), 'P&L is red when negative');

// Test 3: Total trades
console.log('3. Total trades');
assert(elements['trading-total'].textContent === 11, 'Total trades is 11');

// Test 4: Last trade date formatted
console.log('4. Last trade date');
assert(elements['trading-last'].textContent === 'Feb 20', 'Last trade date is Feb 20');

// Test 5: Record line
console.log('5. Record summary');
assert(elements['trading-record'].textContent === 'Record: 3W / 8L', 'Record shows 3W / 8L');

// Test 6: Resolved count
console.log('6. Resolved count');
assert(elements['trading-resolved'].textContent === '11 of 11 resolved', 'Resolved shows 11 of 11');

// Test 7: Positive P&L scenario
console.log('7. Positive P&L rendering');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderTrading({ trading: { total: 20, resolved: 18, wins: 14, winRate: 70, pnl: 125.50, lastTrade: '2026-03-10T08:00:00Z' } });
assert(elements['trading-winrate'].textContent === '70%', 'Win rate text is 70%');
assert(elements['trading-winrate'].className.includes('text-green-400'), 'Win rate is green when >= 50%');
assert(elements['trading-pnl'].textContent === '+$125.50', 'P&L shows +$125.50');
assert(elements['trading-pnl'].className.includes('text-green-400'), 'P&L is green when positive');
assert(elements['trading-record'].textContent === 'Record: 14W / 6L', 'Record shows 14W / 6L');

// Test 8: Missing trading data hides panel
console.log('8. Missing trading data');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderTrading({});
assert(elements['trading-panel'].style.display === 'none', 'Panel hidden when no trading data');

// Test 9: Zero P&L edge case
console.log('9. Zero P&L');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderTrading({ trading: { total: 5, resolved: 5, wins: 2, winRate: 40, pnl: 0, lastTrade: '2026-01-15T00:00:00Z' } });
assert(elements['trading-pnl'].textContent === '+$0.00', 'Zero P&L shows +$0.00');
assert(elements['trading-pnl'].className.includes('text-green-400'), 'Zero P&L is green');

// ---- Summary ----
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
