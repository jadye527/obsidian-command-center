/**
 * Tests for smooth transition/animation on data refresh.
 * Run: node test-refresh-animations.js
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
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

console.log('=== Refresh Animation Tests ===\n');

// --- CSS Tests ---
console.log('CSS animations:');
assert(html.includes('@keyframes flashUpdate'), 'flashUpdate keyframe exists');
assert(html.includes('.value-flash'), 'value-flash class defined');
assert(html.includes('@keyframes fadeIn'), 'fadeIn keyframe exists');
assert(html.includes('.section-fade'), 'section-fade class defined');
assert(html.includes('.refresh-indicator'), 'refresh-indicator class defined');

// --- JS Helper Tests ---
console.log('\nJS helper functions:');
assert(html.includes('function animateNumber('), 'animateNumber function exists');
assert(html.includes('function flashElement('), 'flashElement function exists');
assert(html.includes('function fadeInChildren('), 'fadeInChildren function exists');
assert(html.includes('function updateTextWithFlash('), 'updateTextWithFlash function exists');

// --- Animated Render Functions ---
console.log('\nAnimated render functions:');
assert(html.includes('function renderAgentCardsAnimated('), 'renderAgentCardsAnimated exists');
assert(html.includes('function renderCostsAnimated('), 'renderCostsAnimated exists');
assert(html.includes('function renderTradingAnimated('), 'renderTradingAnimated exists');

// --- previousData tracking ---
console.log('\nState tracking:');
assert(html.includes('let previousData = null'), 'previousData initialized to null');
assert(html.includes('const isRefresh = previousData !== null'), 'isRefresh detection in renderAll');

// --- renderAll uses animated path on refresh ---
console.log('\nrenderAll branching:');
assert(html.includes('renderAgentCardsAnimated()'), 'renderAll calls renderAgentCardsAnimated on refresh');
assert(html.includes('renderCostsAnimated()'), 'renderAll calls renderCostsAnimated on refresh');
assert(html.includes('renderTradingAnimated()'), 'renderAll calls renderTradingAnimated on refresh');

// --- animateNumber uses easing ---
console.log('\nanimateNumber details:');
assert(html.includes('requestAnimationFrame(tick)'), 'animateNumber uses requestAnimationFrame');
assert(html.includes('eased'), 'animateNumber uses easing curve');

// --- flashElement reflow trick ---
console.log('\nflashElement details:');
assert(html.includes('void el.offsetWidth'), 'flashElement forces reflow for animation restart');
assert(html.includes("el.classList.add('value-flash')"), 'flashElement adds value-flash class');

// --- fadeInChildren staggering ---
console.log('\nfadeInChildren details:');
assert(html.includes('i * 0.05'), 'fadeInChildren uses staggered delay');

// --- Health section animated on refresh ---
console.log('\nHealth section animation:');
assert(html.includes("fadeInChildren(document.getElementById('health-checks'))"), 'Health checks fade in on refresh');

// --- Initial render uses non-animated path ---
console.log('\nInitial render (non-animated):');
const renderAllBlock = html.substring(html.indexOf('function renderAll(data)'), html.indexOf('function renderAll(data)') + 800);
assert(renderAllBlock.includes('renderAgentCards()') && renderAllBlock.includes('renderCosts()'), 'Initial render uses standard (non-animated) functions');

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
