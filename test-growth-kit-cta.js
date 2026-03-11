// Test: "Get the Growth Kit" CTA button presence in both HTML files
// Run: node test-growth-kit-cta.js

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('Testing "Get the Growth Kit" CTA button...\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const publicHtml = fs.readFileSync(path.join(__dirname, 'public.html'), 'utf-8');

const GROWTH_KIT_URL = 'https://github.com/jadye527/obsidian-growth-kit';
const CTA_TEXT = 'Get the Growth Kit';

// --- index.html desktop CTA ---
console.log('index.html (desktop):');
assert(indexHtml.includes('id="growth-kit-cta"'), 'CTA element exists with id="growth-kit-cta"');
assert(indexHtml.includes(CTA_TEXT), 'CTA contains button text');

const ctaTag = indexHtml.match(/<a[^>]*id="growth-kit-cta"[^>]*>/);
assert(ctaTag, 'CTA is an anchor tag');
const ctaHtml = ctaTag ? ctaTag[0] : '';
assert(ctaHtml.includes(`href="${GROWTH_KIT_URL}"`), 'CTA links to Growth Kit repo');
assert(ctaHtml.includes('target="_blank"'), 'CTA opens in new tab');
assert(ctaHtml.includes('rel="noopener noreferrer"'), 'CTA has rel="noopener noreferrer"');
assert(ctaHtml.includes('bg-purple-600'), 'CTA has solid purple background');
assert(ctaHtml.includes('hover:bg-purple-500'), 'CTA has hover style');

// CTA is in the header desktop nav
const headerMatch = indexHtml.match(/<header[\s\S]*?<\/header>/);
assert(headerMatch && headerMatch[0].includes('growth-kit-cta'), 'CTA is inside the header');

// --- index.html mobile CTA ---
console.log('\nindex.html (mobile):');
assert(indexHtml.includes('growth-kit-cta-mobile'), 'Mobile CTA class exists');
const mobileMenuMatch = indexHtml.match(/<nav[^>]*id="mobile-menu"[\s\S]*?<\/nav>/);
assert(mobileMenuMatch && mobileMenuMatch[0].includes('growth-kit-cta-mobile'), 'Mobile CTA is inside mobile menu');
assert(mobileMenuMatch && mobileMenuMatch[0].includes(CTA_TEXT), 'Mobile CTA contains button text');
assert(mobileMenuMatch && mobileMenuMatch[0].includes(GROWTH_KIT_URL), 'Mobile CTA links to Growth Kit repo');

// --- public.html desktop CTA ---
console.log('\npublic.html (desktop):');
assert(publicHtml.includes('id="growth-kit-cta"'), 'CTA element exists in public.html');
assert(publicHtml.includes(CTA_TEXT), 'CTA contains button text in public.html');

const publicCtaTag = publicHtml.match(/<a[^>]*id="growth-kit-cta"[^>]*>/);
assert(publicCtaTag, 'CTA is an anchor tag in public.html');
const publicCtaHtml = publicCtaTag ? publicCtaTag[0] : '';
assert(publicCtaHtml.includes(`href="${GROWTH_KIT_URL}"`), 'CTA links to Growth Kit repo in public.html');
assert(publicCtaHtml.includes('target="_blank"'), 'CTA opens in new tab in public.html');

// --- public.html mobile CTA ---
console.log('\npublic.html (mobile):');
assert(publicHtml.includes('growth-kit-cta-mobile'), 'Mobile CTA class exists in public.html');
const publicMobileMenu = publicHtml.match(/<nav[^>]*id="mobile-menu"[\s\S]*?<\/nav>/);
assert(publicMobileMenu && publicMobileMenu[0].includes('growth-kit-cta-mobile'), 'Mobile CTA is inside mobile menu in public.html');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
