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
const ADMIN_SCRIPTS = ['engine.js', 'admin-github.js', 'admin-render.js',
  'admin-forms.js', 'admin-import.js', 'admin-preview.js'];

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

console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nALL INTERACTION CHECKS PASSED');
process.exit(failures ? 1 : 0);
