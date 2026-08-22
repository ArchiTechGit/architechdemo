// What the page shows, and the helpers everything else reads.
//
// Holds the model helpers (which flow is active, how tasks group into
// sections, how a condition reads in plain words), the list and section
// rendering, and drag-to-reorder. EDITING and EXPANDED live here because
// this is what reacts to them.

// ─── Model helpers ───
// Shared with the builder, so the two cannot escape differently.
const esc = PSEngine.esc;
const attr = PSEngine.attr;
const round2 = PSEngine.round2;
function slugify(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';
}
function uniqueId(base, taken) {
  let id = base, n = 2;
  while (taken.includes(id)) { id = `${base}-${n}`; n++; }
  return id;
}
function count(n, one, many) { return `${n} ${n === 1 ? one : many}`; }

let activeFlowId = null;
function F() { return CONFIG.flows.find(f => f.id === activeFlowId); }
function inputById(id) { return F().inputs.find(i => i.id === id); }
function tokenOf(inp) { return inp.token || inp.id; }
function numberInputs() { return F().inputs.filter(i => i.type === 'number'); }

// The sections the admin lays tasks out in: one for tasks shared by every
// subflow, then one per subflow. A task listing several subflows shows up
// under each of them, which is the point of listing several.
// What is typed in the box above the task list. Held here rather than read from
// the field each time, because the list is rebuilt on every keystroke and the
// field would be gone by then.
let TASK_FILTER = '';

function setTaskFilter(text) {
  TASK_FILTER = text;
  renderAdmin();
  // The field is rebuilt by the render, so put the caret back in it.
  const box = document.getElementById('task-filter');
  if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
}

function clearTaskFilter() { TASK_FILTER = ''; renderAdmin(); }

// Matches on everything you might remember about a task: what it says, which
// phase it is in, the skill, and the variable it repeats over.
function matchesFilter(t) {
  if (!TASK_FILTER.trim()) return true;
  const hay = [t.description, t.phase, t.skill, t.taskType, t.repeatPer]
    .filter(Boolean).join(' ').toLowerCase();
  // Every word has to appear somewhere, so "design doc" finds a design
  // document without the two words having to be adjacent.
  return TASK_FILTER.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}

function filtering() { return !!TASK_FILTER.trim(); }

function sectionsForFlow(f) {
  const subs = f.subflows || [];
  // With no subflows there is one section and it holds everything, so calling it
  // "All subflows" would be describing something that is not there.
  if (!subs.length) return [{ id: 'all', name: 'All tasks', shared: true, only: true }];
  return [{ id: 'all', name: 'All subflows', shared: true }]
    .concat(subs.map(s => ({ id: s.id, name: s.name, note: s.note })));
}

function tasksIn(section) {
  return allTasksIn(section).filter(({ t }) => matchesFilter(t));
}

// The unfiltered membership, which the counts and the orphan check need: a task
// hidden by the filter is still in the flow.
function allTasksIn(section) {
  return F().tasks.map((t, idx) => ({ t, idx })).filter(({ t }) => {
    const m = t.subflows;
    if (section.shared) return m === undefined || m === 'all';
    return Array.isArray(m) && m.includes(section.id);
  });
}

// Tasks that can never appear: they name a subflow, input or option that is
// no longer there.
function orphanTasks() {
  const f = F();
  const subIds = f.subflows.map(s => s.id);
  return f.tasks.map((t, idx) => ({ t, idx })).filter(({ t }) => {
    const m = t.subflows;
    if (Array.isArray(m) && !m.some(id => subIds.includes(id))) return true;
    if (t.repeatPer && !f.inputs.some(i => i.id === t.repeatPer && i.type === 'number')) return true;
    const c = t.showWhen;
    if (!c || !c.input) return false;
    const inp = f.inputs.find(i => i.id === c.input);
    if (!inp) return true;
    if (c.is !== undefined) return !(inp.options || []).some(o => o.id === c.is);
    return false;
  });
}

const TYPE_NAMES = { number: 'Variable (number)', yesno: 'Yes / No', checklist: 'Tick any', choice: 'Pick one' };

function describeCond(c) {
  if (!c || !c.input) return null;
  const inp = inputById(c.input);
  const name = inp ? inp.label : c.input;
  if (c.is !== undefined) {
    const o = inp && (inp.options || []).find(o => o.id === c.is);
    return `only when "${o ? o.label : c.is}" is chosen`;
  }
  if (c.anySelected) return `only when anything is ticked in "${name}"`;
  if (c.isOn) return `only when "${name}" is on`;
  if (c.moreThanZero) return `only when "${name}" is above zero`;
  return 'unknown condition';
}

// Effort at the flow's default answers, so the lists show real numbers.
function amountAt(a) {
  if (a == null) return 0;
  if (typeof a === "number") return a;
  let total = Number(a.base || 0);
  (a.per || []).forEach(p => {
    const inp = inputById(p.input);
    const dflt = inp ? (inp.default != null ? inp.default : (inp.min || 0)) : 0;
    total += Number(dflt) * Number(p.each || 0);
  });
  return round2(total);
}

function hoursAtDefaults(task) {
  return round2((task.effort || []).reduce((n, e) => n + amountAt(e.business) + amountAt(e.after), 0));
}

function roleLabel(id) {
  const r = (CONFIG.roles || []).find(r => r.id === id);
  return r ? r.id : id;
}

// A short, readable summary of who does the work and when.
function describeEffort(task) {
  const bits = (task.effort || []).map(e => {
    const bh = amountAt(e.business);
    const ah = amountAt(e.after);
    const parts = [];
    if (bh) parts.push(bh + "h");
    if (ah) parts.push(ah + "h after hours");
    return roleLabel(e.role) + " " + (parts.join(" + ") || "0h");
  });
  return bits.length ? bits.join(", ") : "no effort costed";
}

// ─── Render ───
// EDITING says which inline form is open so a full re-render restores it.
// It holds ids rather than positions: a list can be reordered or added to
// while a form is open, and an index would then point at a different row.
//   { kind:'flow' } { kind:'new-flow' } { kind:'input', idx }
//   { kind:'task', idx } { kind:'task-new', section }
// A condition may only look at an input asked earlier, so a move that would
// put a dependency after its dependant has to be refused.
function firstBrokenDependency(list) {
  const pos = new Map(list.map((i, n) => [i.id, n]));
  for (let n = 0; n < list.length; n++) {
    const conds = [list[n].showWhen]
      .concat((list[n].options || []).map(o => o.showWhen))
      .filter(Boolean);
    for (const c of conds) {
      if (pos.get(c.input) >= n) return { dependant: list[n], on: c.input };
    }
  }
  return null;
}

// ── drag to reorder ──
// DRAG holds which list is moving and the row it started on. Dropping on a
// row inserts above or below it depending on which way you came from.
let DRAG = null;

function clearDropMarks() {
  document.querySelectorAll('.drop-above, .drop-below')
    .forEach(el => el.classList.remove('drop-above', 'drop-below'));
}

function makeDraggable(row, kind, idx, siblings) {
  row.classList.add('drag-row');
  row.draggable = true;
  row.tabIndex = 0;
  row.dataset.dragIndex = idx;
  row.dataset.dragKind = kind;

  row.ondragstart = (ev) => {
    DRAG = { kind, from: idx };
    row.classList.add('dragging');
    ev.dataTransfer.effectAllowed = 'move';
    // Firefox refuses to start a drag unless some data is set.
    ev.dataTransfer.setData('text/plain', String(idx));
  };
  row.ondragend = () => { row.classList.remove('dragging'); clearDropMarks(); DRAG = null; };
  row.ondragover = (ev) => {
    if (!DRAG || DRAG.kind !== kind || DRAG.from === idx) return;
    ev.preventDefault();
    row.classList.remove('drop-above', 'drop-below');
    row.classList.add(DRAG.from < idx ? 'drop-below' : 'drop-above');
  };
  row.ondragleave = () => row.classList.remove('drop-above', 'drop-below');
  row.ondrop = (ev) => {
    if (!DRAG || DRAG.kind !== kind) return;
    ev.preventDefault();
    clearDropMarks();
    const from = DRAG.from;
    DRAG = null;
    if (from !== idx) reorder(kind, from, idx, siblings);
  };
  // Dragging is mouse-only, so keep a keyboard route open. Without siblings the
  // next position is the next index; with them it is the next row on screen,
  // which for a task is somewhere else in the array entirely.
  const step = (dir) => {
    if (!siblings) return idx + dir;
    const at = siblings.indexOf(idx);
    if (at < 0) return -1;
    return siblings[at + dir] == null ? -1 : siblings[at + dir];
  };
  row.onkeydown = (ev) => {
    if (!ev.altKey) return;
    if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
    const to = step(ev.key === 'ArrowUp' ? -1 : 1);
    if (to < 0) return;
    ev.preventDefault();
    // Remember what to put the focus back on: renderAdmin rebuilds the row.
    REFOCUS = { kind, idx: to };
    reorder(kind, idx, to, siblings);
  };

  const grip = document.createElement('span');
  grip.className = 'grip';
  grip.textContent = '\u22ee\u22ee';
  grip.title = 'Drag to reorder, or Alt with the arrow keys';
  row.insertBefore(grip, row.firstChild);
  return row;
}

// Set just before a keyboard move so the row can be found again after the
// re-render. Without it Alt+Down moves once and then focus is gone.
let REFOCUS = null;

// The panels are alternatives, not layers: each one wants the width and the
// attention. Opening one puts the others away rather than stacking them down
// the page where they push the real content out of sight.
//
// Each entry names the state that holds the panel open and the toolbar button
// that opens it, so both the closing and the pressed state come from one list.
const PANELS = [
  { key: 'flow',     button: 'btn-settings', isOpen: () => !!EDITING && (EDITING.kind === 'flow' || EDITING.kind === 'new-flow'), close: () => { EDITING = null; } },
  { key: 'import',   button: 'btn-import',   isOpen: () => !!IMPORT,   close: () => { IMPORT = null; } },
  { key: 'preview',  button: 'btn-preview',  isOpen: () => !!PREVIEW,  close: () => { PREVIEW = null; } },
  { key: 'transfer', button: 'btn-transfer', isOpen: () => !!TRANSFER, close: () => { TRANSFER = null; } },
];

// Called by each toggle before it opens itself.
function closeOtherPanels(keep) {
  PANELS.forEach(p => { if (p.key !== keep) p.close(); });
}

// The toolbar has to say which panel is open, or the only clue is a slab of
// form appearing somewhere further down.
function syncToolbar() {
  PANELS.forEach(p => {
    const btn = document.getElementById(p.button);
    if (!btn) return;
    const open = p.isOpen();
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

function reorder(kind, from, to, siblings) {
  if (kind === 'input') return reorderInputs(from, to);
  if (kind === 'subflow') return reorderSubflowRows(from, to);
  // Every task section shares one handler; the section is in the kind only so
  // that a row cannot be dropped into a different section.
  if (kind.startsWith('task:')) return reorderTasks(from, to, siblings);
}

// The order of f.tasks is the order the lines come out, so this is the only
// control over where a task lands in the sheet.
//
// A section's tasks are not adjacent in the array -- the rows on screen are the
// members of one subflow, scattered through a list that holds every subflow's.
// So the move happens among their own slots: the tasks are lifted out, reordered
// between themselves, and written back into the same positions. Splicing the
// flat array instead would carry the task past whatever sat in between, silently
// reordering a subflow nobody was looking at, and would not be reversible.
function reorderTasks(from, to, slots) {
  const f = F();
  if (!Array.isArray(slots)) return;
  const a = slots.indexOf(from);
  const b = slots.indexOf(to);
  if (a < 0 || b < 0 || a === b) return;
  const held = slots.map(i => f.tasks[i]);
  const next = moved(held, a, b);
  slots.forEach((slot, n) => { f.tasks[slot] = next[n]; });
  renderAdmin();
}

// Called at the end of a render, once the rows exist again.
function restoreFocus() {
  if (!REFOCUS) return;
  const { kind, idx } = REFOCUS;
  REFOCUS = null;
  const row = document.querySelector(
    '.drag-row[data-drag-kind="' + kind + '"][data-drag-index="' + idx + '"]');
  if (row) row.focus();
}

function moved(list, from, to) {
  const next = list.slice();
  const held = next.splice(from, 1)[0];
  next.splice(to, 0, held);
  return next;
}

function reorderInputs(from, to) {
  const f = F();
  if (to < 0 || to >= f.inputs.length) return;
  const next = moved(f.inputs, from, to);
  const broken = firstBrokenDependency(next);
  if (broken) {
    const on = next.find(i => i.id === broken.on);
    alert(`Cannot move that: "${broken.dependant.label}" only shows once ` +
          `"${on ? on.label : broken.on}" has been answered, so it has to stay after it.`);
    return;
  }
  f.inputs = next;
  renderAdmin();
}

// Subflow rows are reordered in the open form, not the model, so nothing
// else typed into the form is lost. saveFlowForm reads them in DOM order.
function reorderSubflowRows(from, to) {
  const list = document.getElementById('ff-subflows');
  const rows = Array.from(list.children);
  if (to < 0 || to >= rows.length) return;
  const dragged = rows[from];
  const target = rows[to];
  list.insertBefore(dragged, from < to ? target.nextSibling : target);
  wireSubflowDrag();
  dragged.focus();
}

// Re-indexes the rows after a move, since the handlers close over position.
function wireSubflowDrag() {
  const list = document.getElementById('ff-subflows');
  if (!list) return;
  Array.from(list.children).forEach((row, n) => {
    const grip = row.querySelector('.grip');
    if (grip) grip.remove();
    makeDraggable(row, 'subflow', n);
  });
}
// Labels were visual only: no for=, so clicking one did nothing and a
// screen reader announced an unlabelled field. Wiring them up after each
// render keeps it true no matter how the forms change.
let labelSeq = 0;
function linkLabels(root) {
  (root || document).querySelectorAll('label.field-label').forEach(label => {
    if (label.htmlFor) return;
    const field = label.closest('.field') || label.parentElement;
    const control = field && field.querySelector('input, select, textarea');
    if (!control) return;
    if (!control.id) control.id = 'ctl-' + (++labelSeq);
    label.htmlFor = control.id;
  });
}

let EDITING = null;
const EXPANDED = new Set();

function closeForm() { EDITING = null; renderAdmin(); }

// -1 means a new row; null means the row it pointed at is gone.
function editingInputIndex() {
  if (!EDITING || EDITING.kind !== 'input') return null;
  if (!EDITING.id) return -1;
  const at = F().inputs.findIndex(i => i.id === EDITING.id);
  return at === -1 ? null : at;
}

function editingTaskIndex() {
  if (!EDITING || EDITING.kind !== 'task') return null;
  if (!EDITING.id) return -1;
  const at = F().tasks.findIndex(t => t.id === EDITING.id);
  return at === -1 ? null : at;
}
function toggleExpand(key) {
  if (EXPANDED.has(key)) EXPANDED.delete(key); else EXPANDED.add(key);
  renderAdmin();
}
function switchFlow(id) {
  activeFlowId = id;
  EDITING = null;
  EXPANDED.clear();
  PREVIEW = null;
  IMPORT = null;
  renderAdmin();
}

function renderAdmin() {
  const sel = document.getElementById('flow-select');
  sel.innerHTML = CONFIG.verticals.map(v => {
    const flows = CONFIG.flows.filter(f => f.vertical === v.id);
    if (!flows.length) return '';
    return `<optgroup label="${attr(v.name)}">` + flows.map(f =>
      `<option value="${attr(f.id)}" ${f.id === activeFlowId ? 'selected' : ''}>${esc(f.name)}${f.enabled === false ? ' (hidden)' : ''}</option>`
    ).join('') + '</optgroup>';
  }).join('');

  const fslot = document.getElementById('flow-form-slot');
  fslot.innerHTML = '';
  if (EDITING && EDITING.kind === 'new-flow') { renderNewFlowForm(fslot); renderRest(true); linkLabels(); return syncToolbar(); }
  if (EDITING && EDITING.kind === 'flow') renderFlowForm(fslot);
  renderRest(false);
  // Once, at the end, when every form on the page exists. This used to be a
  // setTimeout because it ran before the forms were drawn; they are now drawn
  // into containers that are already attached, so it can be synchronous -- and
  // there is no longer a tick where the fields have no labels.
  linkLabels();
  restoreFocus();
  syncToolbar();
}

function renderRest(hideRest) {
  const f = F();
  const intro = document.getElementById('admin-intro');
  const inputsRoot = document.getElementById('inputs-root');
  const tasksRoot = document.getElementById('tasks-root');
  const inputSlot = document.getElementById('input-form-slot');
  inputsRoot.innerHTML = '';
  tasksRoot.innerHTML = '';
  inputSlot.innerHTML = '';

  if (hideRest || !f) { intro.textContent = ''; return; }

  const vertical = CONFIG.verticals.find(v => v.id === f.vertical);
  intro.textContent =
    `${f.name} sits under ${vertical ? vertical.name : f.vertical} and has ` +
    `${count(f.subflows.length, 'subflow', 'subflows')}, ` +
    `${count(f.inputs.length, 'input', 'inputs')} and ` +
    `${count(f.tasks.length, 'task', 'tasks')}. ` +
    `Tasks are grouped by the subflows they belong to.`;

  renderImport();
  renderPreview();
  renderTransfer();
  renderInputs(inputsRoot);
  if (EDITING && EDITING.kind === 'input') {
    const at = editingInputIndex();
    // The question being edited was deleted from under the form.
    if (at === null) EDITING = null;
    else renderInputForm(inputSlot, at);
  }
  renderTaskFilter(tasksRoot);
  renderTaskSections(tasksRoot);
}

function renderInputs(root) {
  const f = F();
  f.inputs.forEach((inp, idx) => {
    const gate = describeCond(inp.showWhen);
    const scope = Array.isArray(inp.subflows)
      ? ' · ' + inp.subflows.map(id => (f.subflows.find(s => s.id === id) || {}).name || id).join(', ') + ' only'
      : '';
    const bits = [TYPE_NAMES[inp.type] || inp.type];
    if (inp.type === 'number') bits.push('{' + tokenOf(inp) + '}');
    if (gate) bits.push(gate);
    const row = document.createElement('div');
    row.className = 'act';
    row.innerHTML = `
      <div class="act-text">
        <div class="act-desc">${esc(inp.label)}</div>
        <div class="act-meta">${esc(bits.join(' · ') + scope)}</div>
      </div>`;
    const actions = document.createElement('div');
    actions.className = 'block-actions';
    const edit = document.createElement('button');
    edit.className = 'btn-ghost';
    edit.textContent = 'Edit';
    edit.onclick = () => { EDITING = { kind: 'input', id: inp.id }; renderAdmin(); };
    const del = document.createElement('button');
    del.className = 'btn-ghost';
    del.textContent = 'Delete';
    del.onclick = () => deleteInput(idx);
    actions.append(edit, del);
    row.appendChild(actions);
    root.appendChild(makeDraggable(row, 'input', idx));
  });
  const add = document.createElement('button');
  add.className = 'btn-secondary';
  add.textContent = '+ Add variable or question';
  add.onclick = () => { EDITING = { kind: 'input', id: null }; renderAdmin(); };
  root.appendChild(add);
}

function renderTaskFilter(root) {
  const f = F();
  const total = (f.tasks || []).length;
  // Not worth the row until there are enough tasks to lose one in.
  if (total < 8 && !filtering()) return;
  const shown = (f.tasks || []).filter(matchesFilter).length;

  const bar = document.createElement('div');
  bar.className = 'row-editor';
  bar.style.marginBottom = '12px';
  bar.innerHTML = `
    <label class="field-label" for="task-filter" style="margin:0;white-space:nowrap;">Find</label>
    <input type="text" id="task-filter" value="${attr(TASK_FILTER)}"
           placeholder="Find a task — words from its text, phase or skill"
           oninput="setTaskFilter(this.value)" style="flex:1;" />
    <span class="rate-label" style="flex:0 0 auto;">${
      filtering() ? shown + ' of ' + total : count(total, 'task', 'tasks')}</span>
    ${filtering() ? '<button class="btn-ghost" onclick="clearTaskFilter()">Clear</button>' : ''}`;
  root.appendChild(bar);

  if (filtering() && !shown) {
    const none = document.createElement('div');
    none.className = 'q-sub';
    none.style.cssText = 'font-style:italic;margin-bottom:10px;';
    none.textContent = 'No task matches that. Clear the filter to see them all.';
    root.appendChild(none);
  }
}

function renderTaskSections(root) {
  const f = F();
  sectionsForFlow(f).forEach(section => {
    const key = `${f.id}:sec:${section.id}`;
    const matches = tasksIn(section);
    const held = allTasksIn(section).length;
    const editingInside = EDITING && (
      (EDITING.kind === 'task-new' && EDITING.section === section.id) ||
      (EDITING.kind === 'task' && matches.some(m => m.t.id === EDITING.id))
    );
    const open = EXPANDED.has(key) || editingInside || (filtering() && matches.length > 0);
    const hours = round2(allTasksIn(section).reduce((n, m) => n + hoursAtDefaults(m.t), 0));

    if (filtering() && !matches.length) return;

    const block = document.createElement('div');
    block.className = 'block';
    const head = document.createElement('div');
    head.className = 'block-head';
    head.innerHTML = `
      <span class="block-chevron ${open ? 'open' : ''}">&#9654;</span>
      <div class="block-title">
        <div class="block-name">${esc(section.name)}</div>
        <div class="block-meta">${section.only
          ? 'This flow has no subflows, so every task is in it'
          : section.shared
            ? 'Included in every subflow'
            : esc(section.note || 'Only this subflow') + ' · plus everything in All subflows'}</div>
      </div>
      <span class="block-count ${matches.length === 0 ? 'zero' : ''}">${
        filtering() ? matches.length + ' of ' + held
        : matches.length === 0 ? 'none'
        : count(matches.length, 'task', 'tasks') + (hours ? ` · ${hours}h` : '')}</span>`;
    head.onclick = () => toggleExpand(key);
    block.appendChild(head);
    // Attached now, not at the end: renderTaskForm draws a form that finds its
    // own fields with getElementById, so every ancestor has to be in the
    // document first or the lookup returns null.
    root.appendChild(block);

    if (open) {
      const body = document.createElement('div');
      body.className = 'block-body';
      block.appendChild(body);
      // The visible order within this section, so Alt with an arrow key steps
      // to the next row on screen rather than the next slot in the array.
      const order = matches.map(m => m.idx);
      matches.forEach(({ t, idx }) => {
        // Dragging is off while filtering: the rows either side on screen are
        // not the rows either side in the section, so a move would jump the
        // task over whatever the filter is hiding.
        body.appendChild(filtering()
          ? taskEl(t, idx)
          : makeDraggable(taskEl(t, idx), 'task:' + section.id, idx, order));
        if (EDITING && EDITING.kind === 'task' && EDITING.id === t.id) {
          const slot = document.createElement('div');
          body.appendChild(slot);
          renderTaskForm(slot, editingTaskIndex(), section);
        }
      });
      if (!matches.length) {
        const empty = document.createElement('div');
        empty.className = 'q-sub';
        empty.style.cssText = 'font-style:italic;margin-bottom:8px;color:var(--muted);';
        empty.textContent = 'No tasks yet.';
        body.appendChild(empty);
      }
      const add = document.createElement('button');
      add.className = 'btn-add';
      add.textContent = '+ Add task here';
      add.onclick = () => {
        // Pin it, or saving would collapse the section and lose your place.
        EXPANDED.add(key);
        EDITING = { kind: 'task-new', section: section.id };
        renderAdmin();
      };
      body.appendChild(add);
      if (EDITING && EDITING.kind === 'task-new' && EDITING.section === section.id) {
        const slot = document.createElement('div');
        body.appendChild(slot);
        renderTaskForm(slot, -1, section);
      }
    }
  });

  const orphans = orphanTasks();
  if (orphans.length) {
    const warn = document.createElement('div');
    warn.className = 'section-label';
    warn.style.cssText = 'margin-top:30px;';
    warn.textContent = 'Not connected to anything — these will never appear';
    root.appendChild(warn);
    const box = document.createElement('div');
    box.className = 'block';
    root.appendChild(box);
    const body = document.createElement('div');
    body.className = 'block-body';
    body.style.paddingTop = '16px';
    box.appendChild(body);
    const orphanOrder = orphans.map(m => m.idx);
    orphans.forEach(({ t, idx }) => {
      body.appendChild(makeDraggable(taskEl(t, idx), 'task:orphans', idx, orphanOrder));
      if (EDITING && EDITING.kind === 'task' && EDITING.id === t.id) {
        const slot = document.createElement('div');
        body.appendChild(slot);
        renderTaskForm(slot, editingTaskIndex(), { id: 'all', name: 'All subflows', shared: true });
      }
    });
  }
}

function taskEl(t, idx) {
  const row = document.createElement("div");
  row.className = "act";
  const meta = [t.phase];
  if (t.skill) meta.push(t.skill);
  if (t.taskType && t.taskType !== "ArchiTech Activity") meta.push(t.taskType);
  meta.push(describeEffort(t));
  if (t.repeatPer) {
    const inp = inputById(t.repeatPer);
    meta.push("one line per " + (inp ? tokenOf(inp) : t.repeatPer));
  }
  const gate = describeCond(t.showWhen);
  if (gate) meta.push(gate);
  if (Array.isArray(t.subflows) && t.subflows.length > 1) meta.push("shared by " + t.subflows.length + " subflows");

  const hrs = hoursAtDefaults(t);
  row.innerHTML =
    '<div class="act-text">' +
      '<div class="act-desc">' + esc(t.description) + '</div>' +
      '<div class="act-meta">' + esc(meta.join(" · ")) + '</div>' +
    '</div>' +
    '<span class="act-hours">' + (hrs ? hrs + "h" : "—") + '</span>';
  const actions = document.createElement("div");
  actions.className = "block-actions";
  const edit = document.createElement("button");
  edit.className = "btn-ghost";
  edit.textContent = "Edit";
  edit.onclick = () => { EDITING = { kind: "task", id: t.id }; renderAdmin(); };
  const del = document.createElement("button");
  del.className = "btn-ghost";
  del.textContent = "Delete";
  del.onclick = () => deleteTask(idx);
  actions.append(edit, del);
  row.appendChild(actions);
  return row;
}
