// Self-check for the PS Builder. Run from the repo root:  node psbuilder/check.js
//
// Loads the real code out of index.html and admin.html rather than a copy, so
// this fails if either page drifts from config.json.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname);
const config = JSON.parse(fs.readFileSync(path.join(DIR, 'config.json'), 'utf8'));
const indexHtml = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(DIR, 'admin.html'), 'utf8');

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

// ── 1b. The admin version is present, shown, and really interpolated ───
section('Admin version');
const versionMatch = adminHtml.match(/const ADMIN_VERSION = '([^']+)'/);
check('admin declares a version', !!versionMatch, true);
if (versionMatch) {
  const parts = versionMatch[1].split('.');
  check('version looks like semver', parts.length === 3 && parts.every(n => /^[0-9]+$/.test(n)), true);

  // The commit message must interpolate the constant, not carry it literally.
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

// ── 2. config.json is internally consistent ─────────────────────────────
section('Config integrity');
const COND_KEYS = ['input', 'is', 'anySelected', 'isOn', 'moreThanZero'];
const COLUMN_FIELDS = ['phase', 'description', 'location', 'trips', 'hours'];
const INPUT_TYPES = ['number', 'yesno', 'checklist', 'choice'];
const problems = [];

const verticalIds = config.verticals.map(v => v.id);
config.verticals.forEach(v => {
  if (!v.id || !v.name) problems.push(`vertical ${JSON.stringify(v)} needs an id and a name`);
});
check('vertical ids are unique', verticalIds.length, new Set(verticalIds).size);

config.flows.forEach(f => {
  const at = (what) => `flow ${f.id}: ${what}`;
  ['id', 'name', 'vertical', 'phases', 'locations', 'columns', 'subflows', 'inputs', 'tasks'].forEach(k => {
    if (f[k] === undefined) problems.push(at(`missing "${k}"`));
  });
  if (!verticalIds.includes(f.vertical)) problems.push(at(`sits in unknown vertical "${f.vertical}"`));
  if (!(f.subflows || []).length) problems.push(at('has no subflows'));
  if (!(f.columns || []).length) problems.push(at('has no output columns'));

  (f.columns || []).forEach(c => {
    if (c.from === undefined && c.constant === undefined) problems.push(at(`column "${c.header}" has neither from nor constant`));
    if (c.from && !COLUMN_FIELDS.includes(c.from)) problems.push(at(`column "${c.header}" reads unknown field "${c.from}"`));
  });

  const subIds = (f.subflows || []).map(s => s.id);
  if (subIds.length !== new Set(subIds).size) problems.push(at('has duplicate subflow ids'));
  (f.subflows || []).forEach(s => { if (!s.name) problems.push(at(`subflow "${s.id}" has no name`)); });

  const inputIdx = new Map((f.inputs || []).map((i, n) => [i.id, n]));
  const numberInputs = new Set((f.inputs || []).filter(i => i.type === 'number').map(i => i.id));

  function checkSubflows(member, label) {
    if (member === undefined || member === 'all') return;
    if (!Array.isArray(member)) { problems.push(at(`${label} has a subflows value that is neither "all" nor a list`)); return; }
    if (!member.length) problems.push(at(`${label} is in no subflow at all`));
    member.forEach(id => { if (!subIds.includes(id)) problems.push(at(`${label} names unknown subflow "${id}"`)); });
  }

  // `maxIndex` enforces that inputs only depend on earlier inputs, because
  // index.html resolves answers in a single forward pass.
  function checkCond(cond, label, maxIndex) {
    if (!cond) return;
    Object.keys(cond).forEach(k => {
      if (!COND_KEYS.includes(k)) problems.push(at(`${label} uses unknown condition key "${k}"`));
    });
    if (!cond.input) { problems.push(at(`${label} has a condition with no input`)); return; }
    if (!inputIdx.has(cond.input)) { problems.push(at(`${label} points at missing input "${cond.input}"`)); return; }
    const target = f.inputs[inputIdx.get(cond.input)];
    if (maxIndex !== undefined && inputIdx.get(cond.input) >= maxIndex) {
      problems.push(at(`${label} depends on "${cond.input}", which is not asked earlier`));
    }
    if (cond.is !== undefined && !(target.options || []).some(o => o.id === cond.is)) {
      problems.push(at(`${label} points at missing option "${cond.is}" on "${cond.input}"`));
    }
    if (cond.is === undefined && !cond.anySelected && !cond.isOn && !cond.moreThanZero) {
      problems.push(at(`${label} names an input but no test`));
    }
    if ((cond.is !== undefined || cond.anySelected) && !['choice', 'checklist'].includes(target.type)) {
      problems.push(at(`${label} tests options against a ${target.type}`));
    }
    if (cond.isOn && target.type !== 'yesno') problems.push(at(`${label} tests on/off against a ${target.type}`));
    if (cond.moreThanZero && target.type !== 'number') problems.push(at(`${label} tests a count against a ${target.type}`));
  }

  // Tokens are what {braces} in a description resolve against.
  const tokens = new Map();
  (f.inputs || []).forEach(i => {
    const t = i.token || i.id;
    if (tokens.has(t)) problems.push(at(`token "${t}" is claimed by both "${tokens.get(t)}" and "${i.id}"`));
    tokens.set(t, i.id);
  });

  const seenI = new Set();
  (f.inputs || []).forEach((i, n) => {
    if (seenI.has(i.id)) problems.push(at(`duplicate input id "${i.id}"`));
    seenI.add(i.id);
    if (!INPUT_TYPES.includes(i.type)) problems.push(at(`input "${i.id}" has unknown type "${i.type}"`));
    if (!i.label) problems.push(at(`input "${i.id}" has no label`));
    checkCond(i.showWhen, `input "${i.id}"`, n);
    checkSubflows(i.subflows, `input "${i.id}"`);
    if (['choice', 'checklist'].includes(i.type)) {
      if (!(i.options || []).length) problems.push(at(`input "${i.id}" is a ${i.type} with no options`));
      const seenO = new Set();
      (i.options || []).forEach(o => {
        if (seenO.has(o.id)) problems.push(at(`input "${i.id}" has duplicate option id "${o.id}"`));
        seenO.add(o.id);
        if (!o.label) problems.push(at(`input "${i.id}" has an option with no label`));
        checkCond(o.showWhen, `option "${o.id}" on "${i.id}"`, n);
      });
    }
    if (i.type === 'number' && i.min != null && i.max != null && i.min > i.max) {
      problems.push(at(`input "${i.id}" has min above max`));
    }
  });

  const seenT = new Set();
  (f.tasks || []).forEach(t => {
    if (seenT.has(t.id)) problems.push(at(`duplicate task id "${t.id}"`));
    seenT.add(t.id);
    if (!t.description) problems.push(at(`task "${t.id}" has no description`));
    if (!f.phases.includes(t.phase)) problems.push(at(`task "${t.id}" uses phase "${t.phase}", which this flow does not define`));
    if (t.location && !f.locations.includes(t.location)) {
      problems.push(at(`task "${t.id}" uses location "${t.location}", which this flow does not define`));
    }
    checkSubflows(t.subflows, `task "${t.id}"`);
    checkCond(t.showWhen, `task "${t.id}"`);

    if (t.repeatPer && !numberInputs.has(t.repeatPer)) {
      problems.push(at(`task "${t.id}" repeats per "${t.repeatPer}", which is not a number input`));
    }

    // Every {brace} must resolve, and {#} only means something when repeating.
    [...String(t.description).matchAll(/\{([^{}]+)\}/g)].forEach(m => {
      const key = m[1].trim();
      if (key === '#') {
        if (!t.repeatPer) problems.push(at(`task "${t.id}" uses {#} but does not repeat`));
        return;
      }
      if (!tokens.has(key)) problems.push(at(`task "${t.id}" references unknown variable "{${key}}"`));
    });

    const h = t.hours;
    if (h) {
      if (h.base !== undefined && typeof h.base !== 'number') problems.push(at(`task "${t.id}" has a non-numeric base`));
      (h.per || []).forEach(p => {
        if (!numberInputs.has(p.input)) problems.push(at(`task "${t.id}" bills per "${p.input}", which is not a number input`));
        if (typeof p.hours !== 'number') problems.push(at(`task "${t.id}" has a non-numeric rate for "${p.input}"`));
        // A repeating task already emits one line per unit; billing per that
        // same unit on every line would multiply the effort twice over.
        if (t.repeatPer && p.input === t.repeatPer) {
          problems.push(at(`task "${t.id}" repeats per "${p.input}" and also bills per it, double counting`));
        }
      });
    }
  });
});
check('no config problems', problems, []);

// ── 3. The builder engine, run out of index.html ────────────────────────
section('Builder engine');
const engineSrc = scripts(indexHtml).find(s => s.includes('function condMet'))
  .replace('loadConfig().then(renderFlows);', '');
const E = new Function(`return (function(){
  ${engineSrc}
  return {
    set: (f, s, a) => { flow = f; subflow = s; answers = a; },
    resolveInputs, buildTasks, inputsToShow, allRequiredAnswered, hoursFor, fillText,
  };
})()`)();

function run(f, sub, ans) {
  E.set(f, sub, ans || {});
  const resolved = E.resolveInputs();
  const tasks = E.buildTasks(resolved);
  return {
    tasks,
    count: tasks.length,
    hours: Math.round(tasks.reduce((n, t) => n + Number(t.hours || 0), 0) * 100) / 100,
    trips: tasks.reduce((n, t) => n + Number(t.trips || 0), 0),
    shown: E.inputsToShow(resolved).map(i => i.id),
    ready: E.allRequiredAnswered(resolved),
  };
}

const wxcc = config.flows.find(f => f.id === 'wxcc');
check('wxcc kept both engagement types as subflows', wxcc.subflows.map(s => s.id), ['new', 'migration']);

let r = run(wxcc, 'migration', {});
check('scope unanswered: nothing else is asked yet', r.shown, ['scope']);
check('scope unanswered: cannot generate', r.ready, false);

// These two numbers come from the original WxCC build, before any of this.
r = run(wxcc, 'migration', { scope: 'dfd' });
check('migration + DFD on defaults: 56 tasks', r.count, 56);
check('migration + DFD on defaults: 2 onsite trips', r.trips, 2);
check('migration + DFD: every input visible', r.shown.length, wxcc.inputs.length);
check('a repeating task numbers its lines', r.tasks.filter(t => /^Workshop \d/.test(t.description)).map(t => t.description), [
  'Workshop 1 — discovery session', 'Workshop 2 — discovery session',
  'Workshop 3 — discovery session', 'Workshop 4 — discovery session',
]);
check('a variable substitutes its total', r.tasks.filter(t => t.description.includes('Agent training')).map(t => t.description),
  ['Agent training (desktop, call/chat handling, wrap-up codes) — 2 sessions']);
check('no unresolved braces', r.tasks.some(t => /\{[^}]+\}/.test(t.description)), false);
check('wxcc has no authored hours yet', r.hours, 0);

r = run(wxcc, 'new', { scope: 'standard' });
check('standard scope hides the DFD inputs', r.shown,
  ['scope', 'workshops', 'staging-channels', 'reporting', 'agent-training', 'supervisor-training']);
check('new + standard on defaults: 32 tasks', r.count, 32);
check('the new subflow drops the legacy tasks', r.tasks.filter(t => t.description.startsWith('Legacy platform')).length, 0);
check('the migration subflow keeps them', run(wxcc, 'migration', { scope: 'standard' })
  .tasks.filter(t => t.description.startsWith('Legacy platform')).length, 3);

check('a hidden input cannot leak into the output',
  run(wxcc, 'new', { scope: 'standard', 'agent-domains': 4, 'ai-assistant': true }).count, 32);
check('a hidden option cannot count as ticked',
  run(wxcc, 'new', { scope: 'standard', 'staging-channels': ['sms', 'crm'] })
    .tasks.filter(t => t.description === 'CRM environment access confirmed').length, 0);
check('the same option counts once visible',
  run(wxcc, 'new', { scope: 'dfd', 'staging-channels': ['sms', 'crm'] })
    .tasks.filter(t => t.description === 'CRM environment access confirmed').length, 1);
check('zeroing a variable drops what it gated',
  run(wxcc, 'new', { scope: 'dfd', 'agent-domains': 0 })
    .tasks.filter(t => /Knowledge|Intent-based|AI Agent/.test(t.description)).length, 0);
check('emptying a checklist drops its any-ticked tasks',
  run(wxcc, 'new', { scope: 'dfd', 'omni-channels': [] })
    .tasks.filter(t => /Omnichannel Scope|OmniChannel/.test(t.description)).length, 0);
check('one tick restores them',
  run(wxcc, 'new', { scope: 'dfd', 'omni-channels': ['qb-api'] })
    .tasks.filter(t => /Omnichannel Scope|OmniChannel/.test(t.description)).length, 2);

// ── 4. Variables and hours, on a flow built for the purpose ─────────────
section('Variables and hours');
// Mirrors the worked example: a handset rollout billed per device.
const demo = {
  id: 'demo', name: 'Spectralink Handsets', vertical: 'collaboration',
  phases: ['Design', 'Implementation'], locations: ['Office', 'Client Site'],
  columns: [
    { header: 'Phase', from: 'phase' },
    { header: 'Description', from: 'description' },
    { header: 'Hours', from: 'hours' },
  ],
  subflows: [{ id: 'new-install', name: 'New Install' }, { id: 'add', name: 'Add Handsets' }],
  inputs: [
    { id: 'devices', type: 'number', token: 'number of devices', label: 'How many handsets?', default: 50, min: 1, max: 5000 },
    { id: 'sites', type: 'number', token: 'sites', label: 'How many sites?', default: 1, min: 1, max: 50 },
  ],
  tasks: [
    { id: 'enroll', phase: 'Implementation', location: 'Office', subflows: 'all',
      description: 'Enroll {number of devices} Spectralink Handsets to MDM',
      hours: { base: 1, per: [{ input: 'devices', hours: 0.25 }] } },
    { id: 'survey', phase: 'Design', location: 'Client Site', subflows: ['new-install'], trips: 1,
      description: 'Site survey across {sites} sites',
      hours: { base: 4, per: [{ input: 'sites', hours: 2 }] } },
    { id: 'per-site', phase: 'Implementation', location: 'Office', subflows: 'all', repeatPer: 'sites',
      description: 'Site {#} of {sites} — controller configuration',
      hours: { base: 3 } },
  ],
};

r = run(demo, 'add', { devices: 200, sites: 1 });
check('per-unit hours: 1 + 200 x 0.25', r.tasks.find(t => t.id === 'enroll').hours, 51);
check('the variable reads back into the text', r.tasks.find(t => t.id === 'enroll').description,
  'Enroll 200 Spectralink Handsets to MDM');
check('a task outside this subflow is skipped', r.tasks.some(t => t.id === 'survey'), false);
check('add subflow: 2 tasks (enroll + 1 site)', r.count, 2);
check('add subflow total hours: 51 + 3', r.hours, 54);

r = run(demo, 'new-install', { devices: 200, sites: 3 });
check('new-install picks up its own task', r.tasks.some(t => t.id === 'survey'), true);
check('repeating per variable emits one line each',
  r.tasks.filter(t => t.id === 'per-site').map(t => t.description),
  ['Site 1 of 3 — controller configuration', 'Site 2 of 3 — controller configuration', 'Site 3 of 3 — controller configuration']);
check('a repeated line is billed once each', r.tasks.filter(t => t.id === 'per-site').map(t => t.hours), [3, 3, 3]);
check('two variables add up: 4 + 3 x 2', r.tasks.find(t => t.id === 'survey').hours, 10);
check('new-install total: 51 + 10 + 9', r.hours, 70);
check('trips still counted', r.trips, 1);
check('changing a variable changes the hours',
  run(demo, 'add', { devices: 8, sites: 1 }).tasks.find(t => t.id === 'enroll').hours, 3);
check('hours land in the output column',
  demo.columns.map(c => c.constant !== undefined ? c.constant : r.tasks[0][c.from]).join('|'),
  'Implementation|Enroll 200 Spectralink Handsets to MDM|51');

// ── 5. Admin shows every task exactly once ──────────────────────────────
section('Admin grouping');
const adminSrc = scripts(adminHtml).find(s => s.includes('function sectionsForFlow'));
if (!adminSrc) {
  failures++;
  console.log('FAIL  admin exposes its task grouping');
} else {
  const A = new Function('CONFIG', `${adminSrc}
    return { use: (id) => { activeFlowId = id; }, sectionsForFlow, tasksIn, orphanTasks };
  `)(config);

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
