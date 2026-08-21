// Everything editable: the condition editor shared by three forms, the
// question form, the task form with its effort rows, and the flow settings
// and new-flow forms.
//
// Each form reads the model on open and writes it back on save; none of them
// touch GitHub. A form is identified by the id of the row it is editing, so
// reordering a list underneath it cannot leave it pointing somewhere else.

// ─── Reusable condition editor ───
// `pool` limits the picker to inputs asked earlier, so conditions cannot loop.
function renderCondEditor(container, cond, opts) {
  const o = opts || {};
  const pool = o.inputs || F().inputs;
  const mode = (cond && cond.input) ? 'answer' : 'always';
  const list = pool.map(i =>
    `<option value="${attr(i.id)}" ${cond && cond.input === i.id ? 'selected' : ''}>${esc(i.label)}</option>`
  ).join('');

  container.innerHTML = `
    <div class="choice-group">
      <label class="choice-row">
        <input type="radio" name="ce-mode" value="always" ${mode === 'always' ? 'checked' : ''} onchange="ceModeChange()" />
        <div class="choice-body"><div class="choice-title">${esc(o.alwaysLabel || 'No extra condition')}</div></div>
      </label>
      <label class="choice-row">
        <input type="radio" name="ce-mode" value="answer" ${mode === 'answer' ? 'checked' : ''} onchange="ceModeChange()" />
        <div class="choice-body">
          <div class="choice-title">Only when an earlier answer says so</div>
          <div class="choice-extra" id="ce-answer-extra" style="display:${mode === 'answer' ? 'block' : 'none'};">
            ${pool.length ? '' : '<div class="q-sub">Nothing earlier to depend on yet.</div>'}
            <select id="ce-input" onchange="ceRenderDetail()" style="margin-bottom:10px;">
              <option value="">Choose one...</option>${list}
            </select>
            <div id="ce-detail"></div>
          </div>
        </div>
      </label>
    </div>`;
  window._ceCond = cond;
  if (mode === 'answer' && cond.input) ceRenderDetail(cond);
}

function ceModeChange() {
  const mode = document.querySelector('input[name="ce-mode"]:checked').value;
  document.getElementById('ce-answer-extra').style.display = mode === 'answer' ? 'block' : 'none';
  if (mode === 'answer' && !document.getElementById('ce-detail').innerHTML) ceRenderDetail();
}

function ceRenderDetail(existing) {
  const id = document.getElementById('ce-input').value;
  const detail = document.getElementById('ce-detail');
  if (!id) { detail.innerHTML = ''; return; }
  const inp = inputById(id);
  const c = (existing && existing.input === id) ? existing
    : (window._ceCond && window._ceCond.input === id ? window._ceCond : null);

  if (inp.type === 'yesno') {
    detail.innerHTML = `<div class="q-sub">Applies whenever "${esc(inp.label)}" is switched on.</div>`;
    return;
  }
  if (inp.type === 'number') {
    detail.innerHTML = `<div class="q-sub">Applies whenever "${esc(inp.label)}" is above zero.</div>`;
    return;
  }
  const optionList = (inp.options || []).map(op =>
    `<option value="${attr(op.id)}" ${c && c.is === op.id ? 'selected' : ''}>${esc(op.label)}</option>`
  ).join('');
  const specific = !c || c.is !== undefined;
  const anyRow = inp.type === 'checklist' ? `
    <label class="choice-row">
      <input type="radio" name="ce-opt" value="any" ${!specific ? 'checked' : ''} onchange="ceToggleOptionPicker()" />
      <div class="choice-body"><div class="choice-title">When anything at all is ticked</div></div>
    </label>` : '';
  detail.innerHTML = `
    <div class="choice-group">
      <label class="choice-row">
        <input type="radio" name="ce-opt" value="specific" ${specific ? 'checked' : ''} onchange="ceToggleOptionPicker()" />
        <div class="choice-body">
          <div class="choice-title">When one specific option is chosen</div>
          <div class="choice-extra" id="ce-opt-extra" style="display:${specific ? 'block' : 'none'};">
            <select id="ce-option">${optionList}</select>
          </div>
        </div>
      </label>
      ${anyRow}
    </div>`;
}

function ceToggleOptionPicker() {
  const mode = document.querySelector('input[name="ce-opt"]:checked').value;
  document.getElementById('ce-opt-extra').style.display = mode === 'specific' ? 'block' : 'none';
}

function readCondEditor() {
  const modeEl = document.querySelector('input[name="ce-mode"]:checked');
  if (!modeEl || modeEl.value === 'always') return undefined;
  const id = document.getElementById('ce-input').value;
  if (!id) return undefined;
  const inp = inputById(id);
  if (inp.type === 'yesno') return { input: id, isOn: true };
  if (inp.type === 'number') return { input: id, moreThanZero: true };
  const which = document.querySelector('input[name="ce-opt"]:checked');
  if (which && which.value === 'any') return { input: id, anySelected: true };
  return { input: id, is: document.getElementById('ce-option').value };
}

// ─── Subflow membership editor ───
function renderSubflowPicker(container, member) {
  const f = F();
  const all = member === undefined || member === 'all';
  container.innerHTML = `
    <label class="check-row">
      <input type="checkbox" id="sf-all" ${all ? 'checked' : ''} onchange="sfToggleAll()" />
      <span>Every subflow</span>
    </label>
    <div id="sf-list" style="padding-left:24px;display:${all ? 'none' : 'block'};">
      ${f.subflows.map(s => `
        <label class="check-row">
          <input type="checkbox" data-subflow="${attr(s.id)}" ${!all && member.includes(s.id) ? 'checked' : ''} />
          <span>${esc(s.name)}</span>
        </label>`).join('')}
    </div>`;
}

function sfToggleAll() {
  document.getElementById('sf-list').style.display = document.getElementById('sf-all').checked ? 'none' : 'block';
}

function readSubflowPicker() {
  if (document.getElementById('sf-all').checked) return 'all';
  const picked = Array.from(document.querySelectorAll('#sf-list [data-subflow]'))
    .filter(el => el.checked).map(el => el.dataset.subflow);
  return picked.length ? picked : 'all';
}

// ─── Variable / question form ───
function deleteInput(idx) {
  const f = F();
  const inp = f.inputs[idx];
  const usedBy = f.tasks.filter(t =>
    (t.showWhen && t.showWhen.input === inp.id) ||
    t.repeatPer === inp.id ||
    String(t.description).includes("{" + tokenOf(inp) + "}") ||
    (t.effort || []).flatMap(e => [e.business, e.after])
      .some(a => a && typeof a === "object" && (a.per || []).some(p => p.input === inp.id))      ).length;
  const warn = usedBy ? `\n\n${count(usedBy, 'task', 'tasks')} reference it and will break until you fix them.` : '';
  if (!confirm(`Delete "${inp.label}"?${warn}`)) return;
  f.inputs.splice(idx, 1);
  EDITING = null;
  renderAdmin();
}

function renderInputForm(slot, idx) {
  const f = F();
  const existing = idx >= 0 ? f.inputs[idx] : {
    id: null, type: 'number', label: '', help: '', min: 0, max: 1000, default: 0, options: [],
  };
  window._if = existing;
  const pool = f.inputs.slice(0, idx >= 0 ? idx : f.inputs.length);

  slot.innerHTML = `
    <div class="q-card">
      <div class="field">
        <label class="field-label">Question text — what the user is asked</label>
        <input type="text" id="if-label" value="${attr(existing.label)}" placeholder="e.g. How many handsets are in scope?" />
      </div>
      <div class="field">
        <label class="field-label">Helper text (optional)</label>
        <input type="text" id="if-help" value="${attr(existing.help)}" placeholder="e.g. Count every handset being touched, new or replaced" />
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">Answer type</label>
          <select id="if-type" onchange="renderInputTypeFields()">
            <option value="number" ${existing.type === 'number' ? 'selected' : ''}>Variable — a number you can bill against</option>
            <option value="yesno" ${existing.type === 'yesno' ? 'selected' : ''}>Yes / No</option>
            <option value="checklist" ${existing.type === 'checklist' ? 'selected' : ''}>Tick any</option>
            <option value="choice" ${existing.type === 'choice' ? 'selected' : ''}>Pick one</option>
          </select>
        </div>
        <div class="field" id="if-extra-field"></div>
      </div>
      <div id="if-type-fields"></div>
      <div class="field">
        <label class="field-label">Ask it in</label>
        <div id="if-subflows"></div>
      </div>
      <div class="field">
        <label class="field-label">Ask it only if</label>
        <div id="if-cond"></div>
      </div>
      <button class="btn-primary" onclick="saveInputForm(${idx})">Save question</button>
      <button class="btn-ghost" onclick="closeForm()">Cancel</button>
    </div>`;

  renderInputTypeFields();
  renderSubflowPicker(document.getElementById('if-subflows'), existing.subflows);
  renderCondEditor(document.getElementById('if-cond'), existing.showWhen,
    { inputs: pool, alwaysLabel: 'Always ask it' });
  slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderInputTypeFields() {
  const type = document.getElementById('if-type').value;
  const e = window._if;
  const box = document.getElementById('if-type-fields');
  const extra = document.getElementById('if-extra-field');

  extra.innerHTML = type === 'number' ? `
    <label class="field-label">Variable name used in task text</label>
    <input type="text" id="if-token" value="${attr(e.token || e.id || '')}" placeholder="e.g. number of devices" />`
    : type === 'choice' ? `
    <label class="field-label">Appearance</label>
    <select id="if-display">
      <option value="" ${e.display !== 'cards' ? 'selected' : ''}>Normal radio list</option>
      <option value="cards" ${e.display === 'cards' ? 'selected' : ''}>Big cards (like a wizard step)</option>
    </select>` : '';

  if (type === 'number') {
    box.innerHTML = `
      <div class="field-row">
        <div class="field"><label class="field-label">Minimum</label><input type="number" id="if-min" value="${e.min != null ? e.min : 0}" /></div>
        <div class="field"><label class="field-label">Maximum</label><input type="number" id="if-max" value="${e.max != null ? e.max : 1000}" /></div>
        <div class="field"><label class="field-label">Starts at</label><input type="number" id="if-default" value="${e.default != null ? e.default : 0}" /></div>
      </div>`;
  } else if (type === 'yesno') {
    box.innerHTML = `
      <label class="check-row field">
        <input type="checkbox" id="if-default-toggle" ${e.default ? 'checked' : ''} />
        <span>On by default</span>
      </label>`;
  } else {
    const rows = (e.options && e.options.length ? e.options : [{ label: '' }]).map(optionRowHtml).join('');
    box.innerHTML = `
      <div class="field">
        <label class="field-label">Options</label>
        <div id="if-options">${rows}</div>
        <button class="btn-ghost" type="button" style="margin-left:0;" onclick="addOptionRow()">+ Add option</button>
      </div>`;
  }
}

function optionRowHtml(o) {
  return `
    <div class="row-editor" data-option-id="${attr(o.id || '')}">
      <input type="text" placeholder="e.g. Web chat widget" value="${attr(o.label)}" data-role="opt-label" />
      <label><input type="checkbox" data-role="opt-default" ${o.default ? 'checked' : ''} /> on by default${o.showWhen ? ' · gated' : ''}</label>
      <button class="btn-x" type="button" onclick="this.closest('.row-editor').remove()">&#10005;</button>
    </div>`;
}

function addOptionRow() {
  document.getElementById('if-options').insertAdjacentHTML('beforeend', optionRowHtml({ label: '' }));
}

function saveInputForm(idx) {
  const f = F();
  const e = window._if;
  const label = document.getElementById('if-label').value.trim();
  if (!label) { alert('Give the question some text first.'); return; }
  const type = document.getElementById('if-type').value;
  const taken = f.inputs.filter((i, n) => n !== idx).map(i => i.id);
  const id = e.id || uniqueId(slugify(label), taken);

  const next = { id, type, label };
  const help = document.getElementById('if-help').value.trim();
  if (help) next.help = help;

  if (type === 'number') {
    const token = document.getElementById('if-token').value.trim();
    if (token && token !== id) next.token = token;
    next.min = Number(document.getElementById('if-min').value);
    next.max = Number(document.getElementById('if-max').value);
    next.default = Number(document.getElementById('if-default').value);
  } else if (type === 'yesno') {
    next.default = document.getElementById('if-default-toggle').checked;
  } else {
    const displayEl = document.getElementById('if-display');
    if (displayEl && displayEl.value === 'cards') next.display = 'cards';
    const old = e.options || [];
    next.options = Array.from(document.querySelectorAll('#if-options .row-editor')).map(row => {
      const optLabel = row.querySelector('[data-role="opt-label"]').value.trim();
      const prev = old.find(o => o.id === row.dataset.optionId) || old.find(o => o.label === optLabel);
      const opt = { id: prev ? prev.id : uniqueId(slugify(optLabel), old.map(o => o.id)), label: optLabel };
      if (prev && prev.note) opt.note = prev.note;
      if (row.querySelector('[data-role="opt-default"]').checked) opt.default = true;
      if (prev && prev.showWhen) opt.showWhen = prev.showWhen;
      return opt;
    }).filter(o => o.label);
  }

  const subflows = readSubflowPicker();
  if (subflows !== 'all') next.subflows = subflows;
  const cond = readCondEditor();
  if (cond) next.showWhen = cond;

  if (idx >= 0) f.inputs[idx] = next;
  else f.inputs.push(next);
  EDITING = null;
  renderAdmin();
}

// ─── Task form ───
// A task has to come out of here shaped the way the PSE's Input_Tasks table
// wants it: a phase, a skill, a task type, counts for trips/stays/documents
// and client or subcontractor effort, and per-role hours split into business
// and after hours.
function deleteTask(idx) {
  if (!confirm(`Delete task "${F().tasks[idx].description}"?`)) return;
  F().tasks.splice(idx, 1);
  EDITING = null;
  renderAdmin();
}

// ── amount editors: a base number, optionally scaling per variable ──
function amountEditor(prefix, amount, label) {
  const a = (amount == null) ? { base: 0 } : (typeof amount === 'number' ? { base: amount } : amount);
  window._amounts[prefix] = JSON.parse(JSON.stringify(a.per || []));
  return `
    <div class="row-editor">
      <span class="rate-label">${esc(label)}</span>
      <input type="number" step="0.25" id="${prefix}-base" value="${a.base || 0}" oninput="updateTaskPreview()" />
    </div>
    <div id="${prefix}-rates" style="padding-left:18px;"></div>
    <button class="btn-ghost" type="button" style="margin-left:18px;" onclick="addAmountRate('${prefix}')">+ Scale with a variable</button>`;
}

function renderAmountRates(prefix) {
  const box = document.getElementById(prefix + '-rates');
  if (!box) return;
  const numbers = numberInputs();
  box.innerHTML = (window._amounts[prefix] || []).map((r, n) => `
    <div class="row-editor" data-rate="${n}">
      <span class="rate-label" style="flex:0 0 auto;">plus</span>
      <input type="number" step="0.25" data-role="rate-each" value="${r.each}"
             oninput="readAmountRates('${prefix}');updateTaskPreview()" />
      <select data-role="rate-input" onchange="readAmountRates('${prefix}');updateTaskPreview()" style="flex:1;">
        ${numbers.map(i => `<option value="${attr(i.id)}" ${r.input === i.id ? 'selected' : ''}>per ${esc(tokenOf(i))}</option>`).join('')}
      </select>
      <button class="btn-x" type="button" onclick="removeAmountRate('${prefix}',${n})">&#10005;</button>
    </div>`).join('');
}

function readAmountRates(prefix) {
  const box = document.getElementById(prefix + '-rates');
  if (!box) return;
  window._amounts[prefix] = Array.from(box.querySelectorAll('.row-editor')).map(row => ({
    input: row.querySelector('[data-role="rate-input"]').value,
    each: Number(row.querySelector('[data-role="rate-each"]').value),
  }));
}

function addAmountRate(prefix) {
  const numbers = numberInputs();
  if (!numbers.length) { alert('Add a number variable first, then hours can scale with it.'); return; }
  readAmountRates(prefix);
  window._amounts[prefix].push({ input: numbers[0].id, each: 0 });
  renderAmountRates(prefix);
  updateTaskPreview();
}

function removeAmountRate(prefix, n) {
  readAmountRates(prefix);
  window._amounts[prefix].splice(n, 1);
  renderAmountRates(prefix);
  updateTaskPreview();
}

function readAmount(prefix) {
  const baseEl = document.getElementById(prefix + '-base');
  if (!baseEl) return undefined;
  const base = Number(baseEl.value || 0);
  readAmountRates(prefix);
  const per = (window._amounts[prefix] || []).filter(r => r.input && r.each);
  if (!base && !per.length) return undefined;
  return per.length ? { base, per } : base;
}

function amountAtDefaults(prefix) {
  const baseEl = document.getElementById(prefix + '-base');
  if (!baseEl) return 0;
  let total = Number(baseEl.value || 0);
  (window._amounts[prefix] || []).forEach(r => {
    const inp = inputById(r.input);
    const dflt = inp ? (inp.default != null ? inp.default : (inp.min || 0)) : 0;
    total += Number(dflt) * Number(r.each || 0);
  });
  return round2(total);
}

// ── the form itself ──
function renderTaskForm(slot, idx, section) {
  const f = F();
  const existing = idx >= 0 ? f.tasks[idx] : {
    id: null, phase: CONFIG.phases[0], description: '',
    skill: (CONFIG.skills || [])[0], taskType: (CONFIG.taskTypes || [])[0],
    subflows: section.shared ? 'all' : [section.id], effort: [],
  };
  window._tf = existing;
  window._amounts = {};
  window._tfEffort = JSON.parse(JSON.stringify(existing.effort || []));

  slot.innerHTML = `
    <div class="q-card" style="margin-top:8px;">
      <div class="field">
        <label class="field-label">Description</label>
        <textarea id="tf-description" placeholder="e.g. Enroll {number of devices} handsets to MDM">${esc(existing.description)}</textarea>
        <div class="q-sub" style="margin-top:8px;" id="tf-chips"></div>
      </div>

      <!-- The hours are what the task is for, so they lead, and the repeat
           sits with them because it multiplies them. -->
      <div class="tf-hours">
        <div class="tf-hours-head">
          <div>
            <div class="tf-hours-title">Who does the work, and for how long</div>
            <div class="q-sub">Add a line per role. Hours can scale with a variable.</div>
          </div>
          <div>
            <div class="stat-label">Per line</div>
            <div id="tf-hours-total" class="tf-hours-figure">&mdash;</div>
          </div>
        </div>
        <div id="tf-effort"></div>
        <button class="btn-secondary" type="button" onclick="addEffortLine()">+ Add resource</button>

        <div class="tf-hours-repeat">
          <label class="field-label">How many lines</label>
          <select id="tf-repeat" onchange="updateTaskPreview()">
            <option value="">Just one line</option>
            ${numberInputs().map(i => `<option value="${attr(i.id)}" ${existing.repeatPer === i.id ? 'selected' : ''}>One line per ${esc(tokenOf(i))}</option>`).join('')}
          </select>
          <div class="q-sub" style="margin-top:6px;">
            One line per variable repeats the whole task, hours and all. Put {#} in the
            description to number the lines.
          </div>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-label">Phase</label>
          <select id="tf-phase">${CONFIG.phases.map(p => `<option ${existing.phase === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
        </div>
        <div class="field">
          <label class="field-label">Skill required</label>
          <select id="tf-skill">${(CONFIG.skills || []).map(s => `<option ${existing.skill === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field">
        <label class="field-label">Task type</label>
        <select id="tf-tasktype" onchange="updateTaskPreview()">${(CONFIG.taskTypes || []).map(t => `<option ${existing.taskType === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
      </div>

      <div class="field">
        <label class="field-label">Include it in</label>
        <div id="tf-subflows"></div>
      </div>
      <div class="field">
        <label class="field-label">Include it only if</label>
        <div id="tf-cond"></div>
      </div>

      <div class="q-sub" id="tf-preview" style="margin-bottom:12px;"></div>
      <button class="btn-primary" onclick="saveTaskForm(${idx})">Save task</button>
      <button class="btn-ghost" onclick="closeForm()">Cancel</button>
    </div>`;

  renderChips();
  renderEffortLines();
  renderSubflowPicker(document.getElementById('tf-subflows'), existing.subflows);
  renderCondEditor(document.getElementById('tf-cond'), existing.showWhen, { alwaysLabel: 'No extra condition' });
  updateTaskPreview();
  slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderChips() {
  // No guard here on purpose. This used to return quietly when the container
  // was missing, so the variable chips silently never appeared and the real
  // fault -- a form being drawn before its slot was attached -- stayed hidden
  // for as long as it did. Let it be loud.
  const box = document.getElementById('tf-chips');
  box.innerHTML = 'Insert a variable: ' + numberInputs().map(i =>
    `<span class="chip" onclick="insertToken('${attr(tokenOf(i))}')">{${esc(tokenOf(i))}}</span>`
  ).join('') + '<span class="chip chip--ghost" onclick="createVariableInline()">+ New variable</span>' +
  '<span class="chip chip--ghost" onclick="insertToken(\'#\')">{#} line number</span>';
}

function renderEffortLines() {
  const f = F();
  const box = document.getElementById('tf-effort');
  const roles = CONFIG.roles || [];
  box.innerHTML = window._tfEffort.map((e, n) => `
    <div class="q-card" style="background:rgba(255,255,255,0.02);margin-bottom:10px;" data-effort="${n}">
      <div class="row-editor">
        <select data-role="eff-role" onchange="readEffortLines();updateTaskPreview()" style="flex:1;">
          ${roles.map(r => `<option value="${attr(r.id)}" ${e.role === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}
        </select>
        <select data-role="eff-location" onchange="readEffortLines()" style="flex:0 0 150px;">
          ${CONFIG.locations.map(l => `<option ${e.location === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}
        </select>
        <button class="btn-x" type="button" onclick="removeEffortLine(${n})">&#10005;</button>
      </div>
      ${amountEditor('tf-eff' + n + '-bh', e.business, 'Business hours')}
      ${amountEditor('tf-eff' + n + '-ah', e.after, 'After hours')}
    </div>`).join('');
  if (!window._tfEffort.length) {
    box.innerHTML = '<div class="q-sub" style="font-style:italic;color:var(--muted);margin-bottom:8px;">No effort costed against this task yet.</div>';
  }
  window._tfEffort.forEach((e, n) => {
    renderAmountRates('tf-eff' + n + '-bh');
    renderAmountRates('tf-eff' + n + '-ah');
  });
}

function readEffortLines() {
  const box = document.getElementById('tf-effort');
  const rows = Array.from(box.querySelectorAll('[data-effort]'));
  window._tfEffort = rows.map((row, n) => ({
    role: row.querySelector('[data-role="eff-role"]').value,
    location: row.querySelector('[data-role="eff-location"]').value,
    business: readAmount('tf-eff' + n + '-bh'),
    after: readAmount('tf-eff' + n + '-ah'),
  }));
  return window._tfEffort;
}

function addEffortLine() {
  const roles = CONFIG.roles || [];
  if (!roles.length) { alert('No engineer roles are set up, so there is nobody to assign this to.'); return; }
  if (document.querySelector('[data-effort]')) readEffortLines();
  const used = window._tfEffort.map(e => e.role);
  const next = roles.find(r => !used.includes(r.id)) || roles[0];
  const startAt = (window._tf && window._tf.defaultLocation) || CONFIG.locations[0];
  window._tfEffort.push({ role: next.id, location: startAt, business: 0, after: 0 });
  renderEffortLines();
  updateTaskPreview();
}

function removeEffortLine(n) {
  readEffortLines();
  window._tfEffort.splice(n, 1);
  renderEffortLines();
  updateTaskPreview();
}

function updateTaskPreview() {
  const box = document.getElementById('tf-preview');
  if (!box) return;
  const rows = Array.from(document.querySelectorAll('[data-effort]'));
  let hours = 0;
  const bits = [];
  rows.forEach((row, n) => {
    const roleId = row.querySelector('[data-role="eff-role"]').value;
    const bh = amountAtDefaults('tf-eff' + n + '-bh');
    const ah = amountAtDefaults('tf-eff' + n + '-ah');
    hours += bh + ah;
    const r = (CONFIG.roles || []).find(r => r.id === roleId);
    bits.push(`${r ? r.id : roleId} ${bh}h${ah ? ' + ' + ah + 'h after' : ''}`);
  });
  // The figure in the panel head, so the number is visible while you type it
  // rather than only in the sentence underneath.
  const badge = document.getElementById('tf-hours-total');
  if (badge) badge.textContent = hours ? round2(hours) + 'h' : '\u2014';

  const repeat = document.getElementById('tf-repeat').value;
  let text = hours
    ? `At the current defaults: ${bits.join(', ')} = ${round2(hours)}h per line.`
    : 'At the current defaults: nothing costed yet.';
  if (repeat) {
    const inp = inputById(repeat);
    const n = inp ? (inp.default != null ? inp.default : (inp.min || 0)) : 0;
    text += ` Repeated ${n} times, that is ${round2(hours * n)}h.`;
  }
  box.textContent = text;
}

// Drops {token} in at the caret, so a variable can be woven into the text.
function insertToken(token) {
  const box = document.getElementById('tf-description');
  const at = box.selectionStart != null ? box.selectionStart : box.value.length;
  const text = '{' + token + '}';
  box.value = box.value.slice(0, at) + text + box.value.slice(box.selectionEnd != null ? box.selectionEnd : at);
  box.focus();
  box.selectionStart = box.selectionEnd = at + text.length;
}

// Creates a variable without leaving the task being written.
function createVariableInline() {
  const label = prompt('What is the user asked?', 'How many devices are in scope?');
  if (!label || !label.trim()) return;
  const token = prompt('Short name to use inside task text:', 'number of devices');
  if (!token || !token.trim()) return;
  const dflt = Number(prompt('Starting value:', '1'));
  const f = F();
  const id = uniqueId(slugify(token), f.inputs.map(i => i.id));
  const input = { id, type: 'number', label: label.trim(), min: 0, max: 100000, default: isNaN(dflt) ? 0 : dflt };
  if (token.trim() !== id) input.token = token.trim();
  f.inputs.push(input);
  insertToken(tokenOf(input));
  renderChips();
  readEffortLines();
  renderEffortLines();
  updateTaskPreview();
}

function saveTaskForm(idx) {
  const f = F();
  const e = window._tf;
  const description = document.getElementById('tf-description').value.trim();
  if (!description) { alert('Give the task a description first.'); return; }

  const repeat = document.getElementById('tf-repeat').value;
  const effort = readEffortLines().filter(x => x.business || x.after);

  const roles = effort.map(x => x.role);
  if (roles.length !== new Set(roles).size) {
    alert('Each resource can only appear once on a task. Merge the duplicate rows.');
    return;
  }

  // The PSE only has five resource columns, so the flow cannot use more
  // than five distinct roles across all of its tasks.
  const others = new Set();
  f.tasks.forEach((t, n) => { if (n !== idx) (t.effort || []).forEach(x => others.add(x.role)); });
  roles.forEach(r => others.add(r));
  if (others.size > 5) {
    alert(`That would take this flow to ${others.size} different resources, but the PSE only has five resource columns. Reuse one of the roles already in play.`);
    return;
  }

  const next = {
    id: e.id || uniqueId(slugify(description), f.tasks.filter((t, n) => n !== idx).map(t => t.id)),
    phase: document.getElementById('tf-phase').value,
    skill: document.getElementById('tf-skill').value,
    taskType: document.getElementById('tf-tasktype').value,
    description,
  };

  next.subflows = readSubflowPicker();
  if (repeat) next.repeatPer = repeat;
  const cond = readCondEditor();
  if (cond) next.showWhen = cond;

  // A repeating task already emits one line per unit, so scaling a line by
  // that same unit would count the effort twice.
  const clashes = [];
  const amounts = effort.flatMap(x => [x.business, x.after]);
  amounts.forEach(a => {
    if (a && typeof a === 'object') (a.per || []).forEach(p => { if (p.input === repeat) clashes.push(p.input); });
  });
  if (clashes.length) {
    const inp = inputById(clashes[0]);
    alert(`This task already emits one line per ${inp ? tokenOf(inp) : clashes[0]}, so scaling each line by that same variable would double count. Remove one of the two.`);
    return;
  }

  next.effort = effort;
  if (idx >= 0) f.tasks[idx] = next;
  else f.tasks.push(next);
  EDITING = null;
  renderAdmin();
}

// ─── Flow settings and new flows ───
function openFlowSettings() { EDITING = { kind: 'flow' }; renderAdmin(); }
function openNewFlow() { EDITING = { kind: 'new-flow' }; renderAdmin(); }

function renderNewFlowForm(slot) {
  slot.innerHTML = `
    <div class="q-card">
      <div class="q-label" style="margin-bottom:12px;">Start a new flow</div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">Name</label>
          <input type="text" id="nf-name" placeholder="e.g. Spectralink Handsets" />
        </div>
        <div class="field">
          <label class="field-label">Solution vertical</label>
          <select id="nf-vertical">${CONFIG.verticals.map(v => `<option value="${attr(v.id)}">${esc(v.name)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field">
        <label class="field-label">How many subflows?</label>
        <div class="stepper" style="display:flex;align-items:center;gap:12px;">
          <button class="btn-ghost" type="button" style="margin:0;" onclick="stepSubflowCount(-1)">&minus;</button>
          <span id="nf-count" style="font-size:18px;font-weight:700;color:var(--cyan);min-width:22px;text-align:center;">3</span>
          <button class="btn-ghost" type="button" style="margin:0;" onclick="stepSubflowCount(1)">+</button>
        </div>
        <div class="q-sub" style="margin-top:6px;">The variations of this work, e.g. a new install versus an upgrade.</div>
      </div>
      <div class="field" id="nf-names"></div>
      <button class="btn-primary" onclick="createFlow()">Create flow</button>
      <button class="btn-ghost" onclick="closeForm()">Cancel</button>
    </div>`;
  window._nfCount = 3;
  renderSubflowNameFields();
  slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function stepSubflowCount(delta) {
  // Keep whatever has been typed before redrawing the list.
  const typed = Array.from(document.querySelectorAll('#nf-names [data-sf]')).map(el => el.value);
  window._nfCount = Math.max(1, Math.min(12, window._nfCount + delta));
  document.getElementById('nf-count').textContent = window._nfCount;
  renderSubflowNameFields(typed);
}

function renderSubflowNameFields(typed) {
  const box = document.getElementById('nf-names');
  let html = '<label class="field-label">Name each subflow</label>';
  for (let n = 0; n < window._nfCount; n++) {
    html += `<input type="text" data-sf="${n}" value="${attr((typed && typed[n]) || '')}" placeholder="${['e.g. New install', 'e.g. Add handsets', 'e.g. Upgrade handsets'][n] || 'e.g. Another variation'}" style="margin-bottom:8px;" />`;
  }
  box.innerHTML = html;
}

function createFlow() {
  const name = document.getElementById('nf-name').value.trim();
  if (!name) { alert('Give the flow a name first.'); return; }
  const names = Array.from(document.querySelectorAll('#nf-names [data-sf]'))
    .map(el => el.value.trim()).filter(Boolean);
  if (!names.length) { alert('Name at least one subflow first.'); return; }

  const id = uniqueId(slugify(name), CONFIG.flows.map(f => f.id));
  const subIds = [];
  // Phases, locations and the column blocks come from the config, not from
  // here: they are the same for every flow.
  const flow = {
    id,
    name,
    vertical: document.getElementById('nf-vertical').value,
    note: '',
    enabled: true,
    subflows: names.map(n => {
      const sid = uniqueId(slugify(n), subIds);
      subIds.push(sid);
      return { id: sid, name: n };
    }),
    inputs: [],
    tasks: [],
  };
  CONFIG.flows.push(flow);
  switchFlow(id);
  EXPANDED.add(`${id}:sec:all`);
  renderAdmin();
}

function renderFlowForm(slot) {
  const f = F();
  slot.innerHTML = `
    <div class="q-card">
      <div class="field-row">
        <div class="field">
          <label class="field-label">Name</label>
          <input type="text" id="ff-name" value="${attr(f.name)}" placeholder="e.g. Spectralink Handsets" />
        </div>
        <div class="field">
          <label class="field-label">Solution vertical</label>
          <select id="ff-vertical">${CONFIG.verticals.map(v =>
            `<option value="${attr(v.id)}" ${f.vertical === v.id ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">Note shown on the card</label>
          <input type="text" id="ff-note" value="${attr(f.note)}" placeholder="e.g. Handset rollouts and upgrades" />
        </div>
        <div class="field">
          <label class="field-label">What to call this step in the builder</label>
          <input type="text" id="ff-subflow-label" value="${attr(f.subflowLabel || '')}" placeholder="Type of work" />
        </div>
      </div>
      <label class="check-row field">
        <input type="checkbox" id="ff-enabled" ${f.enabled !== false ? 'checked' : ''} />
        <span>Selectable in the builder (untick to hide it while you build it out)</span>
      </label>

      <div class="field">
        <label class="field-label">Subflows, in the order they are offered</label>
        <div class="q-sub" style="margin-bottom:8px;">Drag a row to reorder it.</div>
        <div id="ff-subflows">${f.subflows.map(s => `
          <div class="row-editor" data-sub-id="${attr(s.id)}">
            <input type="text" value="${attr(s.name)}" data-role="sub-name" placeholder="e.g. New install" />
            <button class="btn-x" type="button" onclick="removeSubflowRow(this)">&#10005;</button>
          </div>`).join('')}</div>
        <button class="btn-ghost" type="button" style="margin-left:0;" onclick="addSubflowRow()">+ Add subflow</button>
      </div>

      <div class="q-sub" style="margin-bottom:14px;">
        Phases, locations and the spreadsheet columns are fixed by the PSE, so they
        are the same for every flow and are not editable here.
      </div>
      <button class="btn-primary" onclick="saveFlowForm()">Save flow</button>
      <button class="btn-ghost" onclick="closeForm()">Cancel</button>
      ${CONFIG.flows.length > 1 ? '<button class="btn-ghost" onclick="deleteFlow()">Delete flow</button>' : ''}
    </div>`;
  wireSubflowDrag();
  slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function addSubflowRow() {
  document.getElementById('ff-subflows').insertAdjacentHTML('beforeend', `
    <div class="row-editor" data-sub-id="">
      <input type="text" value="" data-role="sub-name" placeholder="New subflow" />
      <button class="btn-x" type="button" onclick="removeSubflowRow(this)">&#10005;</button>
    </div>`);
  wireSubflowDrag();
}

function removeSubflowRow(btn) {
  const row = btn.closest('.row-editor');
  const id = row.dataset.subId;
  if (id) {
    const used = F().tasks.filter(t => Array.isArray(t.subflows) && t.subflows.includes(id)).length;
    if (used && !confirm(`${count(used, 'task', 'tasks')} belong only to this subflow and will be left stranded. Remove it anyway?`)) return;
  }
  row.remove();
}

function saveFlowForm() {
  const f = F();
  const name = document.getElementById('ff-name').value.trim();
  if (!name) { alert('Give the flow a name first.'); return; }
  const subIds = [];
  const subflows = Array.from(document.querySelectorAll('#ff-subflows .row-editor')).map(row => {
    const subName = row.querySelector('[data-role="sub-name"]').value.trim();
    if (!subName) return null;
    const id = row.dataset.subId || uniqueId(slugify(subName), f.subflows.map(s => s.id).concat(subIds));
    subIds.push(id);
    const prev = f.subflows.find(s => s.id === id);
    return prev ? Object.assign({}, prev, { name: subName }) : { id, name: subName };
  }).filter(Boolean);
  if (!subflows.length) { alert('Name at least one subflow first.'); return; }

  // Tasks and inputs pointing at a removed subflow would silently vanish,
  // so they fall back to every subflow instead.
  const kept = subflows.map(s => s.id);
  [f.tasks, f.inputs].forEach(list => list.forEach(item => {
    if (!Array.isArray(item.subflows)) return;
    const trimmed = item.subflows.filter(id => kept.includes(id));
    if (!trimmed.length) delete item.subflows;
    else item.subflows = trimmed;
  }));

  f.name = name;
  f.vertical = document.getElementById('ff-vertical').value;
  f.note = document.getElementById('ff-note').value.trim();
  const subflowLabel = document.getElementById('ff-subflow-label').value.trim();
  if (subflowLabel) f.subflowLabel = subflowLabel; else delete f.subflowLabel;
  f.enabled = document.getElementById('ff-enabled').checked;
  f.subflows = subflows;
  CONFIG.phases = phases;
  CONFIG.locations = locations;
  f.columns = columns;
  EDITING = null;
  renderAdmin();
}

function deleteFlow() {
  const f = F();
  if (!confirm(`Delete the whole "${f.name}" flow, including its ${count(f.inputs.length, 'input', 'inputs')} and ${count(f.tasks.length, 'task', 'tasks')}?`)) return;
  CONFIG.flows = CONFIG.flows.filter(x => x.id !== f.id);
  switchFlow(CONFIG.flows.length ? CONFIG.flows[0].id : null);
}
