// Self-check for the PS Builder. Run from the repo root:  node psbuilder/check.js
//
// Loads the real code out of index.html and admin.html rather than a copy, so
// this fails if either page drifts from config.json or from the shape the PSE
// spreadsheet expects.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname);
const config = JSON.parse(fs.readFileSync(path.join(DIR, 'config.json'), 'utf8'));
const indexHtml = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(DIR, 'admin.html'), 'utf8');
const E = require(path.join(DIR, 'engine.js'));

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.log(`FAIL  ${name}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`PASS  ${name}`);
  }
}
function section(title) { console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 58 - title.length))}`); }
function scripts(html) { return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]); }

// ── 1. Both pages parse, and their inline handlers all exist ────────────
section('Pages compile');
[['index.html', indexHtml], ['admin.html', adminHtml]].forEach(([name, html]) => {
  let ok = true;
  scripts(html).forEach(src => {
    try { new Function(src); } catch (e) { ok = false; console.log(`        ${name}: ${e.message}`); }
  });
  check(`${name} scripts compile`, ok, true);

  const defined = new Set([...html.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]));
  const called = [...html.matchAll(/on(?:click|change)="([A-Za-z_$][\w$]*)\(/g)].map(m => m[1]);
  check(`${name} inline handlers all defined`, [...new Set(called)].filter(c => !defined.has(c)), []);
});

// ── 1a. One engine, used by both pages ─────────────────────────────────
section('Shared engine');
['index.html', 'admin.html'].forEach(name => {
  const html = name === 'index.html' ? indexHtml : adminHtml;
  check(name + ' loads the shared engine', /<script src="\.\/engine\.js"><\/script>/.test(html), true);
});
// A page redefining these would be a second copy free to drift.
const ENGINE_OWNED = ['condMet', 'resolve', 'buildLines', 'amountOf', 'assignSlots', 'applySlots',
  'blockText', 'estimate', 'esc', 'attr', 'round2', 'visibleOptions'];
['index.html', 'admin.html'].forEach(name => {
  const html = name === 'index.html' ? indexHtml : adminHtml;
  const scriptBody = scripts(html).join('\n');
  check(name + ' does not redefine engine internals',
    ENGINE_OWNED.filter(fn => scriptBody.includes('function ' + fn + '(')), []);
});
check('the engine exports what the pages need',
  ENGINE_OWNED.filter(fn => typeof E[fn] !== 'function'), []);


// ── 1b. The admin version is present, shown, and really interpolated ───
section('Admin version');
const versionMatch = adminHtml.match(/const ADMIN_VERSION = '([^']+)'/);
check('admin declares a version', !!versionMatch, true);
if (versionMatch) {
  const parts = versionMatch[1].split('.');
  check('version looks like semver', parts.length === 3 && parts.every(n => /^[0-9]+$/.test(n)), true);
  const msgLine = (adminHtml.match(/message: .*update config via admin.*/) || [''])[0];
  check('save message references the version', msgLine.indexOf('${ADMIN_VERSION}') !== -1, true);
  const expr = msgLine.replace(/^\s*message:\s*/, '').replace(/,\s*$/, '');
  check('save message interpolates at runtime',
    new Function('ADMIN_VERSION', 'return ' + expr)('9.9.9'),
    'chore(psbuilder): update config via admin v9.9.9');
  check('page title carries the version',
    adminHtml.indexOf("document.title = 'PS Builder — Admin v' + ADMIN_VERSION") !== -1, true);
  check('header badge carries the version',
    adminHtml.indexOf("textContent = 'v' + ADMIN_VERSION") !== -1, true);
}

// ── 1c. A token is only remembered once it has been proved to work ─────
section('Token persistence');
const tryTokenSrc = (adminHtml.match(/async function tryToken\([\s\S]*?\n    \}/) || [''])[0];
check('admin has a tryToken step', tryTokenSrc.length > 0, true);
if (tryTokenSrc) {
  const fetchAt = tryTokenSrc.indexOf('await fetchConfigFromGitHub()');
  const saveAt = tryTokenSrc.indexOf('localStorage.setItem');
  const clearAt = tryTokenSrc.indexOf('localStorage.removeItem');
  check('it fetches before it saves', fetchAt !== -1 && saveAt > fetchAt, true);
  check('a token that fails is cleared, not kept', clearAt !== -1 && clearAt < saveAt, true);
}
check('startup reuses the stored token', /if \(stored\) tryToken\(stored, false\)/.test(adminHtml), true);
check('the token can be forgotten on purpose', /function forgetToken\(\)/.test(adminHtml), true);
check('failures explain the status', /function explainFailure\(status\)/.test(adminHtml), true);

// ── 1d. Creating a flow actually creates one ───────────────────────────
section('New flow');
{
  const grab = (re) => (adminHtml.match(re) || [null])[0];
  const src = [
    grab(/function slugify\([\s\S]*?\n    \}/),
    grab(/function uniqueId\([\s\S]*?\n    \}/),
    grab(/function createFlow\(\)[\s\S]*?\n    \}/),
  ];
  check('admin has the pieces of the new-flow step', src.every(Boolean), true);
  if (src.every(Boolean)) {
    // A throwaway config, so the real one is untouched.
    const draft = JSON.parse(JSON.stringify(config));
    const fields = { 'nf-name': { value: 'Spectralink Handsets' }, 'nf-vertical': { value: 'collaboration' } };
    const subflowEls = [{ value: 'New install' }, { value: 'Add handsets' }, { value: 'Upgrade handsets' }];
    const doc = {
      getElementById: id => fields[id] || { value: '' },
      querySelectorAll: () => subflowEls,
    };
    let switched = null;
    const alerts = [];
    const createFlow = new Function('document', 'CONFIG', 'alert', 'switchFlow', 'EXPANDED', 'renderAdmin',
      src.join('\n') + '; return createFlow;')(
      doc, draft, m => alerts.push(m), id => { switched = id; }, new Set(), () => {});
    createFlow();

    check('it raised no complaint', alerts, []);
    check('it switched to the new flow', switched, 'spectralink-handsets');
    const made = draft.flows.find(f => f.id === switched);
    check('the flow exists', !!made, true);
    if (made) {
      // Phases, locations and columns are global; a flow carrying them was the
      // bug that made this button do nothing.
      check('it carries only what a flow owns', Object.keys(made).sort(),
        ['enabled', 'id', 'inputs', 'name', 'note', 'subflows', 'tasks', 'vertical']);
      check('it named all three subflows', made.subflows.map(s => s.name),
        ['New install', 'Add handsets', 'Upgrade handsets']);
      check('it starts empty', [made.inputs.length, made.tasks.length], [0, 0]);
    }
  }
}

// ── 1e. Nothing a user types can break the paste grid ──────────────────
section('Paste integrity');
// A tab opens a column and a newline opens a row, so either would shift every
// following cell in the spreadsheet.
check('a tab in a description collapses', E.cell('Before\tAfter'), 'Before After');
check('a newline in a description collapses', E.cell('One\nTwo'), 'One Two');
check('a carriage return collapses', E.cell('One\r\nTwo'), 'One Two');
check('null becomes empty, not the word null', E.cell(null), '');
{
  // Straight through the real block builder, not just the helper.
  const line = { phase: 'Design\tX', skill: 'A\nB', taskType: 'C', description: 'D\tE' };
  const row = E.blockText(config.taskColumns, [line]);
  check('a built row keeps its column count', row.split('\t').length, config.taskColumns.length);
  check('a built row stays on one line', row.split('\n').length, 1);
}

// ── 1f. A runaway count cannot hang the page ───────────────────────────
section('Repeat limits');
check('there is a cap', typeof E.MAX_LINES_PER_TASK, 'number');
check('Infinity yields nothing', E.repeatCount(Infinity).n, 0);
check('NaN yields nothing', E.repeatCount(NaN).n, 0);
check('a negative count yields nothing', E.repeatCount(-5).n, 0);
check('a fraction floors', E.repeatCount(2.7).n, 2);
check('a huge count is capped', E.repeatCount(100000).n, E.MAX_LINES_PER_TASK);
check('and says it capped', E.repeatCount(100000).clamped, true);
{
  const f = { id: 'x', name: 'X', vertical: config.verticals[0].id,
    subflows: [{ id: 'a', name: 'A' }],
    inputs: [{ id: 'n', type: 'number', label: 'How many?', default: 1, min: 0, max: 999999 }],
    tasks: [{ id: 't', phase: config.phases[0], skill: config.skills[0], taskType: config.taskTypes[0],
      description: 'Item {#}', subflows: 'all', repeatPer: 'n', effort: [] }] };
  const out = E.estimate(config, f, 'a', { n: 100000 });
  check('a runaway task emits at most the cap', out.lines.length, E.MAX_LINES_PER_TASK);
  check('and reports what it dropped', out.clamped.length, 1);
}

// ── 1g. The accessibility layer is present ─────────────────────────────
section('Accessibility');
['index.html', 'admin.html'].forEach(name => {
  const html = name === 'index.html' ? indexHtml : adminHtml;
  check(name + ' has exactly one h1', (html.match(/<h1\b/g) || []).length, 1);
  check(name + ' has a main landmark', /<main[\s>]/.test(html), true);
  check(name + ' has a visible focus ring', /:focus-visible/.test(html), true);
  check(name + ' respects reduced motion', /prefers-reduced-motion/.test(html), true);
  check(name + ' styles its placeholders', /::placeholder/.test(html), true);
  // Nothing may strip the focus outline without putting one back.
  const strips = /outline\s*:\s*(none|0)/.test(html);
  check(name + ' never removes the outline', strips, false);
});

// The card pickers and the toggle are the builder's primary controls; as bare
// divs they could not be reached by keyboard at all.
check('cards announce themselves as radios', /role', 'radio'|setAttribute\('role', 'radio'\)/.test(indexHtml), true);
check('cards carry a checked state', indexHtml.includes('aria-checked'), true);
check('cards sit in a labelled group', indexHtml.includes("'radiogroup'"), true);
check('cards respond to the keyboard', indexHtml.includes('card.onkeydown'), true);
check('the yes/no control is a switch', indexHtml.includes("'switch'"), true);
check('generated output is announced', /aria-live="polite"/.test(indexHtml), true);
check('admin announces its save status', /id="save-status"[^>]*aria-live/.test(adminHtml), true);
check('admin links labels to controls', adminHtml.includes('function linkLabels'), true);

// ── 1h. Failures and double-clicks ─────────────────────────────────────
section('Failure handling');
check('a failed config load is explained', indexHtml.includes('showLoadFailure'), true);
check('the load checks the response', indexHtml.includes('if (!res.ok) throw'), true);
check('an empty config is caught', indexHtml.includes('has no flows in it'), true);
check('saving twice is refused', adminHtml.includes('if (saving) return;'), true);
check('the save button disables itself', /btn\.disabled = true/.test(adminHtml), true);
check('a save failure says nothing was written', adminHtml.includes('Nothing was written'), true);
check('typed preview numbers are clamped', adminHtml.includes('function clampAnswer'), true);

// ── 2. The lists lifted from the PSE are intact ─────────────────────────
section('PSE lists');
check('seven engineer roles', (config.roles || []).map(r => r.id),
  ['TA', 'SE', 'SSE', 'SCE', 'SA', 'AC', 'SC']);
check('eight skills', (config.skills || []).length, 8);
check('skills start with Collaboration', (config.skills || [])[0], 'Collaboration');
check('the five sheet phases', config.phases,
  ['Kickoff', 'Design', 'Staging', 'Implementation', 'Project Completion & Handover']);
check('the two sheet locations', config.locations, ['Office', 'Client Site']);
// These are the same for every flow, so no flow may override them.
check('no flow overrides a PSE-fixed list',
  config.flows.filter(f => f.phases || f.locations || f.columns).map(f => f.id), []);
check('four task types', config.taskTypes,
  ['ArchiTech Activity', 'Client Dependency', 'ArchiTech Subcontractor Activity', 'ArchiTech Document Deliverable']);
check('the task block is the four sheet columns', (config.taskColumns || []).map(c => c.header),
  ['Phase', 'Skill Required', 'Task Type', 'Description']);
check('the resource block covers five resources', (config.resourceColumns || []).length, 15);
check('the resource block starts at R1', (config.resourceColumns || []).slice(0, 3).map(c => c.header),
  ['R1 Location', 'R1 Business Hours', 'R1 After Hours']);
check('the resource block ends at R5', (config.resourceColumns || []).slice(-3).map(c => c.header),
  ['R5 Location', 'R5 Business Hours', 'R5 After Hours']);
check('the blocks paste at A and J', config.pasteTargets, { task: 'A', resource: 'J' });
// The two blocks must not overlap, or one would overwrite the other.
check('no field appears in both blocks',
  (config.taskColumns || []).map(c => c.from).filter(f => (config.resourceColumns || []).some(r => r.from === f)), []);
// ── 3. config.json is internally consistent ─────────────────────────────
section('Config integrity');
// The rules live in engine.js so the admin can run them before it writes.
check('the shipped config has no problems', E.validateConfig(config), []);

// Each rule has to actually bite, or a green run means nothing.
{
  const faults = [
    ['an unknown phase', c => { c.flows[0].tasks[0].phase = 'Deployment'; }, 'does not offer'],
    ['an unknown skill', c => { c.flows[0].tasks[0].skill = 'Telepathy'; }, 'does not offer'],
    ['an unknown task type', c => { c.flows[0].tasks[0].taskType = 'Guesswork'; }, 'does not offer'],
    ['a variable that does not exist', c => { c.flows[0].tasks[0].description = 'Do {mystery} things'; }, 'unknown variable'],
    ['{#} without repeating', c => { c.flows[0].tasks[0].description = 'Site {#}'; }, 'does not repeat'],
    ['an unknown role', c => { c.flows[0].tasks[0].effort = [{ role: 'ZZZ', business: { base: 1 } }]; }, 'unknown role'],
    ['an unknown location', c => { c.flows[0].tasks[0].effort = [{ role: 'SE', location: 'Moon', business: { base: 1 } }]; }, 'does not offer'],
    ['effort with no hours', c => { c.flows[0].tasks[0].effort = [{ role: 'SE', location: 'Office' }]; }, 'no hours'],
    ['two effort lines on one role', c => { c.flows[0].tasks[0].effort = [
      { role: 'SE', business: { base: 1 } }, { role: 'SE', business: { base: 2 } }]; }, 'same role'],
    ['a retired field', c => { c.flows[0].tasks[0].trips = 2; }, 'works out itself'],
    ['a per-flow phase list', c => { c.flows[0].phases = ['Design']; }, 'PSE fixes'],
    ['a condition on a later input', c => { c.flows[0].inputs[0].showWhen = { input: 'reporting', anySelected: true }; }, 'not asked earlier'],
    ['a condition on a missing input', c => { c.flows[0].tasks[0].showWhen = { input: 'nope', isOn: true }; }, 'missing input'],
    ['an unknown subflow', c => { c.flows[0].tasks[0].subflows = ['nope']; }, 'unknown subflow'],
    ['a task in no subflow', c => { c.flows[0].tasks[0].subflows = []; }, 'no subflow at all'],
    ['a duplicate task id', c => { c.flows[0].tasks.push(Object.assign({}, c.flows[0].tasks[0])); }, 'duplicate task id'],
    ['a flow in an unknown vertical', c => { c.flows[0].vertical = 'atlantis'; }, 'unknown vertical'],
    ['a flow with no subflows', c => { c.flows[0].subflows = []; }, 'no subflows'],
    ['double counting a repeat', c => { const t = c.flows[0].tasks[0];
      t.repeatPer = 'workshops';
      t.effort = [{ role: 'SE', location: 'Office', business: { base: 1, per: [{ input: 'workshops', each: 2 }] } }]; }, 'double counting'],
    ['more roles than the sheet has columns', c => {
      ['TA', 'SE', 'SSE', 'SCE', 'SA', 'AC'].forEach((role, n) => {
        c.flows[0].tasks[n].effort = [{ role, location: 'Office', business: { base: 1 } }];
      }); }, 'resource columns'],
  ];

  const missed = [];
  faults.forEach(([label, breakIt, expect]) => {
    const draft = JSON.parse(JSON.stringify(config));
    breakIt(draft);
    const found = E.validateConfig(draft);
    if (!found.some(m => m.includes(expect))) missed.push(label);
  });
  check('every rule catches its fault', missed, []);
}

// ── 4. The engine ──────────────────────────────────────────────────────
section('Engine');

function run(f, sub, ans) {
  const out = E.estimate(config, f, sub, ans || {});
  return {
    lines: out.lines,
    slots: out.slots,
    count: out.lines.length,
    hours: out.hours,
    business: out.business,
    after: out.after,
    shown: E.inputsToShow(f, sub, out.resolved).map(i => i.id),
    ready: E.allRequiredAnswered(f, sub, out.resolved),
  };
}
const wxcc = config.flows.find(f => f.id === 'wxcc');
check('wxcc kept both engagement types as subflows', wxcc.subflows.map(s => s.id), ['new', 'migration']);

let r = run(wxcc, 'migration', {});
check('scope unanswered: nothing else is asked yet', r.shown, ['scope']);
check('scope unanswered: cannot generate', r.ready, false);

// These numbers come from the original WxCC build, before any of this.
r = run(wxcc, 'migration', { scope: 'dfd' });
check('migration + DFD on defaults: 56 tasks', r.count, 56);
check('no task carries a trip count any more', r.lines.every(l => l.trips === undefined), true);
check('migration + DFD: every input visible', r.shown.length, wxcc.inputs.length);
check('a repeating task numbers its lines', r.lines.filter(l => /^Workshop \d/.test(l.description)).map(l => l.description), [
  'Workshop 1 — discovery session', 'Workshop 2 — discovery session',
  'Workshop 3 — discovery session', 'Workshop 4 — discovery session',
]);
check('a variable substitutes its total', r.lines.filter(l => l.description.includes('Agent training')).map(l => l.description),
  ['Agent training (desktop, call/chat handling, wrap-up codes) — 2 sessions']);
check('no unresolved braces', r.lines.some(l => /\{[^}]+\}/.test(l.description)), false);
check('every line carries its skill and task type',
  r.lines.every(l => l.skill === 'Collaboration' && l.taskType === 'ArchiTech Activity'), true);
check('wxcc has no effort costed yet', r.hours, 0);
check('with no effort, no resource slots are claimed', r.slots, []);

r = run(wxcc, 'new', { scope: 'standard' });
check('standard scope hides the DFD inputs', r.shown,
  ['scope', 'workshops', 'staging-channels', 'reporting', 'agent-training', 'supervisor-training']);
check('new + standard on defaults: 32 tasks', r.count, 32);
check('the new subflow drops the legacy tasks', r.lines.filter(l => l.description.startsWith('Legacy platform')).length, 0);
check('the migration subflow keeps them', run(wxcc, 'migration', { scope: 'standard' })
  .lines.filter(l => l.description.startsWith('Legacy platform')).length, 3);
check('a hidden input cannot leak into the output',
  run(wxcc, 'new', { scope: 'standard', 'agent-domains': 4, 'ai-assistant': true }).count, 32);
check('a hidden option cannot count as ticked',
  run(wxcc, 'new', { scope: 'standard', 'staging-channels': ['sms', 'crm'] })
    .lines.filter(l => l.description === 'CRM environment access confirmed').length, 0);
check('the same option counts once visible',
  run(wxcc, 'new', { scope: 'dfd', 'staging-channels': ['sms', 'crm'] })
    .lines.filter(l => l.description === 'CRM environment access confirmed').length, 1);
check('zeroing a variable drops what it gated',
  run(wxcc, 'new', { scope: 'dfd', 'agent-domains': 0 })
    .lines.filter(l => /Knowledge|Intent-based|AI Agent/.test(l.description)).length, 0);
check('emptying a checklist drops its any-ticked tasks',
  run(wxcc, 'new', { scope: 'dfd', 'omni-channels': [] })
    .lines.filter(l => /Omnichannel Scope|OmniChannel/.test(l.description)).length, 0);

// ── 5. Effort, variables and the PSE column block ───────────────────────
section('Effort and the PSE columns');
// Mirrors the worked example: a handset rollout billed per device.
const demo = {
  id: 'demo', name: 'Spectralink Handsets', vertical: 'collaboration',
  subflows: [{ id: 'new-install', name: 'New Install' }, { id: 'add', name: 'Add Handsets' }],
  inputs: [
    { id: 'devices', type: 'number', token: 'number of devices', label: 'How many handsets?', default: 50, min: 1, max: 5000 },
    { id: 'sites', type: 'number', token: 'sites', label: 'How many sites?', default: 1, min: 1, max: 50 },
  ],
  tasks: [
    { id: 'enroll', phase: 'Implementation', skill: 'Collaboration', taskType: 'ArchiTech Activity',
      description: 'Enroll {number of devices} Spectralink Handsets to MDM', subflows: 'all',
      effort: [{ role: 'SE', location: 'Office', business: { base: 1, per: [{ input: 'devices', each: 0.25 }] } }] },
    { id: 'survey', phase: 'Design', skill: 'Collaboration', taskType: 'ArchiTech Activity',
      description: 'Site survey across {sites} sites', subflows: ['new-install'],
      effort: [
        { role: 'SA', location: 'Client Site', business: { base: 4, per: [{ input: 'sites', each: 2 }] } },
        { role: 'SE', location: 'Client Site', business: { base: 2 }, after: { base: 1 } },
      ] },
    { id: 'cutover', phase: 'Implementation', skill: 'Collaboration', taskType: 'ArchiTech Activity',
      description: 'Site {#} of {sites} — after hours cutover', subflows: 'all', repeatPer: 'sites',
      effort: [{ role: 'SSE', location: 'Office', after: { base: 3 } }] },
    { id: 'client-uat', phase: 'Implementation', skill: 'Collaboration', taskType: 'Client Dependency',
      description: 'Client completes UAT', subflows: 'all' },
  ],
};

r = run(demo, 'add', { devices: 200, sites: 1 });
check('per-unit effort: 1 + 200 x 0.25', r.lines.find(l => l.description.startsWith('Enroll')).effortLines[0].business, 51);
check('the variable reads back into the text', r.lines.find(l => l.description.startsWith('Enroll')).description,
  'Enroll 200 Spectralink Handsets to MDM');
check('a task outside this subflow is skipped', r.lines.some(l => l.description.startsWith('Site survey')), false);
check('add subflow: enroll + one cutover + client UAT', r.count, 3);
check('add subflow hours: 51 business + 3 after', r.hours, 54);
check('a client dependency still lists, with no hours of ours',
  r.lines.find(l => l.taskType === 'Client Dependency').effortLines.length, 0);

r = run(demo, 'new-install', { devices: 200, sites: 3 });
check('roles claim slots in the order they appear', r.slots, ['SE', 'SA', 'SSE']);
check('two roles can share one task',
  r.lines.find(l => l.description.startsWith('Site survey')).effortLines.map(e => [e.role, e.business, e.after]),
  [['SA', 10, 0], ['SE', 2, 1]]);
check('after hours stay separate from business hours',
  r.lines.filter(l => l.description.includes('cutover')).map(l => [l.r3Business, l.r3After]),
  [['', 3], ['', 3], ['', 3]]);
check('repeating per variable emits one line each',
  r.lines.filter(l => l.description.includes('cutover')).map(l => l.description),
  ['Site 1 of 3 — after hours cutover', 'Site 2 of 3 — after hours cutover', 'Site 3 of 3 — after hours cutover']);
check('total hours: 51 + 13 + 9', r.hours, 73);

// Each block must line up with the columns it is pasted into.
const survey = r.lines.find(l => l.description.startsWith('Site survey'));
const cell = (cols) => cols.map(c => { const v = survey[c.from]; return v == null ? '' : String(v); });

check('the task block is four columns', config.taskColumns.length, 4);
check('a task row lands where the sheet expects it', cell(config.taskColumns),
  ['Design', 'Collaboration', 'ArchiTech Activity', 'Site survey across 3 sites']);

check('the resource block is fifteen columns', config.resourceColumns.length, 15);
check('a resource row lands where the sheet expects it', cell(config.resourceColumns),
  ['Client Site', '2', '1',   // R1 = SE
   'Client Site', '10', '',  // R2 = SA
   '', '', '',               // R3 = SSE, unused on this row
   '', '', '',
   '', '', '']);

// Nothing the PSE owns may leak into either block.
const RETIRED_FIELDS = ['trips', 'stays', 'documents', 'clientEffort', 'subcontractorEffort'];
// The blocks land on rows that already exist, so a header row would push every
// task down one.
check('the task block has one row per task, no header',
  E.blockText(config.taskColumns, r.lines).split(String.fromCharCode(10)).length, r.lines.length);
check('the resource block has one row per task, no header',
  E.blockText(config.resourceColumns, r.lines).split(String.fromCharCode(10)).length, r.lines.length);
check('the first row is data, not column names',
  E.blockText(config.taskColumns, r.lines).split(String.fromCharCode(10))[0].startsWith('Phase'), false);

check('neither block writes a PSE-owned column',
  config.taskColumns.concat(config.resourceColumns)
    .filter(c => RETIRED_FIELDS.includes(c.from)), []);
// ── 5b. Reordering questions keeps dependencies in front of dependants ──
section('Question order');
const brokenSrc = (adminHtml.match(/function firstBrokenDependency\([\s\S]*?\n    \}/) || [''])[0];
check('admin can spot a broken dependency', brokenSrc.length > 0, true);
if (brokenSrc) {
  const broken = new Function(brokenSrc + '; return firstBrokenDependency;')();
  // The shipped config must already be in a valid order.
  config.flows.forEach(f => {
    check(f.id + ': questions are in a workable order', broken(f.inputs), null);
  });
  // And a deliberate swap that puts a gate after its dependant must be caught.
  const a = { id: 'scope', type: 'choice', label: 'Scope', options: [{ id: 'dfd', label: 'DFD' }] };
  const b = { id: 'domains', type: 'number', label: 'Domains', showWhen: { input: 'scope', is: 'dfd' } };
  check('a valid order passes', broken([a, b]), null);
  check('an invalid order is caught', (broken([b, a]) || {}).on, 'scope');
}


// ── 5c. Reading a block pasted out of a PSE ────────────────────────────
section('Import');
{
  const tab = (cells) => cells.join('\t');

  // Excel quotes a cell that contains a newline; splitting naively tears the
  // row in half.
  const quoted = E.parseGrid('Design\tCollaboration\tArchiTech Activity\t"One\nTwo"');
  check('a quoted newline keeps its row whole', quoted.length, 1);
  check('and the cell survives', quoted[0][3], 'One\nTwo');
  check('doubled quotes unescape', E.parseGrid('a\t"say ""hi"""')[0][1], 'say "hi"');
  check('blank rows are dropped', E.parseGrid('a\tb\n\t\nc\td').length, 2);

  // Column detection across the shapes a person actually pastes.
  check('four columns read positionally',
    E.detectColumns([['Design', 'Collaboration', 'ArchiTech Activity', 'A task']]).map,
    { phase: 0, skill: 1, taskType: 2, description: 3 });
  check('a header row is honoured, in any order',
    E.detectColumns([['Description', 'Phase', 'Task Type', 'Skill Required']]).map,
    { phase: 1, skill: 3, taskType: 2, description: 0 });
  check('one column is descriptions', E.detectColumns([['Just a task']]).map, { description: 0 });
  check('the full sheet width still reads the first four',
    E.detectColumns([new Array(24).fill('x')]).map,
    { phase: 0, skill: 1, taskType: 2, description: 3 });
  check('an unrecognisable width is refused rather than guessed',
    E.detectColumns([['a', 'b']]).ambiguous, true);

  // Flagging, rather than quietly coercing.
  const flagged = E.readPaste([
    tab(['Deployment', 'Collaboration', 'ArchiTech Activity', 'Unknown phase here']),
    tab(['Design', 'Collaboration', 'ArchiTech Activity', 'Kick Off Session with Stakeholders']),
    tab(['Design', 'Collaboration', 'ArchiTech Activity', 'Twice over']),
    tab(['Design', 'Collaboration', 'ArchiTech Activity', 'Twice over']),
    tab(['Design', 'Collaboration', 'ArchiTech Activity', '']),
  ].join('\n'), config, wxcc.tasks.map(t => t.description));

  check('a row with no description is left out', flagged.drafts.length, 4);
  check('an unknown phase is flagged, not accepted',
    flagged.drafts[0].issues.map(i => i.kind), ['unknown']);
  check('and falls back to a real phase', config.phases.includes(flagged.drafts[0].phase), true);
  check('a description already in the flow is flagged',
    flagged.drafts[1].issues.map(i => i.kind), ['duplicate']);
  check('a description repeated inside the paste is flagged',
    flagged.drafts[3].issues.map(i => i.kind), ['repeated']);
  check('a clean row is left alone', flagged.drafts[2].issues, []);

  // Descriptions-only paste: everything else has to be assumed, and says so.
  const bare = E.readPaste('Rack the firewall\nCable and label', config, []);
  check('descriptions alone still produce tasks', bare.drafts.length, 2);
  check('and each says what it had to assume',
    bare.drafts[0].issues.map(i => i.field).sort(), ['phase', 'skill', 'taskType']);

  // The strongest property: what the builder writes, the importer can read.
  const out = E.estimate(config, wxcc, 'migration', { scope: 'dfd' });
  const written = E.blockText(config.taskColumns, out.lines);
  const readBack = E.readPaste(written, config, []);
  check('every written row reads back', readBack.drafts.length, out.lines.length);
  check('descriptions survive the round trip',
    readBack.drafts.map(t => t.description).join('|'),
    out.lines.map(l => l.description).join('|'));
  check('phases survive the round trip',
    readBack.drafts.every((t, i) => t.phase === out.lines[i].phase), true);
  check('skills and task types survive the round trip',
    readBack.drafts.every((t, i) => t.skill === out.lines[i].skill && t.taskType === out.lines[i].taskType), true);
  check('and nothing is flagged, since it is our own output',
    readBack.drafts.filter(t => t.issues.length).length, 0);
}

// ── 5d. Committing an import puts real tasks in the flow ───────────────
section('Import commit');
{
  const grab = (re) => (adminHtml.match(re) || [null])[0];
  const src = [
    grab(/function slugify\([\s\S]*?\n    \}/),
    grab(/function uniqueId\([\s\S]*?\n    \}/),
    grab(/function commitImport\(\)[\s\S]*?\n    \}/),
  ];
  check('admin has the commit step', src.every(Boolean), true);
  if (src.every(Boolean)) {
    const flow = { id: 'imp', name: 'Imp', vertical: config.verticals[0].id,
      subflows: [{ id: 'one', name: 'One' }, { id: 'two', name: 'Two' }], inputs: [], tasks: [] };
    const IMPORT = {
      // R1 is mapped, R2 deliberately is not.
      slotRoles: { 1: 'SSE' },
      rows: [
        { include: true, description: 'Shared task', phase: 'Design', skill: 'Collaboration',
          taskType: 'ArchiTech Activity', subflows: 'all',
          effort: [{ slot: 1, location: 'Client Site', business: 10, after: 0 }] },
        { include: true, description: 'Only in two', phase: 'Staging', skill: 'Security',
          taskType: 'Client Dependency', subflows: 'two',
          effort: [{ slot: 1, location: 'Office', business: 2, after: 3 }] },
        { include: true, description: 'Hours on an unmapped column', phase: 'Design', skill: 'Collaboration',
          taskType: 'ArchiTech Activity', subflows: 'all',
          effort: [{ slot: 2, location: 'Office', business: 7, after: 0 }] },
        { include: false, description: 'Left behind', phase: 'Design', skill: 'Collaboration',
          taskType: 'ArchiTech Activity', subflows: 'all', effort: [] },
      ],
    };
    const fn = new Function('F', 'IMPORT', 'EXPANDED', 'renderAdmin', 'alert', 'PSEngine',
      src.join('\n') + '; return commitImport;')(
      () => flow, IMPORT, new Set(), () => {}, () => {}, E);
    fn();

    check('only the ticked rows were added', flow.tasks.map(t => t.description),
      ['Shared task', 'Only in two', 'Hours on an unmapped column']);
    check('an all-subflows row is marked all', flow.tasks[0].subflows, 'all');
    check('a mapped row goes to just that subflow', flow.tasks[1].subflows, ['two']);
    check('the fields come through', [flow.tasks[1].phase, flow.tasks[1].skill, flow.tasks[1].taskType],
      ['Staging', 'Security', 'Client Dependency']);
    check('ids are unique and derived from the text', flow.tasks.map(t => t.id),
      ['shared-task', 'only-in-two', 'hours-on-an-unmapped-column']);

    // The hours read out of the sheet must arrive against the role that was named.
    check('business hours arrive on the mapped role', flow.tasks[0].effort,
      [{ role: 'SSE', location: 'Client Site', business: { base: 10 } }]);
    check('after hours stay separate', flow.tasks[1].effort,
      [{ role: 'SSE', location: 'Office', business: { base: 2 }, after: { base: 3 } }]);
    // Better to bring nothing than to guess which role a column was.
    check('hours on an unmapped column are left behind', flow.tasks[2].effort, []);

    // And the imported effort has to price the same way authored effort does.
    const imported = { id: 'chk', name: 'Chk', vertical: config.verticals[0].id,
      subflows: [{ id: 'one', name: 'One' }], inputs: [], tasks: [flow.tasks[1]] };
    // The task was mapped to subflow "two", which this flow does not have.
    imported.tasks = [Object.assign({}, flow.tasks[1], { subflows: 'all' })];
    const out = E.estimate(config, imported, 'one', {});
    check('imported hours total correctly', out.hours, 5);
    check('and split business from after', [out.business, out.after], [2, 3]);
    check('and land in the resource block', E.blockText(config.resourceColumns, out.lines).split('\t').slice(0, 3),
      ['Office', '2', '3']);
  }
}

// ── 5e. Reading the resource columns out of a pasted block ─────────────
section('Import hours');
{
  // A row shaped like the real sheet: 24 columns, hours against R1.
  const wide = (desc, loc, bh, ah) => {
    const r = new Array(24).fill('');
    r[0] = 'Design'; r[1] = 'Collaboration'; r[2] = 'ArchiTech Activity'; r[3] = desc;
    r[9] = loc; r[10] = bh; r[11] = ah;
    return r.join('\t');
  };
  const res = E.readPaste([wide('With hours', 'Client Site', '10', ''),
    wide('With after hours', 'Office', '2', '3'),
    wide('No hours at all', 'Office', '0', '')].join('\n'), config, []);

  check('the resource groups are found', res.cols.resources.length, 5);
  check('R1 sits where the sheet puts it', res.cols.resources[0],
    { slot: 1, location: 9, business: 10, after: 11 });
  check('hours are read against the slot', res.drafts[0].effort,
    [{ slot: 1, location: 'Client Site', business: 10, after: 0 }]);
  check('after hours are kept apart', res.drafts[1].effort[0].after, 3);
  check('a row with no hours gets no effort', res.drafts[2].effort, []);

  // Spreadsheet cells are text, and empty comes in several disguises.
  check('a blank is no hours', E.toHours(''), 0);
  check('a dash is no hours', E.toHours('-'), 0);
  check('a negative is no hours', E.toHours('-3'), 0);
  check('a decimal survives', E.toHours('2.5'), 2.5);
  check('a stray currency symbol is ignored', E.toHours('$ 430.17'), 430.17);

  // Only the full width can be trusted to line the resource columns up.
  check('four columns claim no resource groups',
    E.detectColumns([['Design', 'Collaboration', 'ArchiTech Activity', 'A task']]).resources, []);
  check('a header row finds them by name',
    E.detectColumns([['Description', 'R1 Location', 'R1 Business Hours', 'R1 After Hours']]).resources,
    [{ slot: 1, location: 1, business: 2, after: 3 }]);

  check('an unmapped slot yields nothing', E.effortFromSlots(res.drafts[0].effort, {}), []);
  check('a mapped slot yields effort', E.effortFromSlots(res.drafts[0].effort, { 1: 'SA' }),
    [{ role: 'SA', location: 'Client Site', business: { base: 10 } }]);
}

// ── 5f. An open form follows its row, rather than its position ─────────
section('Editor stability');
{
  // The bug: EDITING held an index, reordering rewrote the array without
  // clearing it, and the form then saved over a different question.
  check('EDITING no longer stores a position', /EDITING\.idx/.test(adminHtml), false);
  check('an open input form resolves by id', adminHtml.includes('function editingInputIndex'), true);
  check('an open task form resolves by id', adminHtml.includes('function editingTaskIndex'), true);

  const resolver = (adminHtml.match(/function editingInputIndex\([\s\S]*?\n    \}/) || [''])[0];
  check('a deleted row closes the form instead of pointing elsewhere',
    /return at === -1 \? null : at/.test(resolver), true);

  // Run the resolver against a reordered list.
  const fn = new Function('F', 'EDITING', resolver + '; return editingInputIndex;');
  const inputs = ['scope', 'workshops', 'staging-channels'].map(id => ({ id }));
  const editing = { kind: 'input', id: 'staging-channels' };
  check('before a move it points at the right row',
    fn(() => ({ inputs }), editing)(), 2);
  // Drag the first question to the end.
  const moved = [inputs[1], inputs[2], inputs[0]];
  check('after a move it still points at the same row',
    fn(() => ({ inputs: moved }), editing)(), 1);
  check('and the row it names is the one it named before',
    moved[fn(() => ({ inputs: moved }), editing)()].id, 'staging-changes'.replace('changes', 'channels'));
  check('a deleted row yields null, not a wrong index',
    fn(() => ({ inputs: [inputs[0]] }), editing)(), null);
}

// ── 5g. The admin refuses to write a config it cannot use ──────────────
section('Save validation');
{
  check('the save path runs the shared rules', adminHtml.includes('PSEngine.validateConfig(CONFIG)'), true);
  // The guard has to come before the request, not merely exist.
  const doSaveAt = adminHtml.indexOf('async function doSave');
  const doSaveSrc = adminHtml.slice(doSaveAt, doSaveAt + 1200);
  check('the guard returns before any request is made',
    doSaveSrc.indexOf('return;') !== -1 && doSaveSrc.indexOf('return;') < doSaveSrc.indexOf('await fetch'), true);
  check('and says nothing was sent', adminHtml.includes('nothing was sent'), true);

  // The rules must reject exactly what the builder cannot render.
  const draft = JSON.parse(JSON.stringify(config));
  draft.flows[0].tasks[0].description = 'Deploy {mystery} units';
  check('a config with a dangling variable is rejected',
    E.validateConfig(draft).some(m => m.includes('unknown variable')), true);
}

// ── 5h. Pasted braces are flagged, not passed through ──────────────────
section('Import placeholders');
{
  const braced = E.readPaste('Design\tCollaboration\tArchiTech Activity\tDeploy {number of devices} units', config, []);
  check('a brace with nothing behind it is flagged',
    braced.drafts[0].issues.map(i => i.kind), ['placeholder']);
  check('and the message names the token',
    /number of devices/.test(braced.drafts[0].issues[0].note), true);

  const hashed = E.readPaste('Design\tCollaboration\tArchiTech Activity\tSite {#} of many', config, []);
  check('a stray {#} is flagged too', hashed.drafts[0].issues.map(i => i.kind), ['placeholder']);

  const clean = E.readPaste('Design\tCollaboration\tArchiTech Activity\tRack the firewall', config, []);
  check('ordinary text is not flagged', clean.drafts[0].issues, []);

  // A token that does exist somewhere is fair game, not a fault.
  const known = config.flows.flatMap(f => f.inputs).find(i => i.type === 'number');
  if (known) {
    const withKnown = E.readPaste('Design\tCollaboration\tArchiTech Activity\tRun {' + (known.token || known.id) + '} sessions', config, []);
    check('a token that exists is left alone', withKnown.drafts[0].issues, []);
  }
}

// ── 5i. An empty result explains itself ────────────────────────────────
section('Empty result');
{
  check('the builder distinguishes no tasks from no hours',
    indexHtml.includes('has no tasks for'), true);
  check('and points at where to fix it', indexHtml.includes('admin page'), true);
  check('and does not blame effort when there are no tasks',
    /!out\.lines\.length/.test(indexHtml), true);

  const bare = config.flows.find(f => !f.tasks.length);
  if (bare) {
    const out = E.estimate(config, bare, bare.subflows[0].id, {});
    check('an empty flow really does produce nothing', out.lines.length, 0);
  }
}

// ── 5j. Copy that has to stay honest ──────────────────────────────────
section('Interface copy');
{
  // A control has to say what it does, not what state you are in.
  check('the token control says it forgets', adminHtml.includes('>Forget token<'), true);
  check('and no longer reads as a status', adminHtml.includes('>Token saved<'), false);

  // A failure message is for the reader, not a dump of the API response.
  check('a save failure is explained, not pasted', adminHtml.includes('await res.text()'), false);
  check('each save failure has its own wording', adminHtml.includes('function explainSaveFailure'), true);

  // Every save button says what it saves.
  check('the question form says what it saves', adminHtml.includes('>Save question<'), true);
  check('no bare Save button is left', /> *Save *</.test(adminHtml), false);

  // Plurals go through the one helper rather than an (s) suffix.
  check('import notes pluralise through the shared helper',
    /count\(res\.rows/.test(adminHtml) && /count\(res\.skipped/.test(adminHtml), true);

  // Words the reader would not use about their own work.
  ['Config changed since you loaded it', 'its configuration'].forEach(phrase => {
    check('dropped: "' + phrase + '"', (adminHtml + indexHtml).includes(phrase), false);
  });

  // Every alert should point at the next move.
  const alerts = [...adminHtml.matchAll(/alert(.(.{6,90}?).);/g)].map(m => m[1]);
  const vague = alerts.filter(a => /^(Error|Invalid|Failed|Nothing is|Required)/i.test(a));
  check('no alert is a bare verdict', vague, []);
}

// ── 6. Admin shows every task exactly once ──────────────────────────────
section('Admin grouping');
const adminSrc = scripts(adminHtml).find(s => s.includes('function sectionsForFlow'));
if (!adminSrc) {
  failures++;
  console.log('FAIL  admin exposes its task grouping');
} else {
  const A = new Function('CONFIG', 'PSEngine', `${adminSrc}
    return { use: (id) => { activeFlowId = id; }, sectionsForFlow, tasksIn, orphanTasks };
  `)(config, E);

  config.flows.forEach(f => {
    A.use(f.id);
    const sections = A.sectionsForFlow(f);
    const subIds = f.subflows.map(s => s.id);
    // A task listing several subflows is meant to show under each of them, so
    // the invariant is that it appears exactly as many times as it claims.
    const expected = f.tasks.map(t =>
      (t.subflows === undefined || t.subflows === 'all') ? 1 : t.subflows.filter(id => subIds.includes(id)).length);
    const claims = f.tasks.map(() => 0);
    sections.forEach(s => A.tasksIn(s).forEach(({ idx }) => claims[idx]++));

    check(f.id + ': every task appears exactly as often as it claims', claims, expected);
    check(f.id + ': no task is invisible', claims.filter((n, i) => n === 0 && expected[i] > 0).length, 0);
    check(f.id + ': nothing is orphaned', A.orphanTasks().length, 0);
  });
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures ? 1 : 0);
