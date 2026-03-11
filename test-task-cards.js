/**
 * Tests for expandable/collapsible task cards.
 * Run with: node test-task-cards.js
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
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c) {
        if (this._classes.has(c)) this._classes.delete(c);
        else this._classes.add(c);
      },
      contains(c) { return this._classes.has(c); }
    }
  };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = makeEl();
    return elements[id];
  }
};
global.window = {};

// ---- Test data ----
const AGENTS = [
  { id: 'obsidian', name: 'Obsidian', emoji: '\u{1f9e0}', role: 'CEO', status: 'active', model: 'Claude Opus', color: 'purple' },
  { id: 'ralph', name: 'Ralph', emoji: '\u{1f528}', role: 'Developer', status: 'active', model: 'Codex', color: 'green' }
];

// Replicate renderTasks from index.html
function renderTasks(DATA) {
  const cols = { backlog: 'col-backlog', progress: 'col-progress', review: 'col-review', done: 'col-done' };
  const counts = { backlog: 0, progress: 0, review: 0, done: 0 };
  const priorityColors = { critical: 'border-l-red-500', high: 'border-l-purple-500', medium: 'border-l-blue-500', low: 'border-l-gray-500' };
  const agentNames = {};
  const agentEmoji = {};
  DATA.agents.forEach(a => { agentEmoji[a.id] = a.emoji; agentNames[a.id] = a.name; });

  Object.values(cols).forEach(id => document.getElementById(id).innerHTML = '');

  DATA.tasks.forEach(t => {
    counts[t.status]++;
    const el = document.getElementById(cols[t.status]);
    if (!el) return;
    const desc = t.description ? `<p class="text-xs text-gray-400 mt-1">${t.description}</p>` : '';
    el.innerHTML += `
      <div class="task-card glass rounded-lg p-3 border-l-2 ${priorityColors[t.priority]}" data-task-id="${t.id}" onclick="toggleTask(this)">
        <div class="flex items-center justify-between">
          <span class="text-sm text-white flex-1">${t.title}</span>
          <svg class="task-chevron w-4 h-4 text-gray-500 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs text-gray-500">${t.agent}</span>
          <span class="text-xs px-1.5 py-0.5 rounded ${t.priority === 'critical' ? 'bg-red-500/20 text-red-300' : t.priority === 'high' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-700 text-gray-400'}">${t.priority}</span>
        </div>
        <div class="task-details">
          <div class="pt-2 mt-2 border-t border-white/5">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm">${agentEmoji[t.agent] || '\u{1f464}'}</span>
              <span class="text-xs text-gray-400">${agentNames[t.agent] || t.agent}</span>
            </div>
            ${desc}
            <div class="flex items-center gap-3 mt-1">
              <span class="text-xs text-gray-600 mono">#${t.id}</span>
              <span class="text-xs text-gray-600 capitalize">${t.status === 'progress' ? 'in progress' : t.status}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById('count-backlog').textContent = counts.backlog;
  document.getElementById('count-progress').textContent = counts.progress;
  document.getElementById('count-review').textContent = counts.review;
  document.getElementById('count-done').textContent = counts.done;
}

function toggleTask(card) {
  card.classList.toggle('expanded');
}

// ---- Tests ----

console.log('\nExpandable Task Card Tests\n');

// Test 1: Cards render with task-details section
console.log('1. Task cards contain expandable details section');
renderTasks({
  agents: AGENTS,
  tasks: [
    { id: 1, title: 'Test task', agent: 'obsidian', status: 'backlog', priority: 'high', description: 'A test description' }
  ]
});
const backlogHtml = elements['col-backlog'].innerHTML;
assert(backlogHtml.includes('task-details'), 'Card contains task-details div');
assert(backlogHtml.includes('task-chevron'), 'Card contains chevron icon');
assert(backlogHtml.includes('onclick="toggleTask(this)"'), 'Card has onclick handler');

// Test 2: Description renders when provided
console.log('2. Description renders when provided');
assert(backlogHtml.includes('A test description'), 'Description text is rendered');

// Test 3: Description is omitted when not provided
console.log('3. Description omitted when missing');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderTasks({
  agents: AGENTS,
  tasks: [
    { id: 2, title: 'No desc task', agent: 'ralph', status: 'progress', priority: 'medium' }
  ]
});
const progressHtml = elements['col-progress'].innerHTML;
assert(!progressHtml.includes('text-xs text-gray-400 mt-1'), 'No description paragraph when field is absent');

// Test 4: Task ID shown in details
console.log('4. Task ID shown in details');
assert(progressHtml.includes('#2'), 'Task ID #2 is displayed');

// Test 5: Agent name shown in details
console.log('5. Agent name shown in details');
assert(progressHtml.includes('Ralph'), 'Agent name Ralph is displayed');

// Test 6: Agent emoji shown in details
console.log('6. Agent emoji shown in details');
assert(progressHtml.includes('\u{1f528}'), 'Agent emoji is displayed');

// Test 7: data-task-id attribute present
console.log('7. data-task-id attribute present');
assert(backlogHtml.includes('data-task-id="1"'), 'data-task-id="1" attribute present');
assert(progressHtml.includes('data-task-id="2"'), 'data-task-id="2" attribute present');

// Test 8: toggleTask toggles expanded class
console.log('8. toggleTask toggles expanded class');
const mockCard = makeEl();
toggleTask(mockCard);
assert(mockCard.classList.contains('expanded'), 'First toggle adds expanded class');
toggleTask(mockCard);
assert(!mockCard.classList.contains('expanded'), 'Second toggle removes expanded class');

// Test 9: Status label shows "in progress" for progress status
console.log('9. Status label normalization');
assert(progressHtml.includes('in progress'), '"progress" status rendered as "in progress"');

// Test 10: Multiple tasks render in correct columns
console.log('10. Multiple tasks in correct columns');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderTasks({
  agents: AGENTS,
  tasks: [
    { id: 1, title: 'Backlog task', agent: 'obsidian', status: 'backlog', priority: 'low' },
    { id: 2, title: 'Progress task', agent: 'ralph', status: 'progress', priority: 'medium' },
    { id: 3, title: 'Review task', agent: 'obsidian', status: 'review', priority: 'high' },
    { id: 4, title: 'Done task', agent: 'ralph', status: 'done', priority: 'critical' },
  ]
});
assert(elements['col-backlog'].innerHTML.includes('Backlog task'), 'Backlog task in backlog column');
assert(elements['col-progress'].innerHTML.includes('Progress task'), 'Progress task in progress column');
assert(elements['col-review'].innerHTML.includes('Review task'), 'Review task in review column');
assert(elements['col-done'].innerHTML.includes('Done task'), 'Done task in done column');
assert(elements['count-backlog'].textContent === 1, 'Backlog count is 1');
assert(elements['count-progress'].textContent === 1, 'Progress count is 1');
assert(elements['count-review'].textContent === 1, 'Review count is 1');
assert(elements['count-done'].textContent === 1, 'Done count is 1');

// Test 11: Priority colors applied correctly
console.log('11. Priority border colors');
assert(elements['col-backlog'].innerHTML.includes('border-l-gray-500'), 'Low priority gets gray border');
assert(elements['col-progress'].innerHTML.includes('border-l-blue-500'), 'Medium priority gets blue border');
assert(elements['col-review'].innerHTML.includes('border-l-purple-500'), 'High priority gets purple border');
assert(elements['col-done'].innerHTML.includes('border-l-red-500'), 'Critical priority gets red border');

// Test 12: Empty task list
console.log('12. Empty task list');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderTasks({ agents: AGENTS, tasks: [] });
assert(elements['col-backlog'].innerHTML === '', 'Backlog empty with no tasks');
assert(elements['count-backlog'].textContent === 0, 'Backlog count is 0');

// Test 13: Unknown agent falls back to default emoji
console.log('13. Unknown agent fallback');
Object.keys(elements).forEach(k => elements[k] = makeEl());
renderTasks({
  agents: AGENTS,
  tasks: [{ id: 99, title: 'Mystery task', agent: 'unknown-agent', status: 'backlog', priority: 'low' }]
});
assert(elements['col-backlog'].innerHTML.includes('\u{1f464}'), 'Unknown agent gets default emoji');
assert(elements['col-backlog'].innerHTML.includes('unknown-agent'), 'Unknown agent name shown as-is');

// ---- Summary ----
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
