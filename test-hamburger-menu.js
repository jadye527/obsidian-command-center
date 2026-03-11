/**
 * Tests for mobile-responsive hamburger menu.
 * Run with: node test-hamburger-menu.js
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
      toggle(c, force) {
        if (force !== undefined) {
          if (force) this._classes.add(c);
          else this._classes.delete(c);
        } else {
          if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
        }
      },
      contains(c) { return this._classes.has(c); }
    }
  };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = makeEl();
    return elements[id];
  },
  querySelectorAll() { return []; }
};
global.window = {};

// ---- Replicate toggleMobileMenu from index.html ----
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const openIcon = document.getElementById('hamburger-icon');
  const closeIcon = document.getElementById('hamburger-close-icon');
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open');
  openIcon.classList.toggle('hidden', !isOpen);
  closeIcon.classList.toggle('hidden', isOpen);
}

function resetElements() {
  Object.keys(elements).forEach(k => delete elements[k]);
}

// ---- Tests ----

console.log('\nHamburger Menu Tests\n');

// Test 1: Menu starts closed
console.log('1. Menu starts closed');
resetElements();
assert(!document.getElementById('mobile-menu').classList.contains('open'), 'Mobile menu does not have open class');

// Test 2: First toggle opens menu
console.log('2. First toggle opens menu');
resetElements();
toggleMobileMenu();
assert(document.getElementById('mobile-menu').classList.contains('open'), 'Mobile menu has open class');

// Test 3: Hamburger icon hidden, close icon shown when open
console.log('3. Icon swap on open');
resetElements();
toggleMobileMenu();
assert(document.getElementById('hamburger-icon').classList.contains('hidden'), 'Hamburger icon hidden when menu open');
assert(!document.getElementById('hamburger-close-icon').classList.contains('hidden'), 'Close icon visible when menu open');

// Test 4: Second toggle closes menu
console.log('4. Second toggle closes menu');
resetElements();
toggleMobileMenu(); // open
toggleMobileMenu(); // close
assert(!document.getElementById('mobile-menu').classList.contains('open'), 'Mobile menu closed after second toggle');

// Test 5: Icons reset on close
console.log('5. Icons reset on close');
resetElements();
toggleMobileMenu(); // open
toggleMobileMenu(); // close
assert(!document.getElementById('hamburger-icon').classList.contains('hidden'), 'Hamburger icon visible when menu closed');
assert(document.getElementById('hamburger-close-icon').classList.contains('hidden'), 'Close icon hidden when menu closed');

// Test 6: Multiple open/close cycles work
console.log('6. Multiple toggle cycles');
resetElements();
for (let i = 0; i < 5; i++) {
  toggleMobileMenu(); // open
  assert(document.getElementById('mobile-menu').classList.contains('open'), `Cycle ${i+1}: menu opens`);
  toggleMobileMenu(); // close
  assert(!document.getElementById('mobile-menu').classList.contains('open'), `Cycle ${i+1}: menu closes`);
}

// Test 7: Desktop nav has hidden class (structural check)
console.log('7. Desktop nav structure');
// The desktop nav should have "hidden md:flex" — we verify the HTML contains it
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
assert(html.includes('id="desktop-nav"'), 'Desktop nav element exists');
assert(html.includes('hidden md:flex'), 'Desktop nav has hidden md:flex classes');

// Test 8: Hamburger button has md:hidden
console.log('8. Hamburger button is mobile-only');
assert(html.includes('id="hamburger-btn"'), 'Hamburger button exists');
assert(html.includes('md:hidden') && html.match(/hamburger-btn.*md:hidden|md:hidden[^"]*hamburger-btn/s), 'Hamburger button has md:hidden');

// Test 9: Mobile menu has md:hidden
console.log('9. Mobile menu panel is mobile-only');
assert(html.includes('id="mobile-menu"'), 'Mobile menu panel exists');
const mobileMenuLine = html.split('\n').find(l => l.includes('id="mobile-menu"'));
assert(mobileMenuLine && mobileMenuLine.includes('md:hidden'), 'Mobile menu has md:hidden class');

// Test 10: Mobile menu has transition classes
console.log('10. Mobile menu has transition CSS');
assert(html.includes('.mobile-menu {') || html.includes('.mobile-menu{'), 'Mobile menu CSS rule exists');
assert(html.includes('translateY'), 'Slide transition uses translateY');
assert(html.includes('.mobile-menu.open'), 'Open state CSS rule exists');

// Test 11: Mobile timestamp element exists
console.log('11. Mobile timestamp element');
assert(html.includes('id="last-updated-mobile"'), 'Mobile timestamp element exists');

// Test 12: toggleMobileMenu function exists in HTML
console.log('12. toggleMobileMenu function in HTML');
assert(html.includes('function toggleMobileMenu()'), 'toggleMobileMenu function defined');
assert(html.includes("onclick=\"toggleMobileMenu()\""), 'Hamburger button calls toggleMobileMenu');

// ---- Summary ----
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
