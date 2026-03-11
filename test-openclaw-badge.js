// Test: "Powered by OpenClaw" badge presence in both HTML files
// Run: node test-openclaw-badge.js

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('Testing OpenClaw badge...\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const publicHtml = fs.readFileSync(path.join(__dirname, 'public.html'), 'utf-8');

// --- index.html tests ---
console.log('index.html:');
assert(indexHtml.includes('id="openclaw-badge"'), 'Badge element exists with id="openclaw-badge"');
assert(indexHtml.includes('Powered by OpenClaw'), 'Badge contains "Powered by OpenClaw" text');
assert(indexHtml.includes('href="https://github.com/openclaw"'), 'Badge links to https://github.com/openclaw');
assert(indexHtml.includes('target="_blank"'), 'Badge link opens in new tab');
assert(indexHtml.includes('rel="noopener noreferrer"'), 'Badge link has rel="noopener noreferrer"');

// Badge is inside footer
const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/);
assert(footerMatch && footerMatch[0].includes('openclaw-badge'), 'Badge is inside the footer');

// --- public.html tests ---
console.log('\npublic.html:');
assert(publicHtml.includes('id="openclaw-badge"'), 'Badge element exists with id="openclaw-badge"');
assert(publicHtml.includes('Powered by OpenClaw'), 'Badge contains "Powered by OpenClaw" text');
assert(publicHtml.includes('href="https://github.com/openclaw"'), 'Badge links to https://github.com/openclaw');

const publicFooterMatch = publicHtml.match(/<footer[\s\S]*?<\/footer>/);
assert(publicFooterMatch && publicFooterMatch[0].includes('openclaw-badge'), 'Badge is inside the footer');

// --- Badge styling tests ---
console.log('\nStyling:');
const badgeTag = indexHtml.match(/<a[^>]*id="openclaw-badge"[^>]*>/);
assert(badgeTag, 'Badge is an anchor tag');
const badgeHtml = badgeTag ? badgeTag[0] : '';
assert(badgeHtml.includes('inline-flex'), 'Badge uses inline-flex layout');
assert(badgeHtml.includes('bg-purple-600/20'), 'Badge has purple background');
assert(badgeHtml.includes('border'), 'Badge has a border');
assert(badgeHtml.includes('hover:'), 'Badge has hover styles');

// SVG icon
const footerHtml = footerMatch ? footerMatch[0] : '';
assert(footerHtml.includes('<svg') && footerHtml.includes('openclaw-badge'), 'Badge includes an SVG icon');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
