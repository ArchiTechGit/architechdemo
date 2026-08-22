// Export and import: moving a flow between configs, and keeping a backup.
//
// A flow is not self-contained. It names a vertical, and its tasks name phases,
// skills, task types, roles and locations that all live at the top of the config
// rather than inside the flow. Exporting only the flow would produce a file that
// imports into a silently broken state -- a task whose skill is not in the list,
// or whose role has no resource column. So an export carries what the flow needs
// alongside it, and an import checks every one of those before it will take it.
//
// Nothing here writes to GitHub. An import lands in the config held in the page,
// and the existing Save button is still the only thing that commits -- which
// means an import is also still subject to validateConfig.

let TRANSFER = null;

const FLOW_FILE_KIND = 'psbuilder.flow';
const CONFIG_FILE_KIND = 'psbuilder.config';
const FILE_VERSION = 1;

function toggleTransfer() {
  const opening = !TRANSFER;
  if (opening) closeOtherPanels('transfer');
  TRANSFER = opening ? { text: '', report: null, mode: 'add' } : null;
  renderAdmin();
}

// ── what a flow needs from outside itself ───────────────────────────────────
// Collected from the flow rather than from a hand-kept list, so a new field that
// references a global cannot be forgotten here.
function flowRequirements(flow) {
  const phases = new Set();
  const skills = new Set();
  const taskTypes = new Set();
  const roles = new Set();
  const locations = new Set();

  (flow.tasks || []).forEach(t => {
    if (t.phase) phases.add(t.phase);
    if (t.skill) skills.add(t.skill);
    if (t.taskType) taskTypes.add(t.taskType);
    if (t.defaultLocation) locations.add(t.defaultLocation);
    (t.effort || []).forEach(e => {
      if (e.role) roles.add(e.role);
      if (e.location) locations.add(e.location);
    });
  });

  const vertical = (CONFIG.verticals || []).find(v => v.id === flow.vertical);
  return {
    vertical: vertical ? { id: vertical.id, name: vertical.name } : { id: flow.vertical, name: flow.vertical },
    phases: [...phases],
    skills: [...skills],
    taskTypes: [...taskTypes],
    // Roles travel with their names so a report can say which role is missing
    // rather than printing an id nobody recognises.
    roles: [...roles].map(id => {
      const r = (CONFIG.roles || []).find(x => x.id === id);
      return { id, name: r ? r.name : id };
    }),
    locations: [...locations],
  };
}

// ── download ────────────────────────────────────────────────────────────────
function saveFile(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function fileStamp() {
  // Local date, because the person naming a file is thinking in their own days.
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function exportFlow() {
  const f = F();
  if (!f) return;
  const payload = {
    kind: FLOW_FILE_KIND,
    version: FILE_VERSION,
    exported: new Date().toISOString(),
    requires: flowRequirements(f),
    flow: f,
  };
  saveFile(`${f.id}-flow-${fileStamp()}.json`, JSON.stringify(payload, null, 2));
  setTransferNote(`Exported "${f.name}" with the ${count(f.tasks.length, 'task', 'tasks')} and ` +
    `${count(f.inputs.length, 'variable', 'variables')} in it.`);
}

// The whole config, for a backup rather than for moving one flow. It is the file
// the tool already reads, so restoring it is a paste into config.json if this
// page is ever unavailable.
function exportConfig() {
  saveFile(`psbuilder-config-${fileStamp()}.json`,
    JSON.stringify({ kind: CONFIG_FILE_KIND, version: FILE_VERSION, exported: new Date().toISOString(), config: CONFIG }, null, 2));
  setTransferNote(`Exported the whole config: ${count(CONFIG.flows.length, 'flow', 'flows')}.`);
}

function setTransferNote(text) {
  if (!TRANSFER) TRANSFER = { text: '', report: null, mode: 'add' };
  TRANSFER.note = text;
  renderAdmin();
}

// ── reading a file in ───────────────────────────────────────────────────────
function pickTransferFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('tr-text').value = String(reader.result || '');
    readTransfer();
  };
  reader.onerror = () => setTransferNote('That file could not be read.');
  reader.readAsText(file);
  // Let the same file be chosen twice in a row.
  input.value = '';
}

// Everything that could be wrong with the pasted text, found before anything is
// changed. Returns a report rather than throwing, so the page can show all of
// the problems at once instead of the first one.
function inspectTransfer(text) {
  const problems = [];
  const missing = [];
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { problems: ['That is not valid JSON: ' + e.message] };
  }
  if (!data || typeof data !== 'object') return { problems: ['That file is empty.'] };

  // A whole-config file is a different thing, and replacing everything is not
  // something to do by accident.
  if (data.kind === CONFIG_FILE_KIND) {
    return {
      wholeConfig: true,
      config: data.config,
      flows: ((data.config && data.config.flows) || []).length,
      problems: (data.config && Array.isArray(data.config.flows))
        ? PSEngine.validateConfig(data.config)
        : ['That config file has no flows in it.'],
    };
  }

  if (data.kind !== FLOW_FILE_KIND) {
    return { problems: ['That is not a PS Builder export. A flow file says "kind": "' + FLOW_FILE_KIND + '".'] };
  }
  if (Number(data.version) > FILE_VERSION) {
    problems.push(`That file was written by a newer version of this tool (format ${data.version}, this reads ${FILE_VERSION}).`);
  }
  const flow = data.flow;
  if (!flow || !flow.id || !flow.name) {
    return { problems: ['That file has no flow in it.'] };
  }
  if (!Array.isArray(flow.subflows)) {
    problems.push('That flow has no subflows list. None is allowed, but the list has to be there.');
  }

  // The globals. Phases and locations are the two that map onto the shape of the
  // spreadsheet, so they are reported but never added.
  const req = data.requires || {};
  const has = (list, v) => (list || []).some(x => (x.id || x) === (v.id || v));
  (req.phases || []).forEach(p => {
    if (!has(CONFIG.phases, p)) missing.push({ what: 'phase', value: p, fixable: false });
  });
  (req.locations || []).forEach(l => {
    if (!has(CONFIG.locations, l)) missing.push({ what: 'location', value: l, fixable: false });
  });
  (req.skills || []).forEach(s => {
    if (!has(CONFIG.skills, s)) missing.push({ what: 'skill', value: s, fixable: true });
  });
  (req.taskTypes || []).forEach(t => {
    if (!has(CONFIG.taskTypes, t)) missing.push({ what: 'task type', value: t, fixable: true });
  });
  (req.roles || []).forEach(r => {
    if (!has(CONFIG.roles, r)) missing.push({ what: 'role', value: r.name || r.id, fixable: true, role: r });
  });
  if (req.vertical && !has(CONFIG.verticals, req.vertical)) {
    missing.push({ what: 'vertical', value: req.vertical.name || req.vertical.id, fixable: true, vertical: req.vertical });
  }

  const blocked = missing.filter(m => !m.fixable);
  if (blocked.length) {
    problems.push('The phases and locations are the columns of the spreadsheet, so they cannot be ' +
      'added from a file. Add them to this config first, or edit the flow to use what is here.');
  }

  // Everything above is about what the flow needs from outside itself. Whether
  // the flow is coherent on its own terms is a question the engine already
  // answers, and answering it a second time here would be a second set of rules
  // free to drift. So build the config this import would produce and validate
  // that -- the same call the Save button is gated on.
  const trial = JSON.parse(JSON.stringify({
    ...CONFIG,
    flows: (CONFIG.flows || []).filter(x => x.id !== flow.id).concat([flow]),
  }));
  missing.filter(m => m.fixable).forEach(m => {
    if (m.what === 'skill') trial.skills.push(m.value);
    if (m.what === 'task type') trial.taskTypes.push(m.value);
    if (m.what === 'role') trial.roles.push({ id: m.role.id, name: m.role.name });
    if (m.what === 'vertical') trial.verticals.push({ id: m.vertical.id, name: m.vertical.name });
  });
  // Only what this flow is responsible for: problems in the flows already here
  // are not this import's fault and would be confusing to report against it.
  PSEngine.validateConfig(trial)
    .filter(p => !p.includes('flow "') || p.includes(`flow "${flow.id}"`))
    .forEach(p => problems.push(p));

  const clash = (CONFIG.flows || []).find(x => x.id === flow.id);
  return {
    flow, requires: req, missing, problems,
    clash: clash ? { id: clash.id, name: clash.name, tasks: (clash.tasks || []).length } : null,
  };
}

function readTransfer() {
  const text = document.getElementById('tr-text').value;
  TRANSFER.text = text;
  TRANSFER.note = '';
  TRANSFER.report = text.trim() ? inspectTransfer(text) : null;
  renderAdmin();
}

function setTransferMode(mode) {
  TRANSFER.mode = mode;
  renderAdmin();
}

// ── taking it ───────────────────────────────────────────────────────────────
function applyTransfer() {
  const r = TRANSFER && TRANSFER.report;
  if (!r || r.problems.length) return;

  if (r.wholeConfig) {
    if (!confirm(`Replace everything in this config with the file? ` +
      `${count(CONFIG.flows.length, 'flow', 'flows')} here would be replaced by ` +
      `${count(r.flows, 'flow', 'flows')} from the file. Nothing is saved to GitHub until you press Save.`)) return;
    CONFIG = r.config;
    activeFlowId = CONFIG.flows[0] && CONFIG.flows[0].id;
    TRANSFER = { text: '', report: null, mode: 'add',
      note: 'Config replaced from the file. Nothing has been saved yet — check it, then press Save to GitHub.' };
    renderAdmin();
    return;
  }

  // Add whatever is safe to add, so the flow lands into a config that can
  // actually describe it.
  const added = [];
  r.missing.forEach(m => {
    if (!m.fixable) return;
    if (m.what === 'skill') { CONFIG.skills.push(m.value); added.push('skill "' + m.value + '"'); }
    if (m.what === 'task type') { CONFIG.taskTypes.push(m.value); added.push('task type "' + m.value + '"'); }
    if (m.what === 'role') { CONFIG.roles.push({ id: m.role.id, name: m.role.name }); added.push('role "' + m.role.name + '"'); }
    if (m.what === 'vertical') { CONFIG.verticals.push({ id: m.vertical.id, name: m.vertical.name }); added.push('vertical "' + m.vertical.name + '"'); }
  });

  const incoming = JSON.parse(JSON.stringify(r.flow));

  if (r.clash && TRANSFER.mode === 'replace') {
    if (!confirm(`Replace "${r.clash.name}" and its ${count(r.clash.tasks, 'task', 'tasks')} with the one in the file?`)) return;
    CONFIG.flows = CONFIG.flows.map(x => (x.id === incoming.id ? incoming : x));
  } else {
    // Adding alongside: the id has to be free, or two flows would answer to the
    // same name and the picker would only ever reach the first.
    if (r.clash) {
      let n = 2;
      const base = incoming.id;
      while (CONFIG.flows.some(x => x.id === base + '-' + n)) n++;
      incoming.id = base + '-' + n;
      incoming.name = incoming.name + ' (copy ' + n + ')';
    }
    CONFIG.flows.push(incoming);
  }

  activeFlowId = incoming.id;
  const what = r.clash && TRANSFER.mode === 'replace'
    ? `Replaced "${incoming.name}".`
    : `Added "${incoming.name}".`;
  TRANSFER = { text: '', report: null, mode: 'add',
    note: what + (added.length ? ' Also added ' + added.join(', ') + '.' : '') +
      ' Nothing has been saved yet — check it, then press Save to GitHub.' };
  renderAdmin();
}

// ── the panel ───────────────────────────────────────────────────────────────
function renderTransfer() {
  const box = document.getElementById('transfer-slot');
  box.innerHTML = '';
  if (!TRANSFER) return;
  const f = F();
  const r = TRANSFER.report;

  const rows = [];
  if (r && r.problems.length) {
    rows.push(`<div class="notice">${r.problems.map(p => esc(p)).join('<br>')}</div>`);
  }
  if (r && r.missing && r.missing.length) {
    const fixable = r.missing.filter(m => m.fixable);
    const blocked = r.missing.filter(m => !m.fixable);
    if (blocked.length) {
      rows.push(`<div class="notice">Not in this config, and cannot be added from a file:<br>` +
        blocked.map(m => esc(m.what + ' — ' + m.value)).join('<br>') + `</div>`);
    }
    if (fixable.length) {
      rows.push(`<div class="q-sub q-sub--spaced">Will also be added, because the flow needs them: ` +
        fixable.map(m => esc(m.what + ' "' + m.value + '"')).join(', ') + `.</div>`);
    }
  }

  if (r && r.wholeConfig && !r.problems.length) {
    rows.push(`
      <div class="q-sub q-sub--spaced">A whole-config backup holding
        ${count(r.flows, 'flow', 'flows')}. Taking it replaces everything here.</div>
      <button class="btn-primary" onclick="applyTransfer()">Replace this config</button>`);
  } else if (r && r.flow && !r.problems.length) {
    const t = r.flow;
    rows.push(`
      <div class="scroll-x"><table class="data-table">
        <tr><th>Flow</th><th>Subflows</th><th class="num">Variables</th><th class="num">Tasks</th></tr>
        <tr>
          <td>${esc(t.name)}</td>
          <td>${(t.subflows || []).map(s => esc(s.name)).join(', ')}</td>
          <td class="num">${(t.inputs || []).length}</td>
          <td class="num">${(t.tasks || []).length}</td>
        </tr>
      </table></div>`);
    if (r.clash) {
      rows.push(`
        <div class="q-sub" style="margin-top:14px;">A flow with the id
          <span class="chip chip--ghost" style="cursor:default;">${esc(r.clash.id)}</span>
          is already here: "${esc(r.clash.name)}", with ${count(r.clash.tasks, 'task', 'tasks')}.</div>
        <div class="choice-group" style="margin:10px 0 14px;">
          <label class="choice-row">
            <input type="radio" name="tr-mode" ${TRANSFER.mode === 'add' ? 'checked' : ''}
                   onchange="setTransferMode('add')" />
            <div class="choice-body"><div class="choice-title">Keep both</div>
              <div class="q-sub">The one coming in is renamed, so nothing here changes.</div></div>
          </label>
          <label class="choice-row">
            <input type="radio" name="tr-mode" ${TRANSFER.mode === 'replace' ? 'checked' : ''}
                   onchange="setTransferMode('replace')" />
            <div class="choice-body"><div class="choice-title">Replace it</div>
              <div class="q-sub">"${esc(r.clash.name)}" and its
                ${count(r.clash.tasks, 'task', 'tasks')} are discarded.</div></div>
          </label>
        </div>`);
    }
    rows.push(`<button class="btn-primary" onclick="applyTransfer()">${
      r.clash && TRANSFER.mode === 'replace' ? 'Replace the flow' : 'Add the flow'}</button>`);
  }

  box.innerHTML = `
    <div class="q-card" style="margin-bottom:22px;">
      <div class="q-label">Back up a flow, or move one</div>
      <div class="q-sub q-sub--spaced">
        A flow file carries the flow and the phases, skills, roles and vertical it needs, so it can
        be checked against this config before anything changes. Nothing is written to GitHub until
        you press Save.
      </div>

      ${TRANSFER.note ? `<div class="notice notice--ok">${esc(TRANSFER.note)}</div>` : ''}

      <div class="section-label" style="margin-top:20px;">Export</div>
      <button class="btn-secondary" onclick="exportFlow()"${f ? '' : ' disabled'}>${
        f ? 'This flow — ' + esc(f.name) : 'No flow selected'}</button>
      <button class="btn-ghost btn-ghost--roomy" onclick="exportConfig()">Everything, as a backup</button>

      <div class="section-label" style="margin-top:26px;">Import</div>
      <div class="q-sub q-sub--spaced">Choose a file, or paste one in.</div>
      <input type="file" accept="application/json,.json" onchange="pickTransferFile(this)"
             style="margin-bottom:10px;" aria-label="Choose an exported flow or config file" />
      <textarea id="tr-text" rows="4" oninput="readTransfer()"
                placeholder='{ "kind": "psbuilder.flow", ... }'>${esc(TRANSFER.text)}</textarea>
      ${rows.join('')}
      <div style="margin-top:12px;">
        <button class="btn-ghost" onclick="toggleTransfer()">Close</button>
      </div>
    </div>`;
}
