# PS Builder — Config-Driven Rules + Admin UI

## Problem

`psbuilder/index.html` hardcodes every activity, question, and gating rule as
JS (`PRODUCTS`, `TYPES`, `SCOPES`, `baselineTasks()`, `buildQuestions()`).
Grant (solution architect) built it to generate PSE activity lists from a
short questionnaire instead of hand-filling every line. His team now wants to
use it too, which means non-code-editing team members need to add/change
activities and gating rules themselves. Editing JS directly isn't viable for
that audience.

## Goals

- Externalize all activity/question/gating data into one JSON config the
  tool reads at runtime.
- Add an admin page so any team member can add/edit/delete activities and
  questions through a form, no code editing.
- Admin saves commit straight to the repo (`master`) via GitHub's API — no
  server, no database, no PR review step. Git history is the audit trail.
- Keep it simple: static site stays static, no new hosting/infra.

## Non-goals

- No multi-user real-time collaboration/locking (last-write-wins with a
  conflict message is fine).
- No config preview/simulation step in admin — the main tool itself is the
  preview.
- No support for products beyond WxCC yet (Wireless/Spaces stay stubbed).

## Data model — `psbuilder/config.json`

```json
{
  "products": [{ "id": "wxcc", "name": "Webex Contact Centre", "enabled": true }],
  "types": [
    { "id": "new", "name": "New / Greenfield", "desc": "..." },
    { "id": "migration", "name": "Migration", "desc": "..." }
  ],
  "scopes": [
    { "id": "dfd", "name": "Digital Front Door", "desc": "..." },
    { "id": "standard", "name": "Standard Contact Centre", "desc": "..." }
  ],
  "questions": [
    {
      "id": "workshops", "type": "stepper",
      "label": "How many discovery workshops do you need?",
      "sub": "...", "min": 0, "max": 6, "default": 4,
      "scopeGate": "all"
    },
    {
      "id": "staging-channels", "type": "checklist",
      "label": "...", "sub": "...",
      "scopeGate": "all",
      "options": [
        { "id": "sms", "label": "SMS asset provisioning", "default": false, "scopeGate": "all" },
        { "id": "crm", "label": "CRM environment access confirmed", "default": false, "scopeGate": "dfd" }
      ]
    }
  ],
  "activities": [
    {
      "id": "legacy-review", "phase": "Design",
      "description": "Legacy platform environment review & migration mapping",
      "skillRequired": "Collaboration", "taskType": "ArchiTech Activity",
      "location": "Office", "trips": 0,
      "trigger": { "type": "typeEquals", "value": "migration" }
    },
    {
      "id": "workshop-discovery", "phase": "Design",
      "description": "Workshop {{n}} — discovery session",
      "skillRequired": "Collaboration", "taskType": "ArchiTech Activity",
      "location": "Office", "trips": 0,
      "trigger": { "type": "stepperRepeat", "questionId": "workshops" }
    },
    {
      "id": "staging-sms", "phase": "Staging",
      "description": "SMS asset provisioning",
      "skillRequired": "Collaboration", "taskType": "ArchiTech Activity",
      "location": "Office", "trips": 0,
      "trigger": { "type": "checklistOption", "questionId": "staging-channels", "optionId": "sms" }
    },
    {
      "id": "agent-training-task", "phase": "Project Completion & Handover",
      "description": "Agent training (desktop, call/chat handling, wrap-up codes) — {{n}} sessions",
      "skillRequired": "Collaboration", "taskType": "ArchiTech Activity",
      "location": "Client Site", "trips": 1,
      "trigger": { "type": "stepperGate", "questionId": "agent-training" }
    }
  ]
}
```

Trigger types needed to cover every existing rule:

| type | meaning |
|---|---|
| `always` | always included |
| `typeEquals` | included only when engagement type = value |
| `stepperRepeat` | one instance per unit of a stepper question's value (`{{n}}` substituted with index) |
| `stepperGate` | included once if a stepper question's value > 0 (`{{n}}` substituted with the value) |
| `toggleOn` | included if a toggle question is on |
| `checklistOption` | included if a specific checklist option is checked |
| `checklistAny` | included if ANY option in a checklist question is checked (for the derived "workshop/testing" lines that fire off omni-channel selection) |

Each question also carries a `scopeGate` (`all` \| `dfd`) — and checklist
options can carry their own `scopeGate` too (e.g. the CRM staging option is
DFD-only within an otherwise all-scope question).

## Admin UI — `psbuilder/admin.html`

- **Token gate**: on load, prompt for a GitHub fine-grained PAT (repo-scoped
  to this repo, Contents: read/write only). Stored in `localStorage` only.
- **Questions tab**: reorderable list; add/edit/delete; form fields match
  the schema per question type (stepper: min/max/default; checklist:
  options list; toggle: default).
- **Activities tab**: table (Phase / Description / Skill Required /
  Task Type / Location / Trips / Trigger), filterable by phase; add/edit/
  delete; trigger is a structured picker (dropdown + dependent fields), not
  free text.
- **Save**: `GET` current file SHA, `PUT` updated JSON back to
  `psbuilder/config.json` on `master` via GitHub Contents API. Success shows
  the commit URL. On 409 (stale SHA), show "config changed since you
  loaded it — reload and redo your edit," no auto-merge.

## Main tool changes — `psbuilder/index.html`

Replace `PRODUCTS`/`TYPES`/`SCOPES`/`baselineTasks()`/`buildQuestions()`
with a `fetch('./config.json')` on load. Existing render/generate/TSV-output
logic is restructured to walk the fetched config's `activities` list,
evaluating each activity's `trigger` against current answers, instead of
calling the old hardcoded functions. Output format (TSV columns, copy-to-
clipboard) is unchanged.

## Security

PAT lives only in the browser `localStorage` of whoever opens `admin.html`
and enters their own token. Never embedded in the deployed site or
committed. No shared secret to leak.

## Testing

Manual verification (static site, no test harness in this repo): load
`admin.html`, add/edit/delete an activity and a question, save, confirm the
commit lands on `master` with expected diff; reload `index.html`, run
through the questionnaire, confirm the TSV output matches pre-change
behavior for the default answers, then confirm the new/edited activity
appears/disappears correctly under its trigger condition.
