// The shared logic: turning a flow plus some answers into PSE rows, and
// reading a pasted block of PSE rows back into draft tasks.
//
// Shared by index.html (the builder) and admin.html (the preview), so a preview
// cannot drift from what the builder actually produces. Nothing here touches the
// DOM or knows about any particular solution: it is all driven by config.json.
const PSEngine = (function () {
  // The PSE has 181 task rows. Emitting more lines than that cannot be pasted
  // anywhere useful, and a runaway count used to loop until the tab died.
  const MAX_LINES_PER_TASK = 200;

  // A repeat count has to be a whole, finite, non-negative number. Anything
  // else means zero lines rather than a hung page.
  function repeatCount(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n <= 0) return { n: 0, clamped: false };
    if (n > MAX_LINES_PER_TASK) return { n: MAX_LINES_PER_TASK, clamped: true, asked: n };
    return { n, clamped: false };
  }
  function round2(n) { return Math.round(Number(n || 0) * 100) / 100; }

  // Both pages build HTML out of config values, so the escaping lives here
  // rather than being copied into each of them.
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

  // ── subflow membership ──
  // "all" (or absent) means every subflow; otherwise a list of subflow ids.
  function inSubflow(member, subflowId) {
    if (member === undefined || member === null || member === 'all') return true;
    return Array.isArray(member) ? member.includes(subflowId) : member === subflowId;
  }

  // ── conditions ──
  // One shape covers every gate, whether on an input, an option or a task.
  function condMet(cond, resolved) {
    if (!cond) return true;
    const a = resolved[cond.input];
    if (a === undefined || a === null) return false;
    if (cond.is !== undefined) return Array.isArray(a) ? a.includes(cond.is) : a === cond.is;
    if (cond.anySelected) return Array.isArray(a) && a.length > 0;
    if (cond.isOn) return a === true;
    if (cond.moreThanZero) return Number(a) > 0;
    return true;
  }

  function defaultFor(input) {
    if (input.type === 'checklist') return (input.options || []).filter(o => o.default).map(o => o.id);
    if (input.type === 'number') return input.default != null ? input.default : (input.min || 0);
    if (input.type === 'yesno') return input.default === true;
    return null; // a choice starts unanswered
  }

  function visibleOptions(input, resolved) {
    return (input.options || []).filter(o => condMet(o.showWhen, resolved));
  }

  function activeInputs(flow, subflowId) {
    return flow.inputs.filter(i => inSubflow(i.subflows, subflowId));
  }

  // A single forward pass, so a hidden input can never satisfy a condition and a
  // hidden option can never count as ticked. This is why a condition may only
  // reference an input asked earlier.
  function resolve(flow, subflowId, answers) {
    const resolved = {};
    activeInputs(flow, subflowId).forEach(input => {
      if (!condMet(input.showWhen, resolved)) return;
      let val = (answers || {})[input.id];
      if (val === undefined) val = defaultFor(input);
      if (input.type === 'checklist') {
        const allowed = visibleOptions(input, resolved).map(o => o.id);
        val = (val || []).filter(id => allowed.includes(id));
      }
      resolved[input.id] = val;
    });
    return resolved;
  }

  // A choice with no default has to be answered before later inputs appear.
  function isRequired(input) { return input.type === 'choice' && input.default === undefined; }

  function inputsToShow(flow, subflowId, resolved) {
    const out = [];
    for (const input of activeInputs(flow, subflowId)) {
      if (!condMet(input.showWhen, resolved)) continue;
      out.push(input);
      const a = resolved[input.id];
      if (isRequired(input) && (a === null || a === undefined)) break;
    }
    return out;
  }

  function allRequiredAnswered(flow, subflowId, resolved) {
    return activeInputs(flow, subflowId)
      .filter(i => condMet(i.showWhen, resolved) && isRequired(i))
      .every(i => resolved[i.id] !== null && resolved[i.id] !== undefined);
  }

  // ── amounts ──
  // Either a plain number, or a base plus a rate per unit of a variable.
  function amountOf(amount, resolved) {
    if (amount == null) return 0;
    if (typeof amount === 'number') return amount;
    let total = Number(amount.base || 0);
    (amount.per || []).forEach(p => {
      total += Number(resolved[p.input] || 0) * Number(p.each || 0);
    });
    return round2(total);
  }

  // ── text ──
  // {#} is the line number on a repeating task. {anything else} is looked up as
  // an input, by token first and then by id.
  function fillText(flow, str, resolved, index) {
    return String(str == null ? '' : str).replace(/\{([^{}]+)\}/g, (whole, raw) => {
      const key = raw.trim();
      if (key === '#') return index != null ? index : whole;
      const input = flow.inputs.find(i => (i.token || i.id) === key)
        || flow.inputs.find(i => i.id === key);
      if (!input) return whole;
      const v = resolved[input.id];
      return v == null ? whole : v;
    });
  }

  // ── the task lines ──
  function buildLines(flow, subflowId, resolved, clamped) {
    const out = [];
    clamped = clamped || [];
    flow.tasks.forEach(task => {
      if (!inSubflow(task.subflows, subflowId)) return;
      if (!condMet(task.showWhen, resolved)) return;

      const emit = (index) => out.push({
        id: task.id,
        phase: task.phase,
        skill: task.skill || '',
        taskType: task.taskType || '',
        description: fillText(flow, task.description, resolved, index),
        effortLines: (task.effort || []).map(e => ({
          role: e.role,
          location: e.location || task.defaultLocation || '',
          business: amountOf(e.business, resolved),
          after: amountOf(e.after, resolved),
        })).filter(e => e.role && (e.business || e.after)),
      });

      if (task.repeatPer) {
        const count = repeatCount(resolved[task.repeatPer]);
        if (count.clamped) clamped.push({ task: task.id, asked: count.asked, used: count.n });
        for (let i = 1; i <= count.n; i++) emit(i);
      } else {
        emit();
      }
    });
    return out;
  }

  function totalHours(line) {
    return round2((line.effortLines || []).reduce((n, e) => n + e.business + e.after, 0));
  }

  // ── resource slots ──
  // The sheet fixes one role per resource column, so the roles actually used are
  // assigned to R1..R5 in the order they first appear.
  function assignSlots(lines) {
    const order = [];
    lines.forEach(l => l.effortLines.forEach(e => {
      if (!order.includes(e.role)) order.push(e.role);
    }));
    return order;
  }

  // Flattens a line onto the five slot columns the sheet expects.
  function applySlots(line, slots) {
    for (let n = 1; n <= 5; n++) {
      const role = slots[n - 1];
      const e = role ? line.effortLines.find(x => x.role === role) : null;
      line['r' + n + 'Location'] = e ? e.location : '';
      line['r' + n + 'Business'] = e && e.business ? e.business : '';
      line['r' + n + 'After'] = e && e.after ? e.after : '';
    }
    return line;
  }

  // ── output ──
  // A tab would open a new column and a newline a new row, so a description
  // pasted in from elsewhere could silently shift every cell after it. Both
  // collapse to a single space.
  function cell(value) {
    if (value == null) return '';
    return String(value).replace(/[\t\r\n]+/g, ' ').trim();
  }

  // Data rows only. These paste onto rows that already exist, and a header row
  // would land in the data and push every task down one.
  function blockText(cols, lines) {
    return lines.map(l => cols.map(c => {
      if (c.constant !== undefined) return cell(c.constant);
      return cell(l[c.from]);
    }).join('\t')).join('\n');
  }
  // ── importing a pasted block ──
  // Excel wraps a cell in quotes when it contains a tab or a newline, so
  // splitting on those alone would tear such a row apart. This walks the text
  // instead, which is the only way to keep those cells whole.
  function parseGrid(text) {
    const s = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
    const rows = [];
    let row = [], cellText = '', quoted = false, started = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (quoted) {
        if (ch !== '"') { cellText += ch; continue; }
        if (s[i + 1] === '"') { cellText += '"'; i++; continue; }
        quoted = false;
        continue;
      }
      if (ch === '"' && cellText === '') { quoted = true; started = true; continue; }
      if (ch === '\t') { row.push(cellText); cellText = ''; started = true; continue; }
      if (ch === '\n') { row.push(cellText); rows.push(row); row = []; cellText = ''; started = false; continue; }
      cellText += ch;
      started = true;
    }
    if (started || cellText !== '' || row.length) { row.push(cellText); rows.push(row); }
    return rows
      .map(r => r.map(c => c.trim()))
      .filter(r => r.some(c => c !== ''));
  }

  // What the four task-detail columns are called on the sheet.
  const IMPORT_FIELDS = [
    { key: 'phase', header: 'phase' },
    { key: 'skill', header: 'skill required' },
    { key: 'taskType', header: 'task type' },
    { key: 'description', header: 'description' },
  ];

  // Where the resource columns sit when the whole sheet width is pasted:
  // Phase..Subcontractor Effort is nine columns, then five groups of three.
  const FIRST_RESOURCE_COLUMN = 9;
  const RESOURCE_SLOTS = 5;

  // Reads "R1 Business Hours" and friends out of a header row.
  function resourcesFromHeader(first) {
    const found = {};
    first.forEach((raw, at) => {
      const m = String(raw).match(/^r(\d)\s+(location|business hours|after hours)$/i);
      if (!m) return;
      const slot = Number(m[1]);
      const key = m[2].toLowerCase() === 'location' ? 'location'
        : m[2].toLowerCase() === 'business hours' ? 'business' : 'after';
      found[slot] = found[slot] || { slot };
      found[slot][key] = at;
    });
    return Object.values(found)
      .filter(r => r.business !== undefined || r.after !== undefined)
      .sort((a, b) => a.slot - b.slot);
  }

  // Same groups, worked out by position when there is no header to read.
  function resourcesByPosition(width) {
    const out = [];
    for (let n = 0; n < RESOURCE_SLOTS; n++) {
      const at = FIRST_RESOURCE_COLUMN + n * 3;
      if (at + 2 >= width + 1 && at + 1 >= width) break;
      if (at >= width) break;
      out.push({ slot: n + 1, location: at, business: at + 1, after: at + 2 });
    }
    return out;
  }

  // Works out which column is which: by the header row if there is one, else
  // by position, which is safe because the sheet fixes the order.
  function detectColumns(grid) {
    if (!grid.length) return { map: {}, resources: [], headerRow: false, width: 0, note: 'Nothing to read.' };
    const width = Math.max(...grid.map(r => r.length));
    const first = grid[0].map(c => c.toLowerCase());

    if (first.some(c => IMPORT_FIELDS.some(f => f.header === c))) {
      const map = {};
      IMPORT_FIELDS.forEach(f => {
        const at = first.indexOf(f.header);
        if (at !== -1) map[f.key] = at;
      });
      const found = Object.keys(map).length;
      const resources = resourcesFromHeader(first);
      return {
        map, resources, headerRow: true, width,
        note: `Read the header row and matched ${found} of the four task columns`
          + (resources.length ? `, plus hours for ${resources.map(r => 'R' + r.slot).join(', ')}.` : '.'),
      };
    }

    if (width === 1) {
      return {
        map: { description: 0 }, resources: [], headerRow: false, width,
        note: 'One column, so it is being read as descriptions only.',
      };
    }
    if (width >= 4) {
      // Only the full sheet width can be trusted to line the resource columns
      // up by position; anything narrower gets the task columns alone.
      const resources = width >= FIRST_RESOURCE_COLUMN + 2 ? resourcesByPosition(width) : [];
      return {
        map: { phase: 0, skill: 1, taskType: 2, description: 3 },
        resources, headerRow: false, width,
        note: width === 4
          ? 'Four columns, read as Phase, Skill Required, Task Type and Description.'
          : `${width} columns, read as the four task columns`
            + (resources.length ? `, plus hours for ${resources.map(r => 'R' + r.slot).join(', ')}.` : ', with the rest ignored.'),
      };
    }
    return {
      map: {}, resources: [], headerRow: false, width, ambiguous: true,
      note: `${width} columns is not a shape this recognises. Paste either the four task-detail columns, or just the descriptions.`,
    };
  }

  // Spreadsheet cells arrive as text, and an empty one can be blank, a dash or
  // a stray zero. Anything that is not a positive number means no hours.
  function toHours(raw) {
    if (raw === undefined || raw === null) return 0;
    const n = Number(String(raw).replace(/[^0-9.\-]/g, ''));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100) / 100;
  }

  // Case and spacing should not decide whether a value is accepted.
  function matchFromList(value, list) {
    if (!value) return null;
    const want = String(value).trim().toLowerCase();
    return list.find(v => v.toLowerCase() === want) || null;
  }

  // Turns the grid into draft tasks, saying for each one what it could not
  // work out rather than quietly picking something.
  function draftTasks(grid, cols, config, existingDescriptions) {
    const seen = new Set((existingDescriptions || []).map(s => String(s).trim().toLowerCase()));
    const withinPaste = new Set();
    const rows = cols.headerRow ? grid.slice(1) : grid;
    const drafts = [];
    let skipped = 0;

    rows.forEach((row, n) => {
      const at = (key) => (cols.map[key] === undefined ? '' : (row[cols.map[key]] || ''));
      // A row with no description is not a task, whatever else it carries.
      const description = cell(at('description'));
      if (!description) { skipped++; return; }

      const issues = [];
      const pick = (key, list, label) => {
        const raw = at(key);
        if (!raw) { issues.push({ field: key, kind: 'missing', note: `No ${label} in the paste` }); return list[0]; }
        const hit = matchFromList(raw, list);
        if (!hit) { issues.push({ field: key, kind: 'unknown', value: raw, note: `"${raw}" is not a ${label} the PSE offers` }); return list[0]; }
        return hit;
      };

      // Braces mean a variable to the builder. Imported text has no variables
      // behind it, so anything in braces would reach the sheet verbatim.
      const tokens = new Set((config.flows || [])
        .flatMap(f => f.inputs || [])
        .map(i => i.token || i.id));
      [...description.matchAll(/\{([^{}]+)\}/g)].forEach(m => {
        const ref = m[1].trim();
        if (ref === '#') {
          issues.push({ field: 'description', kind: 'placeholder',
            note: '{#} only means something on a repeating task, so it would print as-is' });
        } else if (!tokens.has(ref)) {
          issues.push({ field: 'description', kind: 'placeholder', value: ref,
            note: `"{${ref}}" looks like a variable but nothing defines it, so it would print as-is` });
        }
      });

      const key = description.toLowerCase();
      if (seen.has(key)) issues.push({ field: 'description', kind: 'duplicate', note: 'A task with this description is already in the flow' });
      if (withinPaste.has(key)) issues.push({ field: 'description', kind: 'repeated', note: 'This description appears more than once in the paste' });
      withinPaste.add(key);

      // Hours as recorded against each resource slot. Which role a slot was is
      // not in the data, so it stays a slot number until the caller maps it.
      const effort = [];
      (cols.resources || []).forEach(res => {
        const business = toHours(row[res.business]);
        const after = toHours(row[res.after]);
        if (!business && !after) return;
        const rawLocation = res.location === undefined ? '' : cell(row[res.location]);
        const location = matchFromList(rawLocation, config.locations);
        if (rawLocation && !location) {
          issues.push({ field: 'location', kind: 'unknown', value: rawLocation,
            note: `"${rawLocation}" is not a location the PSE offers` });
        } else if (!rawLocation) {
          issues.push({ field: 'location', kind: 'missing', note: `No location against R${res.slot}` });
        }
        effort.push({ slot: res.slot, location: location || config.locations[0], business, after });
      });

      drafts.push({
        row: n + 1,
        effort,
        description,
        phase: pick('phase', config.phases, 'phase'),
        skill: pick('skill', config.skills, 'skill'),
        taskType: pick('taskType', config.taskTypes, 'task type'),
        issues,
      });
    });

    return { drafts, skipped };
  }

  // One call from paste to reviewable drafts.
  function readPaste(text, config, existingDescriptions) {
    const grid = parseGrid(text);
    const cols = detectColumns(grid);
    if (cols.ambiguous || !Object.keys(cols.map).length) {
      return { cols, drafts: [], skipped: 0, rows: grid.length };
    }
    const { drafts, skipped } = draftTasks(grid, cols, config, existingDescriptions);
    return { cols, drafts, skipped, rows: grid.length };
  }

  // Slots become roles only when the caller has said which role each column
  // was, since the sheet keeps that on row 41 rather than in the rows.
  function effortFromSlots(draftEffort, slotRoles) {
    return (draftEffort || []).map(e => {
      const role = slotRoles[e.slot];
      if (!role) return null;
      const entry = { role, location: e.location };
      if (e.business) entry.business = { base: e.business };
      if (e.after) entry.after = { base: e.after };
      return entry;
    }).filter(Boolean);
  }

  // Which stage accent a phase takes: its position in the configured phase
  // list, 1-based, so the colours follow project order rather than the
  // alphabet. Returns 0 for a phase not in the list, which paints no edge.
  function phaseIndex(config, phase) {
    const i = (config.phases || []).indexOf(phase);
    return i < 0 ? 0 : i + 1;
  }

  function roleName(config, id) {
    const r = (config.roles || []).find(r => r.id === id);
    return r ? r.name : id;
  }

  // ── config integrity ──
  // The rules that decide whether a config can be trusted. Used by the test
  // suite and by the admin before it writes anything, so a config that fails
  // here never reaches the repo.
  const CONDITION_KEYS = ['input', 'is', 'anySelected', 'isOn', 'moreThanZero'];
  const INPUT_TYPES = ['number', 'yesno', 'checklist', 'choice'];
  const RETIRED_TASK_FIELDS = ['trips', 'stays', 'documents', 'clientEffort', 'subcontractorEffort'];
  const COLUMN_SOURCES = ['phase', 'skill', 'taskType', 'description']
    .concat([1, 2, 3, 4, 5].flatMap(n => [`r${n}Location`, `r${n}Business`, `r${n}After`]));

  function validateConfig(config) {
    const problems = [];
    const verticalIds = (config.verticals || []).map(v => v.id);
    const roleIds = (config.roles || []).map(r => r.id);

    (config.verticals || []).forEach(v => {
      if (!v.id || !v.name) problems.push(`a vertical is missing an id or a name`);
    });
    if (verticalIds.length !== new Set(verticalIds).size) problems.push('two verticals share an id');

    [['taskColumns', config.taskColumns], ['resourceColumns', config.resourceColumns]].forEach(([name, cols]) => {
      if (!(cols || []).length) { problems.push(`${name} is empty`); return; }
      cols.forEach(c => {
        if (c.from === undefined && c.constant === undefined) problems.push(`${name}: "${c.header}" has neither from nor constant`);
        if (c.from && !COLUMN_SOURCES.includes(c.from)) problems.push(`${name}: "${c.header}" reads unknown field "${c.from}"`);
      });
    });

    (config.flows || []).forEach(f => {
      const at = (what) => `flow ${f.id || '(no id)'}: ${what}`;
      ['id', 'name', 'vertical', 'subflows', 'inputs', 'tasks'].forEach(k => {
        if (f[k] === undefined) problems.push(at(`missing "${k}"`));
      });
      if (!verticalIds.includes(f.vertical)) problems.push(at(`sits in unknown vertical "${f.vertical}"`));
      // A flow with no subflows is allowed: it has one path, and every task
      // belongs to it. A task naming a subflow that is not there is still wrong,
      // and is caught further down.
      if (!Array.isArray(f.subflows)) problems.push(at('has no subflows list'));
      ['phases', 'locations', 'columns'].forEach(k => {
        if (f[k] !== undefined) problems.push(at(`carries its own "${k}", which the PSE fixes for every flow`));
      });

      const subIds = (f.subflows || []).map(s => s.id);
      if (subIds.length !== new Set(subIds).size) problems.push(at('two subflows share an id'));
      (f.subflows || []).forEach(s => { if (!s.name) problems.push(at(`subflow "${s.id}" has no name`)); });

      const inputIdx = new Map((f.inputs || []).map((i, n) => [i.id, n]));
      const numberInputs = new Set((f.inputs || []).filter(i => i.type === 'number').map(i => i.id));

      const checkSubflows = (member, label) => {
        if (member === undefined || member === 'all') return;
        if (!Array.isArray(member)) { problems.push(at(`${label} has a subflows value that is neither "all" nor a list`)); return; }
        if (!member.length) problems.push(at(`${label} is in no subflow at all`));
        if (member.length && !subIds.length) {
          problems.push(at(`${label} names a subflow, but this flow has none -- it should be in all of them`));
        }
        member.forEach(id => { if (!subIds.includes(id)) problems.push(at(`${label} names unknown subflow "${id}"`)); });
      };

      // maxIndex enforces that an input only depends on one asked earlier,
      // because answers resolve in a single forward pass.
      const checkCond = (cond, label, maxIndex) => {
        if (!cond) return;
        Object.keys(cond).forEach(k => {
          if (!CONDITION_KEYS.includes(k)) problems.push(at(`${label} uses unknown condition key "${k}"`));
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
      };

      const checkAmount = (a, label, repeatPer) => {
        if (a == null) return;
        if (typeof a === 'number') return;
        if (typeof a !== 'object') { problems.push(at(`${label} is neither a number nor a base/rate pair`)); return; }
        if (a.base !== undefined && typeof a.base !== 'number') problems.push(at(`${label} has a non-numeric base`));
        (a.per || []).forEach(rate => {
          if (!numberInputs.has(rate.input)) problems.push(at(`${label} scales with "${rate.input}", which is not a variable`));
          if (typeof rate.each !== 'number') problems.push(at(`${label} has a non-numeric rate for "${rate.input}"`));
          // A repeating task already emits one line per unit; scaling each line
          // by that same unit would count it twice.
          if (repeatPer && rate.input === repeatPer) {
            problems.push(at(`${label} repeats per "${rate.input}" and also scales with it, double counting`));
          }
        });
      };

      const tokens = new Map();
      (f.inputs || []).forEach(i => {
        const t = i.token || i.id;
        if (tokens.has(t)) problems.push(at(`token "${t}" is claimed by both "${tokens.get(t)}" and "${i.id}"`));
        tokens.set(t, i.id);
      });

      const seenInput = new Set();
      (f.inputs || []).forEach((i, n) => {
        if (seenInput.has(i.id)) problems.push(at(`duplicate input id "${i.id}"`));
        seenInput.add(i.id);
        if (!INPUT_TYPES.includes(i.type)) problems.push(at(`input "${i.id}" has unknown type "${i.type}"`));
        if (!i.label) problems.push(at(`input "${i.id}" has no label`));
        checkCond(i.showWhen, `input "${i.id}"`, n);
        checkSubflows(i.subflows, `input "${i.id}"`);
        if (['choice', 'checklist'].includes(i.type)) {
          if (!(i.options || []).length) problems.push(at(`input "${i.id}" is a ${i.type} with no options`));
          const seenOption = new Set();
          (i.options || []).forEach(o => {
            if (seenOption.has(o.id)) problems.push(at(`input "${i.id}" has duplicate option id "${o.id}"`));
            seenOption.add(o.id);
            if (!o.label) problems.push(at(`input "${i.id}" has an option with no label`));
            checkCond(o.showWhen, `option "${o.id}" on "${i.id}"`, n);
          });
        }
        if (i.type === 'number' && i.min != null && i.max != null && i.min > i.max) {
          problems.push(at(`input "${i.id}" has min above max`));
        }
      });

      const seenTask = new Set();
      (f.tasks || []).forEach(t => {
        if (seenTask.has(t.id)) problems.push(at(`duplicate task id "${t.id}"`));
        seenTask.add(t.id);
        if (!t.description) problems.push(at(`task "${t.id}" has no description`));
        if (!(config.phases || []).includes(t.phase)) problems.push(at(`task "${t.id}" uses phase "${t.phase}", which the PSE does not offer`));
        if (!t.skill) problems.push(at(`task "${t.id}" has no skill`));
        else if (!(config.skills || []).includes(t.skill)) problems.push(at(`task "${t.id}" uses skill "${t.skill}", which the PSE does not offer`));
        if (!t.taskType) problems.push(at(`task "${t.id}" has no task type`));
        else if (!(config.taskTypes || []).includes(t.taskType)) problems.push(at(`task "${t.id}" uses task type "${t.taskType}", which the PSE does not offer`));

        checkSubflows(t.subflows, `task "${t.id}"`);
        checkCond(t.showWhen, `task "${t.id}"`);
        if (t.repeatPer && !numberInputs.has(t.repeatPer)) {
          problems.push(at(`task "${t.id}" repeats per "${t.repeatPer}", which is not a variable`));
        }
        RETIRED_TASK_FIELDS.forEach(k => {
          if (t[k] !== undefined) problems.push(at(`task "${t.id}" still carries "${k}", which the PSE works out itself`));
        });

        [...String(t.description || '').matchAll(/\{([^{}]+)\}/g)].forEach(m => {
          const ref = m[1].trim();
          if (ref === '#') {
            if (!t.repeatPer) problems.push(at(`task "${t.id}" uses {#} but does not repeat`));
            return;
          }
          if (!tokens.has(ref)) problems.push(at(`task "${t.id}" references unknown variable "{${ref}}"`));
        });

        (t.effort || []).forEach((e, n) => {
          const label = `task "${t.id}" effort ${n + 1}`;
          if (!roleIds.includes(e.role)) problems.push(at(`${label} names unknown role "${e.role}"`));
          if (e.location && !(config.locations || []).includes(e.location)) {
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
        if (t.defaultLocation && !(config.locations || []).includes(t.defaultLocation)) {
          problems.push(at(`task "${t.id}" defaults to location "${t.defaultLocation}", which the PSE does not offer`));
        }
      });

      // The sheet only has five resource columns.
      const rolesUsed = new Set();
      (f.tasks || []).forEach(t => (t.effort || []).forEach(e => rolesUsed.add(e.role)));
      if (rolesUsed.size > RESOURCE_SLOTS) {
        problems.push(at(`uses ${rolesUsed.size} roles, but the PSE only has ${RESOURCE_SLOTS} resource columns`));
      }
    });

    return problems;
  }

  // Everything a caller needs to go from answers to pasteable rows.
  function estimate(config, flow, subflowId, answers) {
    const resolved = resolve(flow, subflowId, answers);
    const clamped = [];
    const lines = buildLines(flow, subflowId, resolved, clamped);
    const allSlots = assignSlots(lines);
    const slots = allSlots.slice(0, 5);
    lines.forEach(l => applySlots(l, slots));

    let business = 0, after = 0;
    lines.forEach(l => l.effortLines.forEach(e => { business += e.business; after += e.after; }));

    return {
      resolved,
      lines,
      slots,
      overflow: allSlots.slice(5),
      clamped,
      business: round2(business),
      after: round2(after),
      hours: round2(business + after),
    };
  }

  return {
    round2, esc, attr, cell, repeatCount, MAX_LINES_PER_TASK, inSubflow, condMet, defaultFor, visibleOptions, activeInputs,
    resolve, isRequired, inputsToShow, allRequiredAnswered,
    amountOf, fillText, buildLines, totalHours,
    assignSlots, applySlots, blockText, roleName, phaseIndex, estimate,
    parseGrid, detectColumns, draftTasks, readPaste, IMPORT_FIELDS,
    toHours, effortFromSlots, RESOURCE_SLOTS, validateConfig,
  };
})();

if (typeof module !== 'undefined') module.exports = PSEngine;
