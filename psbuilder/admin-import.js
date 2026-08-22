// Reading a block pasted out of a PSE and turning it into tasks.
//
// The parsing itself is in engine.js, next to the code that writes those
// blocks, so the two cannot disagree. This is the review over the top: what
// was read, what needs a look, which role each resource column was, and
// which subflow each row belongs in.

// ─── Import ───
// Reads a block copied out of a PSE and turns it into tasks. The parsing
// lives in engine.js; this is the review and mapping over the top of it.
let IMPORT = null;

function toggleImport() {
  const f = F();
  if (!f) return;
  const opening = !IMPORT;
  if (opening) closeOtherPanels('import');
  IMPORT = opening ? { text: '', result: null, rows: [] } : null;
  renderAdmin();
}

function readImportPaste() {
  const text = document.getElementById('im-text').value;
  const f = F();
  const result = PSEngine.readPaste(text, CONFIG, f.tasks.map(t => t.description));
  IMPORT.text = text;
  IMPORT.result = result;
  // Only the slots that actually carry hours need a role choosing.
  const slots = new Set();
  result.drafts.forEach(dr => (dr.effort || []).forEach(e => slots.add(e.slot)));
  IMPORT.slots = [...slots].sort((a, b) => a - b);
  // Left unset on purpose: guessing the role would mis-cost the work.
  IMPORT.slotRoles = {};
  // A row that already exists starts unticked, so nothing is doubled by
  // accident; everything else starts ticked.
  IMPORT.rows = result.drafts.map(dr => ({
    include: !dr.issues.some(i => i.kind === 'duplicate' || i.kind === 'repeated'),
    description: dr.description,
    phase: dr.phase,
    skill: dr.skill,
    taskType: dr.taskType,
    subflows: 'all',
    effort: dr.effort || [],
    issues: dr.issues,
    row: dr.row,
  }));
  renderAdmin();
}

function setSlotRole(slot, role) {
  if (role) IMPORT.slotRoles[slot] = role; else delete IMPORT.slotRoles[slot];
  renderAdmin();
}

// Which columns still have nobody against them. Choosing to drop the hours
// counts as answered -- effortFromSlots ignores 'none' the same way it ignores
// an unknown role, but the difference is that it was chosen.
function unresolvedSlots() {
  return (IMPORT.slots || []).filter(s => !IMPORT.slotRoles[s]);
}

function droppedSlots() {
  return (IMPORT.slots || []).filter(s => IMPORT.slotRoles[s] === 'none');
}

// How many hour entries will actually come across, given the mapping so far.
function mappedEffortCount() {
  return IMPORT.rows.reduce((n, r) => n + (r.include
    ? PSEngine.effortFromSlots(r.effort, IMPORT.slotRoles).length : 0), 0);
}

function setImportField(n, field, value) {
  IMPORT.rows[n][field] = value;
}

function toggleImportRow(n, on) {
  IMPORT.rows[n].include = on;
  const tr = document.querySelector('[data-im-row="' + n + '"]');
  if (tr) tr.classList.toggle('is-skipped', !on);
  updateImportCount();
}

function setImportAll(on) {
  IMPORT.rows.forEach((r, n) => { r.include = on; });
  renderAdmin();
}

// Sets every row at once, which is the common case; a row can still be
// moved on its own afterwards.
function setImportSubflowAll(value) {
  IMPORT.rows.forEach(r => { r.subflows = value; });
  renderAdmin();
}

function updateImportCount() {
  const btn = document.getElementById('im-add');
  if (!btn) return;
  const n = IMPORT.rows.filter(r => r.include).length;
  const hours = mappedEffortCount();
  const waiting = unresolvedSlots();
  if (waiting.length) {
    btn.textContent = 'Say whose hours R' + waiting.join(', R') + ' ' +
      (waiting.length === 1 ? 'is' : 'are') + ' first';
    btn.disabled = true;
    return;
  }
  btn.textContent = (n === 1 ? 'Add 1 task' : 'Add ' + n + ' tasks')
    + (hours ? ' with ' + hours + ' hour entr' + (hours === 1 ? 'y' : 'ies') : '');
  btn.disabled = n === 0;
}

function commitImport() {
  const f = F();
  const chosen = IMPORT.rows.filter(r => r.include);
  if (!chosen.length) { alert('Tick at least one row before adding.'); return; }
  const taken = f.tasks.map(t => t.id);
  chosen.forEach(r => {
    const description = String(r.description).trim();
    if (!description) return;
    const id = uniqueId(slugify(description), taken);
    taken.push(id);
    f.tasks.push({
      id, phase: r.phase, skill: r.skill, taskType: r.taskType,
      description, subflows: r.subflows === 'all' ? 'all' : [r.subflows],
      // Slots become roles here; an unmapped slot brings no hours.
      effort: PSEngine.effortFromSlots(r.effort, IMPORT.slotRoles),
    });
  });
  IMPORT = null;
  EXPANDED.add(F().id + ':sec:all');
  renderAdmin();
}

function renderImport() {
  const slot = document.getElementById('import-slot');
  slot.innerHTML = '';
  if (!IMPORT) return;
  const f = F();

  const card = document.createElement('div');
  card.className = 'q-card';
  card.innerHTML = `
    <div class="row-editor" style="margin-bottom:4px;">
      <span class="q-label" style="flex:1;margin:0;">Read tasks out of a PSE</span>
      <button class="btn-x" onclick="toggleImport()" title="Close">&#10005;</button>
    </div>
    <div class="q-sub">Select the task rows in <b>Project Technical Tasks</b> and copy them, then paste here.
      Either the four task-detail columns, or the full width including the resource hours, or just the descriptions.</div>
    <div class="field" style="margin-top:12px;">
      <label class="field-label" for="im-text">Pasted rows</label>
      <textarea id="im-text" style="min-height:120px;font-family:\'SFMono-Regular\', Consolas, monospace;font-size:12px;"
        placeholder="Design\tCollaboration\tArchiTech Activity\tWxCC — Existing Environment Review">${esc(IMPORT.text)}</textarea>
    </div>
    <button class="btn-secondary" onclick="readImportPaste()">Read these rows</button>
    <div id="im-result"></div>`;
  slot.appendChild(card);

  if (IMPORT.result) renderImportResult(document.getElementById('im-result'), f);
  slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderImportResult(box, f) {
  const res = IMPORT.result;
  if (!IMPORT.rows.length) {
    box.innerHTML = `<div class="im-note">${esc(res.cols.note)}
      ${res.rows ? ' Nothing usable came out of ' + count(res.rows, 'row', 'rows') + '.' : ''}</div>`;
    return;
  }

  const subflowOptions = (selected) =>
    `<option value="all" ${selected === 'all' ? 'selected' : ''}>All subflows</option>` +
    f.subflows.map(s => `<option value="${attr(s.id)}" ${selected === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  const listOptions = (list, selected) =>
    list.map(v => `<option ${v === selected ? 'selected' : ''}>${esc(v)}</option>`).join('');

  const rows = IMPORT.rows.map((r, n) => `
    <tr data-im-row="${n}" class="${r.include ? '' : 'is-skipped'}">
      <td><input type="checkbox" ${r.include ? 'checked' : ''} onchange="toggleImportRow(${n}, this.checked)"
        aria-label="Include row ${r.row}" /></td>
      <td class="im-desc"><input type="text" value="${attr(r.description)}"
        onchange="setImportField(${n}, \'description\', this.value)" aria-label="Description for row ${r.row}" />
        ${r.issues.length ? `<div class="notice notice--inline">${r.issues.map(i => esc(i.note)).join('<br>')}</div>` : ''}</td>
      <td><select onchange="setImportField(${n}, \'phase\', this.value)" aria-label="Phase for row ${r.row}">${listOptions(CONFIG.phases, r.phase)}</select></td>
      <td><select onchange="setImportField(${n}, \'skill\', this.value)" aria-label="Skill for row ${r.row}">${listOptions(CONFIG.skills, r.skill)}</select></td>
      <td><select onchange="setImportField(${n}, \'taskType\', this.value)" aria-label="Task type for row ${r.row}">${listOptions(CONFIG.taskTypes, r.taskType)}</select></td>
      <td><select onchange="setImportField(${n}, \'subflows\', this.value)" aria-label="Subflow for row ${r.row}">${subflowOptions(r.subflows)}</select></td>
      <td class="num" style="white-space:nowrap;">${r.effort.length
        ? r.effort.map(e => `R${e.slot} ${e.business ? e.business + 'h' : ''}${e.after ? ' +' + e.after + 'h AH' : ''}`).join('<br>')
        : '<span style="color:var(--muted);">&mdash;</span>'}</td>
    </tr>`).join('');

  // The hours are the reason to paste the full width rather than four columns,
  // so this reads like the hours panel in the task form rather than like a
  // setting. Dropping them is a choice in the list, not what happens when a
  // dropdown goes unnoticed.
  const roleOptions = (slot) =>
    `<option value="">Whose hours are these?</option>` +
    (CONFIG.roles || []).map(role =>
      `<option value="${attr(role.id)}" ${IMPORT.slotRoles[slot] === role.id ? 'selected' : ''}>${esc(role.name)}</option>`).join('')
    + `<option value="none" ${IMPORT.slotRoles[slot] === 'none' ? 'selected' : ''}>Do not bring these hours</option>`;

  const summary = PSEngine.slotSummary(IMPORT.rows.filter(r => r.include));
  const describe = (s) => {
    if (!s || !s.hours) return 'no hours';
    const bits = [s.hours + 'h across ' + count(s.rows, 'task', 'tasks')];
    if (s.after) bits.push(s.after + 'h of it after hours');
    if (s.locations.length) bits.push(s.locations.join(' and '));
    return bits.join(' · ');
  };

  const willCross = mappedEffortCount();
  const dropping = droppedSlots();
  const slotPickers = (IMPORT.slots || []).length ? `
    <div class="tf-hours">
      <div class="tf-hours-head">
        <div>
          <div class="tf-hours-title">Whose hours are these?</div>
          <div class="q-sub">The sheet keeps the role for each resource column on row 41, not in the
            rows, so the paste cannot say. Name each one and the hours come across with the tasks.</div>
        </div>
        <div>
          <div class="stat-label">Entries</div>
          <div id="im-hours-total" class="tf-hours-figure">${willCross}</div>
        </div>
      </div>
      ${IMPORT.slots.map(slot => {
        const s = summary.find(x => x.slot === slot);
        return `
        <div class="row-editor">
          <span class="rate-label" style="flex:1;">
            <b>R${slot}</b> &mdash; ${esc(describe(s))}
          </span>
          <select onchange="setSlotRole(${slot}, this.value)" style="flex:0 0 240px;">${roleOptions(slot)}</select>
        </div>`;
      }).join('')}
      ${dropping.length ? `<div class="q-sub" style="margin-top:8px;">R${dropping.join(', R')}
        will be left behind, as asked.</div>` : ''}
    </div>` : '';

  const unmappedNote = '';

  const flagged = IMPORT.rows.filter(r => r.issues.length).length;
  box.innerHTML = `
    <div class="im-note">${esc(res.cols.note)}
      ${res.skipped ? ' ' + count(res.skipped, 'row', 'rows') + ' had no description and were left out.' : ''}
      ${flagged ? ' ' + count(flagged, 'row needs', 'rows need') + ' a look, marked below.' : ''}</div>
    ${slotPickers}${unmappedNote}
    <div class="row-editor">
      <span class="rate-label" style="flex:0 0 auto;">Put them all in</span>
      <select onchange="setImportSubflowAll(this.value)" style="flex:0 0 220px;">${subflowOptions('all')}</select>
      <button class="btn-ghost" onclick="setImportAll(true)">Tick all</button>
      <button class="btn-ghost" onclick="setImportAll(false)">Untick all</button>
    </div>
    <div class="scroll-x">
      <table class="data-table">
        <tr><th></th><th>Description</th><th>Phase</th><th>Skill</th><th>Task type</th><th>Goes in</th><th>Hours read</th></tr>
        ${rows}
      </table>
    </div>
    <button class="btn-primary" id="im-add" onclick="commitImport()">Add tasks</button>
    <button class="btn-ghost" onclick="toggleImport()">Cancel</button>`;
  updateImportCount();
}
