// Test: "Follow @ObsidianLabsAI" CTA button presence in both HTML files
// Run: node test-follow-cta.js

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('Testing "Follow @ObsidianLabsAI" CTA button...\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const publicHtml = fs.readFileSync(path.join(__dirname, 'public.html'), 'utf-8');

const FOLLOW_URL = 'https://x.com/ObsidianLabsAI';
const CTA_TEXT = 'Follow @ObsidianLabsAI';

// --- index.html desktop CTA ---
console.log('index.html (desktop):');
assert(indexHtml.includes('id="follow-cta"'), 'CTA element exists with id="follow-cta"');
assert(indexHtml.includes(CTA_TEXT), 'CTA contains button text');

const ctaTag = indexHtml.match(/<a[^>]*id="follow-cta"[^>]*>/);
assert(ctaTag, 'CTA is an anchor tag');
const ctaHtml = ctaTag ? ctaTag[0] : '';
assert(ctaHtml.includes(`href="${FOLLOW_URL}"`), 'CTA links to X profile');
assert(ctaHtml.includes('target="_blank"'), 'CTA opens in new tab');
assert(ctaHtml.includes('rel="noopener noreferrer"'), 'CTA has rel="noopener noreferrer"');
assert(ctaHtml.includes('bg-gray-800'), 'CTA has dark background style');
assert(ctaHtml.includes('hover:bg-gray-700'), 'CTA has hover style');

// CTA is in the header desktop nav
const headerMatch = indexHtml.match(/<header[\s\S]*?<\/header>/);
assert(headerMatch && headerMatch[0].includes('follow-cta'), 'CTA is inside the header');

// X icon SVG present in desktop CTA
const desktopCtaBlock = indexHtml.match(/<a[^>]*id="follow-cta"[\s\S]*?<\/a>/);
assert(desktopCtaBlock && desktopCtaBlock[0].includes('<svg'), 'Desktop CTA contains X icon SVG');

// --- index.html mobile CTA ---
console.log('\nindex.html (mobile):');
assert(indexHtml.includes('follow-cta-mobile'), 'Mobile CTA class exists');
const mobileMenuMatch = indexHtml.match(/<nav[^>]*id="mobile-menu"[\s\S]*?<\/nav>/);
assert(mobileMenuMatch && mobileMenuMatch[0].includes('follow-cta-mobile'), 'Mobile CTA is inside mobile menu');
assert(mobileMenuMatch && mobileMenuMatch[0].includes(CTA_TEXT), 'Mobile CTA contains button text');
assert(mobileMenuMatch && mobileMenuMatch[0].includes(FOLLOW_URL), 'Mobile CTA links to X profile');
assert(mobileMenuMatch && mobileMenuMatch[0].includes('<svg'), 'Mobile CTA contains X icon SVG');

// --- public.html desktop CTA ---
console.log('\npublic.html (desktop):');
assert(publicHtml.includes('id="follow-cta"'), 'CTA element exists in public.html');
assert(publicHtml.includes(CTA_TEXT), 'CTA contains button text in public.html');

const publicCtaTag = publicHtml.match(/<a[^>]*id="follow-cta"[^>]*>/);
assert(publicCtaTag, 'CTA is an anchor tag in public.html');
const publicCtaHtml = publicCtaTag ? publicCtaTag[0] : '';
assert(publicCtaHtml.includes(`href="${FOLLOW_URL}"`), 'CTA links to X profile in public.html');
assert(publicCtaHtml.includes('target="_blank"'), 'CTA opens in new tab in public.html');

// --- public.html mobile CTA ---
console.log('\npublic.html (mobile):');
assert(publicHtml.includes('follow-cta-mobile'), 'Mobile CTA class exists in public.html');
const publicMobileMenu = publicHtml.match(/<nav[^>]*id="mobile-menu"[\s\S]*?<\/nav>/);
assert(publicMobileMenu && publicMobileMenu[0].includes('follow-cta-mobile'), 'Mobile CTA is inside mobile menu in public.html');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
