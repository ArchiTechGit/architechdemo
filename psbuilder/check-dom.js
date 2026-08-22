// Interaction check for the PS Builder, run against a real DOM.
//
//   npm i jsdom && node psbuilder/check-dom.js
//
// check.js reads the source and never builds a page, which is why it passed
// while editing a task was completely broken: renderTaskForm drew a form into a
// container that was not in the document yet, so the form's own
// getElementById returned null and the render died part-way. Nothing about that
// is visible in the text of the code -- it only shows up when something clicks
// a button on a page that exists.
//
// jsdom is deliberately not a dependency of the site: this is a static page with
// no build step and nothing to install in order to deploy it. If jsdom is
// missing, this file says so and exits 0 rather than failing a build.
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8');

let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (e) {
  console.log('jsdom is not installed, so the interaction checks were skipped.');
  console.log('Run  npm i jsdom  and try again. Nothing else in the build needs it.');
  process.exit(0);
}

const CONFIG = JSON.parse(read('config.json'));
// The harness sometimes needs the engine itself, not a page's copy of it.
const PSEngine = require(path.join(DIR, 'engine.js'));
const ADMIN_SCRIPTS = ['engine.js', 'admin-github.js', 'admin-render.js',
  'admin-forms.js', 'admin-import.js', 'admin-preview.js', 'admin-transfer.js'];

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
function section(t) { console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`); }

// Build a page with its scripts running, and collect anything that escapes.
function boot(page, scripts) {
  const dom = new JSDOM(read(page), { runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://architechdemo.com/psbuilder/' + page,
    // The builder keeps an inline script that reads PSEngine as it parses, and
    // jsdom does not fetch the <script src> that would have defined it. The
    // engine loads in node unchanged, so put it in place before parsing starts.
    beforeParse(w) { w.PSEngine = require(path.join(DIR, 'engine.js')); },
  });
  const { window } = dom;
  // jsdom has no layout, so these are absent rather than broken.
  window.Element.prototype.scrollIntoView = function () {};
  const errors = [];
  window.addEventListener('error', e => errors.push(e.message || String(e.error)));
  window.onerror = (m) => { errors.push(String(m)); return false; };
  // The <script src> tags are not fetched, so load the same files in the same
  // order the markup names them.
  scripts.forEach(f => {
    const el = window.document.createElement('script');
    el.textContent = read(f);
    window.document.head.appendChild(el);
  });
  const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  return { window, errors, click,
    $: s => window.document.querySelector(s),
    $$: s => [...window.document.querySelectorAll(s)] };
}

// ─────────────────────── the admin ───────────────────────
section('Admin: editing things');
{
  const { window, errors, click, $, $$ } = boot('admin.html', ADMIN_SCRIPTS);
  check('the admin scripts run without error', errors, []);

  // Hand it the config directly, which is what a successful token load does.
  window.eval('CONFIG = ' + JSON.stringify(CONFIG) + ';');
  window.eval('switchFlow(' + JSON.stringify(CONFIG.flows[0].id) + ');');
  check('it renders the flow without error', errors, []);
  check('and draws the variables', $$('#inputs-root .drag-row, #inputs-root .act').length > 0, true);

  const sections = $$('#tasks-root .block-head');
  check('and a block per subflow plus the shared one', sections.length > 1, true);

  // ── expanding ──
  sections.forEach(click);
  const total = $$('#tasks-root .act').length;
  check('expanding every block shows the tasks', total > 0, true);
  check('expanding raises no error', errors, []);

  // ── the bug: edit an existing task ──
  // The form finds its own fields by id, so every container above it has to be
  // in the document before it is drawn.
  const openAll = () => $$('#tasks-root .block-head').forEach(h => {
    if (!h.parentElement.querySelector('.block-body')) click(h);
  });
  const editAt = i => {
    openAll();
    const row = $$('#tasks-root .act')[i];
    if (!row) return { missing: true };
    const desc = row.querySelector('.act-desc').textContent;
    const btn = [...row.parentElement.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Edit');
    errors.length = 0;
    let thrown = null;
    try { click(btn); } catch (e) { thrown = e.message; }
    return { desc, thrown, errs: errors.slice(),
      rows: $$('#tasks-root .act').length,
      form: !!$('#tf-description'), effort: !!$('#tf-effort'), chips: !!$('#tf-chips') };
  };

  // Every task, not a sample: the sections differ and so do the tasks in them.
  const results = [];
  const count = $$('#tasks-root .act').length;
  for (let i = 0; i < count; i++) {
    const r = editAt(i);
    if (!r.missing) results.push(r);
    try { window.eval('closeForm();'); } catch (e) { results.push({ thrown: 'closeForm: ' + e.message }); }
  }
  check('every task can be opened for editing', results.length, count);
  check('none of them throws', results.filter(r => r.thrown).map(r => r.desc + ': ' + r.thrown), []);
  check('none of them logs an error', results.filter(r => r.errs && r.errs.length).map(r => r.desc + ': ' + r.errs[0]), []);
  // This is the symptom that was reported: the list vanished.
  check('the task list survives opening the form', results.filter(r => r.rows === 0).map(r => r.desc), []);
  check('the form itself appears', results.filter(r => !r.form).map(r => r.desc), []);
  // Both of these are drawn by helpers that look their container up by id, so
  // they are the parts that go missing when a container is detached.
  check('with its effort editor', results.filter(r => !r.effort).map(r => r.desc), []);
  check('and its variable chips', results.filter(r => !r.chips).map(r => r.desc), []);

  // ── adding a task ──
  openAll();
  const add = $$('#tasks-root .btn-add').find(b => /Add task here/.test(b.textContent));
  errors.length = 0;
  click(add);
  check('adding a task opens a form', !!$('#tf-description'), true);
  check('and does not collapse the section', $$('#tasks-root .act').length > 0, true);
  check('and raises no error', errors, []);
  window.eval('closeForm();');

  // ── editing a variable, which worked all along ──
  errors.length = 0;
  const vEdit = $$('#inputs-root button').find(b => b.textContent.trim() === 'Edit');
  click(vEdit);
  check('editing a variable opens its form', !!$('#if-label'), true);
  check('and raises no error', errors, []);
  window.eval('closeForm();');

  // ── the hours panel ──
  // It is the reason a task exists, so it leads the form and shows a running
  // total rather than sitting fourth with the same weight as "Skill required".
  openAll();
  errors.length = 0;
  click([...$$('#tasks-root .act')[0].parentElement.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Edit'));
  check('the task form leads with the hours panel', !!$('.tf-hours'), true);
  check('the hours come before the phase',
    $('#tf-description').compareDocumentPosition($('.tf-hours')) & 4 ? true : false, true);
  check('and the phase comes after the hours',
    $('.tf-hours').compareDocumentPosition($('#tf-phase')) & 4 ? true : false, true);
  check('the repeat sits inside the panel, with the hours it multiplies',
    !!$('.tf-hours #tf-repeat'), true);
  check('the panel shows a running total', !!$('#tf-hours-total'), true);
  check('which reads as nothing before any resource is added',
    $('#tf-hours-total').textContent.trim(), '—');
  window.eval('addEffortLine();');
  check('adding a resource adds a line', $$('[data-effort]').length, 1);
  // amountEditor names the plain figure <prefix>-base; the rest of the prefix
  // belongs to the scale-with-a-variable rows under it.
  window.eval("document.getElementById('tf-eff0-bh-base').value = 3; updateTaskPreview();");
  check('and the total follows what is typed', $('#tf-hours-total').textContent.trim(), '3h');
  check('none of that threw', errors, []);
  window.eval('closeForm();');

  // ── reordering tasks ──
  // Drag needs a DataTransfer, which jsdom does not implement, so this drives
  // the keyboard route. Both end in reorderTasks, which is the part that can be
  // wrong.
  openAll();
  const flowOf = () => window.eval('JSON.stringify(F().tasks.map(t => t.id))');
  const before = JSON.parse(flowOf());
  const firstRow = $$('#tasks-root .act')[0];
  check('task rows are draggable', firstRow.classList.contains('drag-row'), true);
  check('and carry a grip', !!firstRow.querySelector('.grip'), true);
  // The section is in the kind so a row cannot be dropped into another section.
  const kinds = [...new Set($$('#tasks-root .act').map(r => r.dataset.dragKind))];
  check('each section is its own drag scope', kinds.length > 1, true);
  check('and every scope is a task scope', kinds.filter(k => !k.startsWith('task:')), []);

  errors.length = 0;
  const sendAlt = (row, key) => row.dispatchEvent(new window.KeyboardEvent('keydown',
    { key, altKey: true, bubbles: true }));
  // The rows on screen belong to one section, and its tasks are scattered
  // through the array rather than adjacent, so the slots are what to watch.
  const scope = firstRow.dataset.dragKind;
  const slots = $$('#tasks-root .act')
    .filter(r => r.dataset.dragKind === scope)
    .map(r => Number(r.dataset.dragIndex));
  const moving = before[slots[0]];
  sendAlt(firstRow, 'ArrowDown');
  const after = JSON.parse(flowOf());

  check('Alt with an arrow moves the task', after[slots[0]] !== moving, true);
  check('and moves it one place among the rows it can see',
    after[slots[1]], moving);
  check('nothing is lost or duplicated', after.slice().sort(), before.slice().sort());

  // The invariant that matters. A section's tasks are interleaved with other
  // sections', so a naive splice would carry this task past a task belonging to
  // a subflow nobody was looking at, quietly reordering its output.
  const outsiders = before
    .map((id, i) => ({ id, i }))
    .filter(x => !slots.includes(x.i));
  check('and moves nothing that belongs to another section',
    outsiders.filter(x => after[x.i] !== x.id).map(x => x.id), []);

  check('the row keeps focus, so it can be moved again',
    window.document.activeElement && window.document.activeElement.dataset.dragKind, scope);
  check('reordering raises no error', errors, []);

  // Reversible, which the splice version was not.
  sendAlt(window.document.activeElement, 'ArrowUp');
  check('and moving it back restores the original order exactly', JSON.parse(flowOf()), before);

  // ── the preview ──
  errors.length = 0;
  window.eval('togglePreview();');
  check('the preview opens without error', errors, []);
}

// ─────────────────────── the builder ───────────────────────
section('Builder: producing an estimate');
{
  const { window, errors, click, $, $$ } = boot('index.html', []);
  // The page fetches its config; hand it the same object instead.
  window.eval('CONFIG = ' + JSON.stringify(CONFIG) + '; renderFlows();');
  check('the builder renders its flows without error', errors, []);

  const cards = $$('#flow-list [role="radio"]');
  check('a card per enabled flow', cards.length, CONFIG.flows.filter(f => f.enabled !== false).length);

  click(cards[0]);
  const subs = $$('#subflow-grid [role="radio"]');
  check('picking a flow offers its subflows', subs.length > 0, true);
  click(subs[0]);
  // A card-display question renders as .pick-card and the rest as .q-card, so
  // count what landed rather than one of the two shapes.
  check('picking a subflow asks the questions', $('#question-root').children.length > 0, true);
  check('nothing has thrown yet', errors, []);

  // The reported symptom: the button did nothing.
  errors.length = 0;
  click($('#create-btn'));
  check('create estimate raises no error', errors, []);
  check('and produces task lines', $('#out-task').value.split('\n').filter(Boolean).length > 0, true);
  check('and resource lines', $('#out-resource').value.split('\n').filter(Boolean).length > 0, true);
  check('and a readable table', $$('#out-table tr').length > 1, true);
  check('and counts them', Number($('#sum-tasks').textContent) > 0, true);
  // Every line has to hold the same number of columns or the paste lands in the
  // wrong cells.
  const widths = [...new Set($('#out-task').value.split('\n').filter(Boolean)
    .map(l => l.split('\t').length))];
  check('every task line is the same width', widths.length, 1);
  const rWidths = [...new Set($('#out-resource').value.split('\n').filter(Boolean)
    .map(l => l.split('\t').length))];
  check('every resource line is the same width', rWidths.length, 1);
}

// ─────────────────────── pasting a sheet with hours ───────────────────────
section('Import: hours from a pasted sheet');
{
  // The real shape of a copy out of the PSE: the four task columns, then the
  // three yellow counts, the two grey effort columns, and then the resource
  // columns in threes -- R1 location, business, after, then R2, and so on.
  const TAB = '\t';
  const row = (phase, desc, ...tail) =>
    [phase, 'Collaboration', 'ArchiTech Activity', desc, '0', '0', '0', '', ''].concat(tail).join(TAB);
  const paste = [
    row('Kickoff', 'Imported kickoff session', 'Office', '1', ''),
    // The sheet carries rows like this one; they must not become tasks.
    ['', '', '', '', '0', '0', '0', '', '', '', '', ''].join(TAB),
    row('Design', 'Imported design review', 'Office', '6', ''),
    row('Implementation', 'Imported cutover', 'Client Site', '2', '1.5'),
  ].join('\n');

  const { window, errors, click, $, $$ } = boot('admin.html', ADMIN_SCRIPTS);
  window.eval('CONFIG = ' + JSON.stringify(CONFIG) + ';');
  window.eval('switchFlow(' + JSON.stringify(CONFIG.flows[0].id) + ');');
  errors.length = 0;
  window.eval('toggleImport();');
  window.eval(`document.getElementById('im-text').value = ${JSON.stringify(paste)}; readImportPaste();`);
  check('the paste is read without error', errors, []);

  const cols = JSON.parse(window.eval('JSON.stringify(IMPORT.result.cols)'));
  check('it works out the width', cols.width, 12);
  check('and finds the resource columns in threes',
    cols.resources.map(r => [r.slot, r.location, r.business, r.after]),
    [[1, 9, 10, 11]]);
  check('the blank row is not a task', window.eval('IMPORT.result.skipped'), 1);
  check('the real rows are', window.eval('IMPORT.rows.length'), 3);

  // The hours are read off the sheet, before anything about roles.
  const drafts = JSON.parse(window.eval('JSON.stringify(IMPORT.result.drafts)'));
  check('every row carries its hours', drafts.filter(d => !(d.effort || []).length), []);
  check('including after hours where there are some',
    drafts[2].effort[0].after, 1.5);
  check('and the location it was done in',
    drafts.map(d => d.effort[0].location), ['Office', 'Office', 'Client Site']);

  // The sheet cannot say whose column it was, so the panel has to ask -- and
  // must not let the tasks in without their cost by default.
  check('a role is asked for', window.eval('IMPORT.slots.length'), 1);
  check('and nothing is assumed', JSON.parse(window.eval('JSON.stringify(IMPORT.slotRoles)')), {});
  // It describes only what will actually come across, so a row unticked as a
  // duplicate is not counted in it.
  check('the panel says what that column holds',
    /10\.5h across 3 tasks/.test($('#import-slot').textContent), true);
  check('and the Add button refuses until it is answered',
    $('#im-add').disabled, true);
  check('saying why', /whose hours R1/.test($('#im-add').textContent), true);

  // Answer it, and the hours come across.
  window.eval("setSlotRole(1, 'SE');");
  check('once answered the button allows it', $('#im-add').disabled, false);
  check('and says how many entries', /3 hour entries/.test($('#im-add').textContent), true);
  const before = window.eval('F().tasks.length');
  window.eval('commitImport();');
  const added = JSON.parse(window.eval(
    'JSON.stringify(F().tasks.slice(-3).map(t => ({ d: t.description, e: t.effort })))'));
  check('three tasks arrive', window.eval('F().tasks.length'), before + 3);
  check('each with its role', added.map(t => t.e[0].role), ['SE', 'SE', 'SE']);
  check('its business hours', added.map(t => t.e[0].business.base), [1, 6, 2]);
  check('and after hours only where there were any',
    added.map(t => (t.e[0].after || {}).base), [undefined, undefined, 1.5]);
  check('the config still validates',
    JSON.parse(window.eval('JSON.stringify(PSEngine.validateConfig(CONFIG))')), []);
  check('none of that raised an error', errors, []);

  // Choosing to drop the hours must be possible, and must not invent a role
  // called "none".
  const two = boot('admin.html', ADMIN_SCRIPTS);
  two.window.eval('CONFIG = ' + JSON.stringify(CONFIG) + ';');
  two.window.eval('switchFlow(' + JSON.stringify(CONFIG.flows[0].id) + ');');
  two.window.eval('toggleImport();');
  two.window.eval(`document.getElementById('im-text').value = ${JSON.stringify(paste)}; readImportPaste();`);
  two.errors.length = 0;
  two.window.eval("setSlotRole(1, 'none');");
  check('dropping the hours is allowed on purpose', two.$('#im-add').disabled, false);
  check('and the panel says they will be left behind',
    /left behind, as asked/.test(two.$('#import-slot').textContent), true);
  const n0 = two.window.eval('F().tasks.length');
  two.window.eval('commitImport();');
  const dropped = JSON.parse(two.window.eval(
    'JSON.stringify(F().tasks.slice(-3).map(t => t.effort))'));
  check('the tasks arrive with no effort at all', dropped, [[], [], []]);
  check('no task claims a role called none',
    JSON.parse(two.window.eval('JSON.stringify(F().tasks.filter(t => (t.effort||[]).some(e => e.role === "none")))')), []);
  check('and that config validates too',
    JSON.parse(two.window.eval('JSON.stringify(PSEngine.validateConfig(CONFIG))')), []);
  check('with no error', two.errors, []);

  // Two resources, which is the "more of them, in threes" case.
  const wide = [
    row('Kickoff', 'Two resources', 'Office', '1', '0', 'Client Site', '4', '0.5'),
  ].join('\n');
  const three = boot('admin.html', ADMIN_SCRIPTS);
  three.window.eval('CONFIG = ' + JSON.stringify(CONFIG) + ';');
  three.window.eval('switchFlow(' + JSON.stringify(CONFIG.flows[0].id) + ');');
  three.window.eval('toggleImport();');
  three.window.eval(`document.getElementById('im-text').value = ${JSON.stringify(wide)}; readImportPaste();`);
  const wideCols = JSON.parse(three.window.eval('JSON.stringify(IMPORT.result.cols.resources)'));
  check('a second group of three is a second resource',
    wideCols.map(r => [r.slot, r.location, r.business, r.after]),
    [[1, 9, 10, 11], [2, 12, 13, 14]]);
  check('and both are asked about', three.window.eval('IMPORT.slots.length'), 2);
  check('answering only one still refuses',
    (three.window.eval("setSlotRole(1, 'SE');"), three.$('#im-add').disabled), true);
  three.window.eval("setSlotRole(2, 'TA');");
  three.window.eval('commitImport();');
  const both = JSON.parse(three.window.eval('JSON.stringify(F().tasks.slice(-1)[0].effort)'));
  check('both resources land on the task', both.map(x => x.role), ['SE', 'TA']);
  check('with their own locations', both.map(x => x.location), ['Office', 'Client Site']);
  check('and their own hours', both.map(x => x.business.base), [1, 4]);
  check('after hours on the one that had them', (both[1].after || {}).base, 0.5);
}

// ─────────────────────── export and import ───────────────────────
section('Admin: export and import');
{
  const { window, errors, click, $, $$ } = boot('admin.html', ADMIN_SCRIPTS);
  window.eval('CONFIG = ' + JSON.stringify(CONFIG) + ';');
  window.eval('switchFlow(' + JSON.stringify(CONFIG.flows[0].id) + ');');

  // Downloads need a Blob URL, which jsdom does not create. Capture what would
  // have been written instead.
  const saved = [];
  window.eval(`
    window.__saved = [];
    saveFile = function (name, text) { window.__saved.push({ name, text }); };
  `);

  errors.length = 0;
  window.eval('toggleTransfer();');
  check('the panel opens', !!$('#tr-text'), true);
  check('and raises no error', errors, []);

  window.eval('exportFlow();');
  const files = window.eval('JSON.stringify(window.__saved.map(f => f.name))');
  check('exporting a flow writes one file', JSON.parse(files).length, 1);
  const payload = JSON.parse(window.eval('window.__saved[0].text'));
  check('it says what kind of file it is', payload.kind, 'psbuilder.flow');
  check('and carries the flow', payload.flow.id, CONFIG.flows[0].id);
  check('with every task', (payload.flow.tasks || []).length, CONFIG.flows[0].tasks.length);
  // The point of the format: a flow alone would import into a broken config.
  check('and the vertical it needs', payload.requires.vertical.id, CONFIG.flows[0].vertical);
  const usedPhases = [...new Set(CONFIG.flows[0].tasks.map(t => t.phase).filter(Boolean))];
  check('and every phase its tasks name',
    usedPhases.filter(p => !payload.requires.phases.includes(p)), []);
  const usedSkills = [...new Set(CONFIG.flows[0].tasks.map(t => t.skill).filter(Boolean))];
  check('and every skill', usedSkills.filter(s => !payload.requires.skills.includes(s)), []);

  // ── round trip: the same file, back in ──
  errors.length = 0;
  window.eval(`document.getElementById('tr-text').value = window.__saved[0].text; readTransfer();`);
  check('reading it back finds no problems',
    JSON.parse(window.eval('JSON.stringify(TRANSFER.report.problems)')), []);
  check('and notices the id is already here',
    window.eval('TRANSFER.report.clash.id'), CONFIG.flows[0].id);
  check('and nothing is missing from this config',
    JSON.parse(window.eval('JSON.stringify(TRANSFER.report.missing)')), []);
  check('it offers to keep both or replace', $$('input[name="tr-mode"]').length, 2);

  // Keeping both must not quietly shadow the existing flow behind a shared id.
  window.eval('applyTransfer();');
  const ids = JSON.parse(window.eval('JSON.stringify(CONFIG.flows.map(f => f.id))'));
  check('adding it keeps the original', ids.includes(CONFIG.flows[0].id), true);
  check('and gives the copy its own id', ids.length, CONFIG.flows.length + 1);
  check('so no two flows share an id', ids.length, new Set(ids).size);
  check('the result still validates',
    JSON.parse(window.eval('JSON.stringify(PSEngine.validateConfig(CONFIG))')), []);
  check('the round trip raises no error', errors, []);

  // ── a file it should refuse ──
  const bad = [
    ['not JSON at all', 'this is not json'],
    ['JSON that is not an export', '{"hello":"world"}'],
    ['a flow naming a phase this config lacks', JSON.stringify({
      kind: 'psbuilder.flow', version: 1,
      requires: { vertical: { id: 'x', name: 'X' }, phases: ['Phase From Another Planet'],
                  skills: [], taskTypes: [], roles: [], locations: [] },
      flow: { id: 'imported', name: 'Imported', vertical: 'x', subflows: [], inputs: [], tasks: [] },
    })],
  ];
  bad.forEach(([what, text]) => {
    window.eval(`document.getElementById('tr-text').value = ${JSON.stringify(text)}; readTransfer();`);
    const problems = JSON.parse(window.eval('JSON.stringify(TRANSFER.report.problems)'));
    check('it refuses ' + what, problems.length > 0, true);
    const countBefore = window.eval('CONFIG.flows.length');
    window.eval('applyTransfer();');
    check('and changes nothing when it does', window.eval('CONFIG.flows.length'), countBefore);
  });

  // ── the whole-config backup ──
  window.eval('window.__saved = []; exportConfig();');
  const backup = JSON.parse(window.eval('window.__saved[0].text'));
  check('a backup says what it is', backup.kind, 'psbuilder.config');
  check('and holds every flow', backup.config.flows.length, window.eval('CONFIG.flows.length'));
}

// ─────────────────────── a flow with no subflows ───────────────────────
section('A flow may have no subflows');
{
  // One path, every task in it. The engine already read a null subflow as
  // "everything marked for all subflows"; this is about the pages that assumed
  // there would be at least one to show.
  const plain = JSON.parse(JSON.stringify(CONFIG));
  const f = plain.flows[0];
  f.subflows = [];
  f.tasks.forEach(t => { t.subflows = 'all'; });
  f.inputs.forEach(i => { delete i.subflows; });
  check('such a config is valid', PSEngine.validateConfig(plain), []);

  const admin = boot('admin.html', ADMIN_SCRIPTS);
  admin.window.eval('CONFIG = ' + JSON.stringify(plain) + ';');
  admin.errors.length = 0;
  admin.window.eval('switchFlow(' + JSON.stringify(f.id) + ');');
  check('the admin renders it', admin.errors, []);
  const blocks = admin.$$('#tasks-root .block-head');
  check('as a single section', blocks.length, 1);
  check('named for what it holds', blocks[0].querySelector('.block-name').textContent, 'All tasks');
  check('and says why there is only one',
    /no subflows/.test(blocks[0].querySelector('.block-meta').textContent), true);
  admin.click(blocks[0]);
  check('holding every task', admin.$$('#tasks-root .act').length, f.tasks.length);

  // The task form has nothing to scope against, so it should say so rather than
  // show an empty list of checkboxes.
  admin.click([...admin.$$('#tasks-root .act')[0].parentElement.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Edit'));
  check('the task form offers no subflow picker',
    /no subflows/.test(admin.$('#tf-subflows').textContent), true);
  check('and opening it raises no error', admin.errors, []);
  admin.window.eval('closeForm(); togglePreview();');
  check('the preview opens on the single path', admin.errors, []);

  const b = boot('index.html', []);
  b.window.eval('CONFIG = ' + JSON.stringify(plain) + '; renderFlows();');
  b.errors.length = 0;
  b.click(b.$$('#flow-list [role="radio"]')[0]);
  // The question nobody needs to be asked.
  check('the builder skips the subflow step',
    b.$('#subflow-section').classList.contains('active'), false);
  check('and goes straight to the questions', b.$('#question-root').children.length > 0, true);
  check('without error', b.errors, []);
  b.click(b.$('#create-btn'));
  check('an estimate comes out', b.$('#out-task').value.split('\n').filter(Boolean).length > 0, true);
  check('and the resource block with it',
    b.$('#out-resource').value.split('\n').filter(Boolean).length > 0, true);
  check('creating it raises no error', b.errors, []);
}

// ─────────────────────── the help page ───────────────────────
section('Help: the live reference');
{
  const { window, errors, $, $$ } = boot('help.html', []);
  check('the help page runs without error', errors, []);
  // It fetches its own config, which jsdom will not serve. Call the loader with
  // fetch stubbed, which is the same path the page takes.
  window.fetch = () => Promise.resolve({ ok: true, json: async () => CONFIG });
  return (async () => {
    await window.eval('loadReference()');
    check('it lists every flow', $$('#hp-live .q-card').length, CONFIG.flows.length);
    // The prose promises a variable table; this is the part that would silently
    // go stale if it were written by hand.
    const tokens = $$('#hp-live .hp-token').map(el => el.textContent);
    const expected = CONFIG.flows.flatMap(f => (f.inputs || []).map(i => '{' + (i.token || i.id) + '}'));
    check('and every variable of every flow',
      expected.filter(t => !tokens.includes(t)), []);
    check('and every repeating task',
      CONFIG.flows.flatMap(f => (f.tasks || []).filter(t => t.repeatPer))
        .filter(t => !$('#hp-live').textContent.includes(t.description)), []);
    check('it fills in the real roles',
      CONFIG.roles.filter(r => !$('#hp-roles').textContent.includes(r.name)), []);
    check('and the real locations',
      CONFIG.locations.filter(l => !$('#hp-locations').textContent.includes(l)), []);
    check('nothing threw while building it', errors, []);

    console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nALL INTERACTION CHECKS PASSED');
    process.exit(failures ? 1 : 0);
  })();
}

console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nALL INTERACTION CHECKS PASSED');
process.exit(failures ? 1 : 0);
