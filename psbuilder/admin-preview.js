// The preview: what the builder would produce for the flow being edited.
//
// Runs engine.js, the same code the builder runs, so what shows here cannot
// flatter the authoring.

// ─── Preview ───
// Runs engine.js against the flow being edited, so what shows here is what
// the builder would produce. PREVIEW holds the answers being tried out.
let PREVIEW = null;

function togglePreview() {
  const f = F();
  if (!f) return;
  PREVIEW = PREVIEW ? null : { subflow: f.subflows[0] && f.subflows[0].id, answers: {} };
  renderAdmin();
}

function setPreviewSubflow(id) {
  PREVIEW.subflow = id;
  PREVIEW.answers = {};
  renderAdmin();
}

// Typed straight into the box, so it has to be held inside the range the
// question declares rather than trusted.
function clampAnswer(id, raw) {
  const inp = inputById(id);
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return (inp && inp.min) || 0;
  const lo = inp && inp.min != null ? inp.min : 0;
  const hi = inp && inp.max != null ? inp.max : 100000;
  return Math.max(lo, Math.min(hi, n));
}

function setPreviewAnswer(id, value) {
  PREVIEW.answers[id] = value;
  renderAdmin();
}

function togglePreviewOption(inputId, optionId, on) {
  const current = PREVIEW.answers[inputId];
  const list = Array.isArray(current) ? current.slice() : null;
  const base = list || PSEngine.resolve(F(), PREVIEW.subflow, PREVIEW.answers)[inputId] || [];
  const next = new Set(base);
  if (on) next.add(optionId); else next.delete(optionId);
  PREVIEW.answers[inputId] = [...next];
  renderAdmin();
}

function renderPreview() {
  const slot = document.getElementById('preview-slot');
  slot.innerHTML = '';
  if (!PREVIEW) return;
  const f = F();
  if (!f.subflows.length) { slot.innerHTML = '<div class="q-card">Add a subflow first.</div>'; return; }

  const out = PSEngine.estimate(CONFIG, f, PREVIEW.subflow, PREVIEW.answers);
  const card = document.createElement('div');
  card.className = 'q-card';

  const subflowPicker = f.subflows.map(s =>
    `<option value="${attr(s.id)}" ${PREVIEW.subflow === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');

  card.innerHTML = `
    <div class="row-editor" style="margin-bottom:4px;">
      <span class="q-label" style="flex:1;margin:0;">Preview</span>
      <select onchange="setPreviewSubflow(this.value)" style="flex:0 0 220px;">${subflowPicker}</select>
      <button class="btn-ghost" onclick="PREVIEW.answers={};renderAdmin()">Reset answers</button>
      <button class="btn-x" onclick="togglePreview()" title="Close">&#10005;</button>
    </div>
    <div class="q-sub">Exactly what the builder would produce for this subflow, run through the same engine.</div>
    <div class="pv-answers" id="pv-answers"></div>
    <div id="pv-result"></div>`;
  slot.appendChild(card);

  renderPreviewAnswers(document.getElementById('pv-answers'), out.resolved);
  renderPreviewResult(document.getElementById('pv-result'), out);
}

// Compact controls, so the effect of an answer can be seen immediately.
function renderPreviewAnswers(box, resolved) {
  const f = F();
  const shown = PSEngine.inputsToShow(f, PREVIEW.subflow, resolved);
  if (!shown.length) { box.innerHTML = '<div class="q-sub">This subflow has no questions.</div>'; return; }
  box.innerHTML = shown.map(inp => {
    const v = resolved[inp.id];
    const head = `<label title="${attr(inp.id)}">${esc(inp.label)}</label>`;
    if (inp.type === 'number') {
      return `<div class="pv-answer">${head}<input type="number" value="${v}" min="${inp.min != null ? inp.min : 0}"
        max="${inp.max != null ? inp.max : 999999}"
        onchange="setPreviewAnswer('${attr(inp.id)}', clampAnswer('${attr(inp.id)}', this.value))" /></div>`;
    }
    if (inp.type === 'yesno') {
      return `<div class="pv-answer">${head}<div class="opts"><label>
        <input type="checkbox" ${v ? 'checked' : ''}
          onchange="setPreviewAnswer('${attr(inp.id)}', this.checked)" /> ${v ? 'Yes' : 'No'}</label></div></div>`;
    }
    if (inp.type === 'choice') {
      const opts = PSEngine.visibleOptions(inp, resolved).map(o =>
        `<option value="${attr(o.id)}" ${v === o.id ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
      return `<div class="pv-answer">${head}<select onchange="setPreviewAnswer('${attr(inp.id)}', this.value)">
        <option value="">Not answered</option>${opts}</select></div>`;
    }
    const boxes = PSEngine.visibleOptions(inp, resolved).map(o => `<label>
      <input type="checkbox" ${(v || []).includes(o.id) ? 'checked' : ''}
        onchange="togglePreviewOption('${attr(inp.id)}', '${attr(o.id)}', this.checked)" /> ${esc(o.label)}</label>`).join('');
    return `<div class="pv-answer">${head}<div class="opts">${boxes}</div></div>`;
  }).join('');
}

function renderPreviewResult(box, out) {
  if (!out.lines.length) {
    box.innerHTML = '<div class="q-sub" style="margin-top:12px;color:var(--amber);">Nothing comes out of this subflow yet. Add tasks to it below, or answer any question still showing above.</div>';
    return;
  }

  const slots = out.slots;
  const mapping = slots.length
    ? slots.map((r, i) => `R${i + 1} = ${esc(PSEngine.roleName(CONFIG, r))}`).join(' \u00b7 ')
    : 'No effort costed, so the resource block would be empty.';
  const capped = (out.clamped || []).length
    ? `<div class="q-sub" style="color:var(--amber);margin-top:6px;">Capped at ${PSEngine.MAX_LINES_PER_TASK} lines: ${out.clamped.map(c => esc(c.task) + ' asked for ' + c.asked).join(', ')}.</div>`
    : '';
  const overflow = out.overflow.length
    ? `<div class="q-sub" style="color:var(--amber);margin-top:6px;">${out.overflow.map(r => esc(PSEngine.roleName(CONFIG, r))).join(', ')} will not fit: the sheet has only five resource columns.</div>`
    : '';

  const header = slots.map((r, i) => `<th class="num">${esc(r)}</th>`).join('');
  const rows = out.lines.map(l => {
    const cells = slots.map(role => {
      const e = l.effortLines.find(x => x.role === role);
      if (!e) return '<td class="num">&nbsp;</td>';
      const bits = [];
      if (e.business) bits.push(e.business + 'h');
      if (e.after) bits.push(e.after + 'h AH');
      return `<td class="num" title="${attr(e.location)}">${bits.join(' + ')}</td>`;
    }).join('');
    return `<tr>
      <td class="pv-phase">${esc(l.phase)}</td>
      <td>${esc(l.description)}</td>
      ${cells}
      <td class="num">${PSEngine.totalHours(l) || ''}</td>
    </tr>`;
  }).join('');

  box.innerHTML = `
    <div class="stat-row stat-row--compact">
      <div><div class="stat-label">Tasks</div><div class="stat-value">${out.lines.length}</div></div>
      <div><div class="stat-label">Hours</div><div class="stat-value">${out.hours}</div></div>
      <div><div class="stat-label">Business</div><div class="stat-value">${out.business}</div></div>
      <div><div class="stat-label">After hours</div><div class="stat-value">${out.after}</div></div>
    </div>
    <div class="q-sub" style="margin-top:10px;">${mapping}</div>${overflow}${capped}
    <div style="overflow-x:auto;">
      <table class="data-table pv-table">
        <tr><th>Phase</th><th>Description</th>${header}<th class="num">Total</th></tr>
        ${rows}
      </table>
    </div>`;
}
