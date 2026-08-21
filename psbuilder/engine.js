// The one place that turns a flow plus some answers into PSE rows.
//
// Shared by index.html (the builder) and admin.html (the preview), so a preview
// cannot drift from what the builder actually produces. Nothing here touches the
// DOM or knows about any particular solution: it is all driven by config.json.
const PSEngine = (function () {
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
  function buildLines(flow, subflowId, resolved) {
    const out = [];
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
        const n = Number(resolved[task.repeatPer] || 0);
        for (let i = 1; i <= n; i++) emit(i);
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
  // Data rows only. These paste onto rows that already exist, and a header row
  // would land in the data and push every task down one.
  function blockText(cols, lines) {
    return lines.map(l => cols.map(c => {
      if (c.constant !== undefined) return c.constant;
      const v = l[c.from];
      return v == null ? '' : v;
    }).join('\t')).join('\n');
  }

  function roleName(config, id) {
    const r = (config.roles || []).find(r => r.id === id);
    return r ? r.name : id;
  }

  // Everything a caller needs to go from answers to pasteable rows.
  function estimate(config, flow, subflowId, answers) {
    const resolved = resolve(flow, subflowId, answers);
    const lines = buildLines(flow, subflowId, resolved);
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
      business: round2(business),
      after: round2(after),
      hours: round2(business + after),
    };
  }

  return {
    round2, esc, attr, inSubflow, condMet, defaultFor, visibleOptions, activeInputs,
    resolve, isRequired, inputsToShow, allRequiredAnswered,
    amountOf, fillText, buildLines, totalHours,
    assignSlots, applySlots, blockText, roleName, estimate,
  };
})();

if (typeof module !== 'undefined') module.exports = PSEngine;
