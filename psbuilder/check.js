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
const COND_KEYS = ['input', 'is', 'anySelected', 'isOn', 'moreThanZero'];
const INPUT_TYPES = ['number', 'yesno', 'checklist', 'choice'];
// The PSE derives trips, stays and documents, and client or subcontractor
// effort is typed into the sheet, so a task must not carry any of them.
const RETIRED_FIELDS = ['trips', 'stays', 'documents', 'clientEffort', 'subcontractorEffort'];
const COLUMN_FIELDS = ['phase', 'skill', 'taskType', 'description'];
for (let n = 1; n <= 5; n++) COLUMN_FIELDS.push(`r${n}Location`, `r${n}Business`, `r${n}After`);
const roleIds = (config.roles || []).map(r => r.id);
const problems = [];
const verticalIds = config.verticals.map(v => v.id);
check('vertical ids are unique', verticalIds.length, new Set(verticalIds).size);

config.flows.forEach(f => {
  const at = (what) => `flow ${f.id}: ${what}`;
  ['id', 'name', 'vertical', 'subflows', 'inputs', 'tasks'].forEach(k => {
    if (f[k] === undefined) problems.push(at(`missing "${k}"`));
  });
  if (!verticalIds.includes(f.vertical)) problems.push(at(`sits in unknown vertical "${f.vertical}"`));
  if (!(f.subflows || []).length) problems.push(at('has no subflows'));

  const subIds = (f.subflows || []).map(s => s.id);
  if (subIds.length !== new Set(subIds).size) problems.push(at('has duplicate subflow ids'));

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

  // An amount is a plain number, or a base plus a per-variable rate.
  function checkAmount(a, label, repeatPer) {
    if (a == null) return;
    if (typeof a === 'number') return;
    if (typeof a !== 'object') { problems.push(at(`${label} is neither a number nor a base/rate pair`)); return; }
    if (a.base !== undefined && typeof a.base !== 'number') problems.push(at(`${label} has a non-numeric base`));
    (a.per || []).forEach(p => {
      if (!numberInputs.has(p.input)) problems.push(at(`${label} scales with "${p.input}", which is not a variable`));
      if (typeof p.each !== 'number') problems.push(at(`${label} has a non-numeric rate for "${p.input}"`));
      // A repeating task already emits one line per unit; scaling each line by
      // that same unit would count it twice over.
      if (repeatPer && p.input === repeatPer) {
        problems.push(at(`${label} repeats per "${p.input}" and also scales with it, double counting`));
      }
    });
  }

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
    if (!config.phases.includes(t.phase)) problems.push(at(`task "${t.id}" uses phase "${t.phase}", which the PSE does not offer`));

    // The three PSE dropdowns.
    if (!t.skill) problems.push(at(`task "${t.id}" has no skill`));
    else if (!config.skills.includes(t.skill)) problems.push(at(`task "${t.id}" uses skill "${t.skill}", which the PSE does not offer`));
    if (!t.taskType) problems.push(at(`task "${t.id}" has no task type`));
    else if (!config.taskTypes.includes(t.taskType)) problems.push(at(`task "${t.id}" uses task type "${t.taskType}", which the PSE does not offer`));

    checkSubflows(t.subflows, `task "${t.id}"`);
    checkCond(t.showWhen, `task "${t.id}"`);
    if (t.repeatPer && !numberInputs.has(t.repeatPer)) {
      problems.push(at(`task "${t.id}" repeats per "${t.repeatPer}", which is not a variable`));
    }

    RETIRED_FIELDS.forEach(k => {
      if (t[k] !== undefined) problems.push(at(`task "${t.id}" still carries "${k}", which the PSE works out itself`));
    });
    (t.effort || []).forEach((e, n) => {
      const label = `task "${t.id}" effort ${n + 1}`;
      if (!roleIds.includes(e.role)) problems.push(at(`${label} names unknown role "${e.role}"`));
      if (e.location && !config.locations.includes(e.location)) {
        problems.push(at(`${label} uses location "${e.location}", which the PSE does not offer`));
      }
      if (!e.business && !e.after) problems.push(at(`${label} has no hours against it`));
      checkAmount(e.business, `${label} business hours`, t.repeatPer);
      checkAmount(e.after, `${label} after hours`, t.repeatPer);
    });
    const usedRoles = (t.effort || []).map(e => e.role);
    if (usedRoles.length !== new Set(usedRoles).size) {
      problems.push(at(`task "${t.id}" has two effort lines for the same role`));
    }
    if (t.defaultLocation && !config.locations.includes(t.defaultLocation)) {
      problems.push(at(`task "${t.id}" defaults to location "${t.defaultLocation}", which the PSE does not offer`));
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
  });

  // The sheet only has five resource columns.
  const rolesUsed = new Set();
  (f.tasks || []).forEach(t => (t.effort || []).forEach(e => rolesUsed.add(e.role)));
  if (rolesUsed.size > 5) {
    problems.push(at(`uses ${rolesUsed.size} roles, but the PSE only has five resource columns`));
  }
});
check('no config problems', problems, []);

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
