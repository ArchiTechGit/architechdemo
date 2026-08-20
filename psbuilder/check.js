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

function scripts(html) {
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
}

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
  const missing = [...new Set(called)].filter(c => !defined.has(c));
  check(`${name} inline handlers all defined`, missing, []);
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
    adminHtml.indexOf("document.title = 'PS Builder \u2014 Admin v' + ADMIN_VERSION") !== -1, true);
  check('header badge carries the version',
    adminHtml.indexOf("textContent = 'v' + ADMIN_VERSION") !== -1, true);
}

// ── 2. config.json is internally consistent ─────────────────────────────
section('Config integrity');
const CONDITION_KEYS = ['question', 'is', 'anySelected', 'isOn', 'moreThanZero', 'repeatPerUnit'];
const problems = [];

config.verticals.forEach(v => {
  const where = (what) => `${v.id}: ${what}`;
  ['id', 'name', 'phases', 'locations', 'columns', 'questions', 'activities'].forEach(k => {
    if (v[k] === undefined) problems.push(where(`missing "${k}"`));
  });
  if (!v.columns || !v.columns.length) problems.push(where('has no output columns'));
  (v.columns || []).forEach(c => {
    if (c.from === undefined && c.constant === undefined) problems.push(where(`column "${c.header}" has neither from nor constant`));
    if (c.from && !['phase', 'description', 'location', 'trips'].includes(c.from)) {
      problems.push(where(`column "${c.header}" reads unknown field "${c.from}"`));
    }
  });

  const qIndex = new Map(v.questions.map((q, i) => [q.id, i]));

  // A condition must name a question that exists, and an option that exists on it.
  // `maxIndex` enforces that questions and options only depend on earlier answers,
  // because index.html resolves answers in a single forward pass.
  function validateCond(cond, label, maxIndex) {
    if (!cond) return;
    Object.keys(cond).forEach(k => {
      if (!CONDITION_KEYS.includes(k)) problems.push(where(`${label} uses unknown condition key "${k}"`));
    });
    if (!cond.question) { problems.push(where(`${label} has a condition with no question`)); return; }
    if (!qIndex.has(cond.question)) { problems.push(where(`${label} points at missing question "${cond.question}"`)); return; }
    const target = v.questions[qIndex.get(cond.question)];
    if (maxIndex !== undefined && qIndex.get(cond.question) >= maxIndex) {
      problems.push(where(`${label} depends on "${cond.question}", which is not asked earlier`));
    }
    if (cond.is !== undefined && !(target.options || []).some(o => o.id === cond.is)) {
      problems.push(where(`${label} points at missing option "${cond.is}" on "${cond.question}"`));
    }
    if (cond.is === undefined && !cond.anySelected && !cond.isOn && !cond.moreThanZero && !cond.repeatPerUnit) {
      problems.push(where(`${label} names a question but no test`));
    }
    const expectsList = cond.is !== undefined || cond.anySelected;
    if (expectsList && !['choice', 'checklist'].includes(target.type)) {
      problems.push(where(`${label} tests options on "${cond.question}", which is a ${target.type}`));
    }
    if (cond.isOn && target.type !== 'yesno') problems.push(where(`${label} tests on/off against a ${target.type}`));
    if ((cond.moreThanZero || cond.repeatPerUnit) && target.type !== 'number') {
      problems.push(where(`${label} tests a count against a ${target.type}`));
    }
  }

  const seenQ = new Set();
  v.questions.forEach((q, i) => {
    if (seenQ.has(q.id)) problems.push(where(`duplicate question id "${q.id}"`));
    seenQ.add(q.id);
    if (!['choice', 'checklist', 'number', 'yesno'].includes(q.type)) problems.push(where(`question "${q.id}" has unknown type "${q.type}"`));
    if (!q.label) problems.push(where(`question "${q.id}" has no label`));
    validateCond(q.showWhen, `question "${q.id}"`, i);

    if (['choice', 'checklist'].includes(q.type)) {
      if (!(q.options || []).length) problems.push(where(`question "${q.id}" is a ${q.type} with no options`));
      const seenO = new Set();
      (q.options || []).forEach(o => {
        if (seenO.has(o.id)) problems.push(where(`question "${q.id}" has duplicate option id "${o.id}"`));
        seenO.add(o.id);
        if (!o.label) problems.push(where(`question "${q.id}" has an option with no label`));
        validateCond(o.showWhen, `option "${o.id}" on "${q.id}"`, i);
      });
    }
    if (q.type === 'number' && q.min != null && q.max != null && q.min > q.max) {
      problems.push(where(`question "${q.id}" has min above max`));
    }
  });

  const seenA = new Set();
  v.activities.forEach(a => {
    if (seenA.has(a.id)) problems.push(where(`duplicate activity id "${a.id}"`));
    seenA.add(a.id);
    if (!a.description) problems.push(where(`activity "${a.id}" has no description`));
    if (!v.phases.includes(a.phase)) problems.push(where(`activity "${a.id}" uses phase "${a.phase}", which this solution does not define`));
    if (a.location && !v.locations.includes(a.location)) {
      problems.push(where(`activity "${a.id}" uses location "${a.location}", which this solution does not define`));
    }
    validateCond(a.showWhen, `activity "${a.id}"`);
    // {{n}} only has a value when the count comes from a number question.
    const usesN = String(a.description).includes('{{n}}');
    const suppliesN = a.showWhen && (a.showWhen.repeatPerUnit || a.showWhen.moreThanZero);
    if (usesN && !suppliesN) problems.push(where(`activity "${a.id}" uses {{n}} but its condition supplies no count`));
  });
});

check('no config problems', problems, []);

// ── 3. The builder engine, run out of index.html ────────────────────────
section('Builder engine');
const engineSrc = scripts(indexHtml).find(s => s.includes('function condMet'))
  .replace('loadConfig().then(renderVerticals);', '');
const E = new Function(`return (function(){
  ${engineSrc}
  return { set: (v, a) => { vertical = v; answers = a; }, resolveAnswers, buildTasks, questionsToShow, allRequiredAnswered };
})()`)();

const wxcc = config.verticals.find(v => v.id === 'wxcc');
function run(v, ans) {
  E.set(v, ans);
  const resolved = E.resolveAnswers();
  const tasks = E.buildTasks(resolved);
  return {
    tasks,
    count: tasks.length,
    trips: tasks.reduce((n, t) => n + Number(t.trips || 0), 0),
    shown: E.questionsToShow(resolved).map(q => q.id),
    ready: E.allRequiredAnswered(resolved),
  };
}

let r = run(wxcc, {});
check('nothing answered: only the first step shows', r.shown, ['engagement-type']);
check('nothing answered: cannot generate yet', r.ready, false);

r = run(wxcc, { 'engagement-type': 'migration' });
check('one step answered: stops at the next required step', r.shown, ['engagement-type', 'scope']);

// These two numbers come from the original WxCC-specific build.
r = run(wxcc, { 'engagement-type': 'migration', scope: 'dfd' });
check('migration + DFD on defaults: 56 tasks', r.count, 56);
check('migration + DFD on defaults: 2 onsite trips', r.trips, 2);
check('migration + DFD: every question visible', r.shown.length, wxcc.questions.length);
check('repeat-per-unit numbers each line', r.tasks.filter(t => /^Workshop \d/.test(t.description)).map(t => t.description), [
  'Workshop 1 — discovery session', 'Workshop 2 — discovery session',
  'Workshop 3 — discovery session', 'Workshop 4 — discovery session',
]);
check('more-than-zero substitutes the total', r.tasks.filter(t => t.description.includes('Agent training')).map(t => t.description),
  ['Agent training (desktop, call/chat handling, wrap-up codes) — 2 sessions']);

r = run(wxcc, { 'engagement-type': 'new', scope: 'standard' });
check('standard scope hides the DFD questions', r.shown,
  ['engagement-type', 'scope', 'workshops', 'staging-channels', 'reporting', 'agent-training', 'supervisor-training']);
check('new + standard on defaults: 32 tasks', r.count, 32);
check('new engagement drops the legacy tasks', r.tasks.filter(t => t.description.startsWith('Legacy platform')).length, 0);

check('a hidden question cannot leak into the output',
  run(wxcc, { 'engagement-type': 'new', scope: 'standard', 'agent-domains': 4, 'ai-assistant': true }).count, 32);
check('a hidden option cannot count as ticked',
  run(wxcc, { 'engagement-type': 'new', scope: 'standard', 'staging-channels': ['sms', 'crm'] })
    .tasks.filter(t => t.description === 'CRM environment access confirmed').length, 0);
check('the same option counts once visible',
  run(wxcc, { 'engagement-type': 'new', scope: 'dfd', 'staging-channels': ['sms', 'crm'] })
    .tasks.filter(t => t.description === 'CRM environment access confirmed').length, 1);
check('zeroing a number drops what it gated',
  run(wxcc, { 'engagement-type': 'new', scope: 'dfd', 'agent-domains': 0 })
    .tasks.filter(t => /Knowledge|Intent-based|AI Agent/.test(t.description)).length, 0);
check('emptying a checklist drops its any-ticked activities',
  run(wxcc, { 'engagement-type': 'new', scope: 'dfd', 'omni-channels': [] })
    .tasks.filter(t => /Omnichannel Scope|OmniChannel/.test(t.description)).length, 0);
check('one tick restores them',
  run(wxcc, { 'engagement-type': 'new', scope: 'dfd', 'omni-channels': ['qb-api'] })
    .tasks.filter(t => /Omnichannel Scope|OmniChannel/.test(t.description)).length, 2);

const empty = config.verticals.find(v => !v.questions.length);
if (empty) check('a solution with no questions still builds', run(empty, {}).count, 0);

// ── 4. Admin shows every activity exactly once ──────────────────────────
section('Admin grouping');
const adminSrc = scripts(adminHtml).find(s => s.includes('function condsForQuestion'));
const A = new Function('CONFIG', `${adminSrc}
  return { use: (id) => { activeVerticalId = id; }, condsForQuestion, activitiesFor, orphanActivities, condKey };
`)(config);

config.verticals.forEach(v => {
  A.use(v.id);
  const slots = [{ label: 'always', cond: null }];
  v.questions.forEach(q => A.condsForQuestion(q).forEach(c => slots.push({ label: `${q.id} / ${c.label}`, cond: c.cond })));

  const claims = v.activities.map(() => 0);
  slots.forEach(s => A.activitiesFor(s.cond).forEach(({ idx }) => claims[idx]++));
  const orphans = A.orphanActivities().length;

  check(`${v.id}: every activity is in exactly one group`,
    claims.filter((n, i) => n !== 1).length, orphans);
  check(`${v.id}: group totals add up`,
    slots.reduce((n, s) => n + A.activitiesFor(s.cond).length, 0) + orphans, v.activities.length);
  check(`${v.id}: nothing is orphaned`, orphans, 0);
});

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures ? 1 : 0);
