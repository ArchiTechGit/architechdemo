# PS Builder Config-Driven Rules + Admin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all PS Builder activity/question/gating data out of hardcoded JS into `psbuilder/config.json`, and add `psbuilder/admin.html` so any team member can edit that config and commit it straight to GitHub, no code editing required.

**Architecture:** `psbuilder/index.html` is rewritten to `fetch('./config.json')` at load and drive its existing render/generate/TSV logic off a generic trigger-evaluator instead of the current hardcoded `baselineTasks()`/`buildQuestions()` functions. `psbuilder/admin.html` is a new standalone page: a GitHub PAT gate, a Questions tab, an Activities tab, and a Save button that PUTs the edited JSON back to `psbuilder/config.json` on `master` via GitHub's Contents API. No build step, no backend, no test framework — this is a static two-page HTML/JS app, verified by manual browser checks (as the existing tool already is).

**Tech Stack:** Vanilla HTML/CSS/JS (matches existing `index.html`), GitHub REST Contents API (`GET`/`PUT /repos/{owner}/{repo}/contents/{path}`), no dependencies.

**Spec:** `docs/superpowers/specs/2026-08-19-psbuilder-config-admin-design.md`

## Global Constraints

- No new hosting/infra — stays a static site on GitHub (per spec "Non-goals").
- Trigger types are exactly: `always`, `typeEquals`, `stepperRepeat`, `stepperGate`, `toggleOn`, `checklistOption`, `checklistAny` — no others (per spec Data Model table).
- Admin saves commit directly to `master`, no PR flow (per spec Goals).
- GitHub PAT lives only in `localStorage`, entered per-user, never embedded in committed files (per spec Security).
- TSV output columns/format from `index.html` are unchanged (per spec "Main tool changes").
- Repo/path for config: this repo, branch `master`, file `psbuilder/config.json` (per spec "GitHub write mechanism").

---

### Task 1: Author `config.json` from the existing hardcoded data

**Files:**
- Create: `psbuilder/config.json`
- Reference (read-only, do not modify yet): `psbuilder/index.html:169-359` (current `PRODUCTS`, `TYPES`, `SCOPES`, `baselineTasks()`, `buildQuestions()`)

**Interfaces:**
- Produces: `psbuilder/config.json` matching the schema in the spec's "Data model" section — top-level keys `products`, `types`, `scopes`, `questions`, `activities`. Every activity has `id`, `phase`, `description`, `skillRequired`, `taskType`, `location`, `trips`, `trigger`. Every question has `id`, `type`, `label`, `sub` (optional), `scopeGate` (`"all"` or `"dfd"`), plus type-specific fields (`min`/`max`/`default` for stepper, `options` for checklist, `default` for toggle).

This task has no code to test yet — it's pure data authoring — so verification is a manual diff-by-eye against the current JS, done in Step 2.

- [ ] **Step 1: Write `psbuilder/config.json`**

Transcribe every activity and question currently in `index.html:169-359` into the schema below. Use this exact content (already transcribed and trigger-mapped from the current JS):

```json
{
  "products": [
    { "id": "wxcc", "name": "Webex Contact Centre", "note": "Available", "enabled": true },
    { "id": "wireless", "name": "Wireless", "note": "Coming soon", "enabled": false },
    { "id": "spaces", "name": "Cisco Spaces", "note": "Coming soon", "enabled": false }
  ],
  "types": [
    { "id": "new", "name": "New / Greenfield", "desc": "Brand-new WxCC deployment, nothing to migrate off." },
    { "id": "migration", "name": "Migration", "desc": "Customer is moving off another contact centre platform onto WxCC." }
  ],
  "scopes": [
    { "id": "dfd", "name": "Digital Front Door", "desc": "Core CC plus an AI Agent, AI Assistant/CRM integration and omnichannel layer." },
    { "id": "standard", "name": "Standard Contact Centre", "desc": "Core routing/IVR/queue/agent config only. No AI or digital layer." }
  ],
  "questions": [
    { "id": "workshops", "type": "stepper", "label": "How many discovery workshops do you need?", "sub": "Covers agent experience mapping, knowledge scripting, use-case gathering, CRM field mapping, omnichannel scope.", "min": 0, "max": 6, "default": 4, "scopeGate": "all" },
    { "id": "staging-channels", "type": "checklist", "label": "Which channels need environment staging / provisioning?", "sub": "Drives the Staging phase task list.", "scopeGate": "all", "options": [
      { "id": "sms", "label": "SMS asset provisioning", "default": false, "scopeGate": "all" },
      { "id": "webexconnect", "label": "Webex Connect account/asset setup", "default": false, "scopeGate": "all" },
      { "id": "facebook", "label": "Facebook Business Manager / Meta setup", "default": false, "scopeGate": "all" },
      { "id": "instagram", "label": "Instagram DM custom channel setup", "default": false, "scopeGate": "all" },
      { "id": "email", "label": "Email channel asset setup + mailbox routing", "default": false, "scopeGate": "all" },
      { "id": "crm", "label": "CRM environment access confirmed", "default": false, "scopeGate": "dfd" }
    ]},
    { "id": "agent-domains", "type": "stepper", "label": "How many AI Agent bots / knowledge domains need to be built?", "sub": "e.g. billing enquiries, product support, appointment booking — one domain per distinct topic area. Set to 0 to skip AI Agent entirely.", "min": 0, "max": 6, "default": 2, "scopeGate": "dfd" },
    { "id": "ai-assistant", "type": "toggle", "label": "Include AI Assistant + CRM integration for agents?", "sub": "Screen-pop, transcription/summarisation, suggested responses, wrap-up automation, write-back to CRM. CRM platform is whatever the customer runs (Dynamics, Salesforce, ServiceNow, etc).", "default": true, "scopeGate": "dfd" },
    { "id": "omni-channels", "type": "checklist", "label": "Which omnichannel channels are in scope for build?", "sub": "Each selected channel adds its build + integration task. Selecting any channel also adds an OmniChannel testing pass.", "scopeGate": "dfd", "options": [
      { "id": "webchat", "label": "Web chat widget (branding, pre-chat form, reason codes)", "default": true, "scopeGate": "all" },
      { "id": "sms-flow", "label": "SMS flow configuration", "default": true, "scopeGate": "all" },
      { "id": "email-routing", "label": "Email routing and triage configuration", "default": true, "scopeGate": "all" },
      { "id": "fb-messenger", "label": "Facebook Messenger integration and testing", "default": false, "scopeGate": "all" },
      { "id": "instagram-dm", "label": "Instagram DM custom channel integration and testing", "default": false, "scopeGate": "all" },
      { "id": "qb-api", "label": "Quick Button integration — external SMS sender API", "default": false, "scopeGate": "all" },
      { "id": "qb-desktop", "label": "Quick Button integration — external SMS agent desktop", "default": false, "scopeGate": "all" }
    ]},
    { "id": "reporting", "type": "checklist", "label": "Which reporting / analytics components are needed?", "sub": "Optional on every engagement type.", "scopeGate": "all", "options": [
      { "id": "topic-analytics", "label": "Topic analytics configuration", "default": false, "scopeGate": "all" },
      { "id": "analyzer-dashboard", "label": "Analyzer dashboard setup", "default": false, "scopeGate": "all" },
      { "id": "dashboard-embed", "label": "Dashboard embedding into Agent Desktop", "default": false, "scopeGate": "all" },
      { "id": "journey-data", "label": "Journey Data Service configuration", "default": false, "scopeGate": "all" }
    ]},
    { "id": "agent-training", "type": "stepper", "label": "How many agent training sessions are needed?", "sub": "Delivered at client site.", "min": 0, "max": 6, "default": 2, "scopeGate": "all" },
    { "id": "supervisor-training", "type": "toggle", "label": "Include supervisor training (queue monitoring, reporting)?", "default": true, "scopeGate": "all" }
  ],
  "activities": [
    { "id": "legacy-review", "phase": "Design", "description": "Legacy platform environment review & migration mapping", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "typeEquals", "value": "migration" } },
    { "id": "legacy-parallel-run", "phase": "Staging", "description": "Legacy platform parallel-run validation", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "typeEquals", "value": "migration" } },
    { "id": "legacy-decommission", "phase": "Project Completion & Handover", "description": "Legacy platform decommission", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "typeEquals", "value": "migration" } },
    { "id": "kickoff", "phase": "Kickoff", "description": "Kick Off Session with Stakeholders", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "existing-env-review", "phase": "Design", "description": "WxCC — Existing Environment Review", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "skills-team-queue-design", "phase": "Design", "description": "WxCC — Skills, Team, Queue Design", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "design-doc-signoff", "phase": "Design", "description": "Design Documentation & Sign-off", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "a2q-process", "phase": "Staging", "description": "WxCC A2Q Process", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "tenant-provisioning", "phase": "Staging", "description": "Webex Contact Centre tenant provisioning and validation", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "tenant-org-settings", "phase": "Implementation", "description": "Tenant & Org General Settings", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "site-config", "phase": "Implementation", "description": "Site Configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "teams-config", "phase": "Implementation", "description": "Teams Configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "queue-config", "phase": "Implementation", "description": "Queue Configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "skills-based-routing", "phase": "Implementation", "description": "Skills Based Routing Configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "entry-point-config", "phase": "Implementation", "description": "Entry Point Configurations", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "channel-cx-settings", "phase": "Implementation", "description": "Channel/CX settings (voice, chat, SMS, email, Messenger, Instagram)", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "voice-ivr-build", "phase": "Implementation", "description": "Voice IVR/flow build (greetings, menus, text-to-speech, VIP treatment)", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "business-hours-config", "phase": "Implementation", "description": "Business hours and holiday treatment configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "wrapup-code-config", "phase": "Implementation", "description": "Wrap-up code configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "agent-desktop-layout", "phase": "Implementation", "description": "Agent Desktop layout customisation", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "functional-test-plan-doc", "phase": "Implementation", "description": "Detailed Functional Test Plan Document", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "functional-testing-voice", "phase": "Implementation", "description": "Detailed Functional Testing — Voice", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "uat-plan", "phase": "Implementation", "description": "User Acceptance Testing Plan", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "uat-execution", "phase": "Implementation", "description": "User Acceptance Testing Execution (assistance)", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "remediations", "phase": "Implementation", "description": "Remediations", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "quick-ref-guide", "phase": "Project Completion & Handover", "description": "Quick Reference Guide development", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "production-cutover", "phase": "Project Completion & Handover", "description": "Production cutover", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "hypercare", "phase": "Project Completion & Handover", "description": "Hypercare support period", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "as-built-doc", "phase": "Project Completion & Handover", "description": "As-built documentation", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "always" } },
    { "id": "workshop-discovery", "phase": "Design", "description": "Workshop {{n}} — discovery session", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "stepperRepeat", "questionId": "workshops" } },
    { "id": "staging-sms", "phase": "Staging", "description": "SMS asset provisioning", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "staging-channels", "optionId": "sms" } },
    { "id": "staging-webexconnect", "phase": "Staging", "description": "Webex Connect account/asset setup", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "staging-channels", "optionId": "webexconnect" } },
    { "id": "staging-facebook", "phase": "Staging", "description": "Facebook Business Manager / Meta setup", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "staging-channels", "optionId": "facebook" } },
    { "id": "staging-instagram", "phase": "Staging", "description": "Instagram DM custom channel setup", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "staging-channels", "optionId": "instagram" } },
    { "id": "staging-email", "phase": "Staging", "description": "Email channel asset setup + mailbox routing", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "staging-channels", "optionId": "email" } },
    { "id": "staging-crm", "phase": "Staging", "description": "CRM environment access confirmed", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "staging-channels", "optionId": "crm" } },
    { "id": "kb-content-sourcing", "phase": "Implementation", "description": "Knowledge base content sourcing", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "stepperGate", "questionId": "agent-domains" } },
    { "id": "intent-routing-config", "phase": "Implementation", "description": "Intent-based routing configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "stepperGate", "questionId": "agent-domains" } },
    { "id": "kb-accuracy-testing", "phase": "Implementation", "description": "Knowledge accuracy testing", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "stepperGate", "questionId": "agent-domains" } },
    { "id": "ai-agent-testing-remediation", "phase": "Implementation", "description": "Agent Detailed Testing & Remediation", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "stepperGate", "questionId": "agent-domains" } },
    { "id": "functional-testing-ai-agent", "phase": "Implementation", "description": "Detailed Functional Testing — AI Agent", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "stepperGate", "questionId": "agent-domains" } },
    { "id": "ai-agent-domain-build", "phase": "Implementation", "description": "AI Agent build — knowledge domain {{n}} FAQ", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "stepperRepeat", "questionId": "agent-domains" } },
    { "id": "workshop-ai-assistant-usecases", "phase": "Design", "description": "Workshop — AI Assistant Use Cases", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "toggleOn", "questionId": "ai-assistant" } },
    { "id": "workshop-crm-field-mapping", "phase": "Design", "description": "Workshop — CRM Field Mapping", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "toggleOn", "questionId": "ai-assistant" } },
    { "id": "crm-access-confirmed", "phase": "Staging", "description": "CRM environment access and credentials confirmed", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "toggleOn", "questionId": "ai-assistant" } },
    { "id": "screen-pop-config", "phase": "Implementation", "description": "Screen-pop configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "toggleOn", "questionId": "ai-assistant" } },
    { "id": "call-transcription-config", "phase": "Implementation", "description": "Call transcription and summarisation enablement", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "toggleOn", "questionId": "ai-assistant" } },
    { "id": "suggested-response-config", "phase": "Implementation", "description": "Suggested response configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "toggleOn", "questionId": "ai-assistant" } },
    { "id": "wrapup-task-automation-config", "phase": "Implementation", "description": "Wrap-up and task automation configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "toggleOn", "questionId": "ai-assistant" } },
    { "id": "writeback-mapping-config", "phase": "Implementation", "description": "Write-back mapping (notes, summaries, outcomes into CRM)", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "toggleOn", "questionId": "ai-assistant" } },
    { "id": "functional-testing-ai-assistant", "phase": "Implementation", "description": "Detailed Functional Testing — AI Assistant", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "toggleOn", "questionId": "ai-assistant" } },
    { "id": "omni-webchat", "phase": "Implementation", "description": "Web chat widget (branding, pre-chat form, reason codes)", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "omni-channels", "optionId": "webchat" } },
    { "id": "omni-sms-flow", "phase": "Implementation", "description": "SMS flow configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "omni-channels", "optionId": "sms-flow" } },
    { "id": "omni-email-routing", "phase": "Implementation", "description": "Email routing and triage configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "omni-channels", "optionId": "email-routing" } },
    { "id": "omni-fb-messenger", "phase": "Implementation", "description": "Facebook Messenger integration and testing", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "omni-channels", "optionId": "fb-messenger" } },
    { "id": "omni-instagram-dm", "phase": "Implementation", "description": "Instagram DM custom channel integration and testing", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "omni-channels", "optionId": "instagram-dm" } },
    { "id": "omni-qb-api", "phase": "Implementation", "description": "Quick Button integration — external SMS sender API", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "omni-channels", "optionId": "qb-api" } },
    { "id": "omni-qb-desktop", "phase": "Implementation", "description": "Quick Button integration — external SMS agent desktop", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "omni-channels", "optionId": "qb-desktop" } },
    { "id": "workshop-omnichannel-scope", "phase": "Design", "description": "Workshop — Omnichannel Scope", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistAny", "questionId": "omni-channels" } },
    { "id": "functional-testing-omnichannel", "phase": "Implementation", "description": "Detailed Functional Testing — OmniChannel", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistAny", "questionId": "omni-channels" } },
    { "id": "topic-analytics-config", "phase": "Implementation", "description": "Topic analytics configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "reporting", "optionId": "topic-analytics" } },
    { "id": "analyzer-dashboard-setup", "phase": "Implementation", "description": "Analyzer dashboard setup", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "reporting", "optionId": "analyzer-dashboard" } },
    { "id": "dashboard-embed-config", "phase": "Implementation", "description": "Dashboard embedding into Agent Desktop", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "reporting", "optionId": "dashboard-embed" } },
    { "id": "journey-data-config", "phase": "Implementation", "description": "Journey Data Service configuration", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Office", "trips": 0, "trigger": { "type": "checklistOption", "questionId": "reporting", "optionId": "journey-data" } },
    { "id": "agent-training-task", "phase": "Project Completion & Handover", "description": "Agent training (desktop, call/chat handling, wrap-up codes) — {{n}} sessions", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Client Site", "trips": 1, "trigger": { "type": "stepperGate", "questionId": "agent-training" } },
    { "id": "supervisor-training-task", "phase": "Project Completion & Handover", "description": "Supervisor training (queue monitoring, reporting)", "skillRequired": "Collaboration", "taskType": "ArchiTech Activity", "location": "Client Site", "trips": 1, "trigger": { "type": "toggleOn", "questionId": "supervisor-training" } }
  ]
}
```

- [ ] **Step 2: Validate JSON and cross-check against the source**

Run: `node -e "JSON.parse(require('fs').readFileSync('psbuilder/config.json','utf8')); console.log('valid json')"`
Expected: `valid json`

Then manually diff activity/question counts against `index.html:169-359`:
count of `activities` entries should be 61 (29 baseline incl. 3 migration-only, 1 workshop-repeat, 6 staging-channel, 5 agent-domain-gate + 1 repeat, 9 ai-assistant, 7 omni-channel + 2 derived, 4 reporting, 2 training) — confirm by counting array entries: `node -e "console.log(JSON.parse(require('fs').readFileSync('psbuilder/config.json','utf8')).activities.length)"` should print `61`.

- [ ] **Step 3: Commit**

```bash
git add psbuilder/config.json
git commit -m "feat(psbuilder): add config.json data model for activities and questions"
```

---

### Task 2: Rewrite `index.html` to consume `config.json` via a trigger evaluator

**Files:**
- Modify: `psbuilder/index.html:169-359` (delete `PRODUCTS`/`TYPES`/`SCOPES`/`baselineTasks()`/`buildQuestions()`, replace with config fetch + trigger evaluator)
- Modify: `psbuilder/index.html` wherever `PRODUCTS`, `TYPES`, `SCOPES`, `baselineTasks(...)`, `buildQuestions(...)` are referenced downstream (rendering, `createEstimate()`) — grep for each name first.

**Interfaces:**
- Consumes: `psbuilder/config.json` (Task 1) — global fetch result stored as `let CONFIG = null;`.
- Produces: `function loadConfig(): Promise<void>` — fetches and assigns `CONFIG`. `function evaluateActivities(typeId, scopeId, answers): Array<{phase, task, location, trips}>` — pure function, no DOM access, takes the current selections/answers and returns the flat task list in the same shape the old `baselineTasks()`/`generate()` calls produced (`{phase, task, location, trips}`), so `createEstimate()` needs no changes to its TSV-building logic.

- [ ] **Step 1: Locate every current usage of the structures being replaced**

Run: `grep -n "PRODUCTS\|TYPES\|SCOPES\|baselineTasks\|buildQuestions" psbuilder/index.html`

Note every line number returned — each one needs updating in the steps below. (Expect hits in the render functions `renderProducts`, `renderTypes`, `renderScopes`, `buildAndShowQuestions`, and `createEstimate`.)

- [ ] **Step 2: Add config loading**

Replace lines `psbuilder/index.html:169-359` (the `PRODUCTS` const through the end of `buildQuestions()`) with:

```js
    let CONFIG = null;

    async function loadConfig() {
      const res = await fetch('./config.json');
      CONFIG = await res.json();
    }

    // ─── Trigger evaluation: turns config.activities + current answers into the flat task list ───
    function fillTemplate(str, n) {
      return str.replace(/\{\{n\}\}/g, n);
    }

    function evaluateActivities(typeId, scopeId, answers) {
      const lines = [];
      for (const activity of CONFIG.activities) {
        const t = activity.trigger;
        const push = (n) => lines.push({
          phase: activity.phase,
          task: n === undefined ? activity.description : fillTemplate(activity.description, n),
          location: activity.location,
          trips: activity.trips,
        });

        if (t.type === 'always') {
          push();
        } else if (t.type === 'typeEquals') {
          if (typeId === t.value) push();
        } else if (t.type === 'stepperGate') {
          const n = answers[t.questionId];
          if (n > 0) push(n);
        } else if (t.type === 'stepperRepeat') {
          const n = answers[t.questionId] || 0;
          for (let i = 1; i <= n; i++) push(i);
        } else if (t.type === 'toggleOn') {
          if (answers[t.questionId]) push();
        } else if (t.type === 'checklistOption') {
          const opts = answers[t.questionId] || [];
          if (opts.includes(t.optionId)) push();
        } else if (t.type === 'checklistAny') {
          const opts = answers[t.questionId] || [];
          if (opts.length > 0) push();
        }
      }
      return lines;
    }

    function visibleQuestions(scopeId) {
      return CONFIG.questions.filter(q => q.scopeGate === 'all' || q.scopeGate === scopeId);
    }

    function visibleOptions(question, scopeId) {
      return question.options.filter(o => o.scopeGate === 'all' || o.scopeGate === scopeId);
    }
```

- [ ] **Step 3: Update the render/selection code to read from `CONFIG` and build a live `answers` map**

For each line found in Step 1's grep, replace the reference:
- `renderProducts()`: replace `PRODUCTS` with `CONFIG.products`, and `disabled: false/true` checks with `!p.enabled`.
- `renderTypes()`: replace `TYPES` with `CONFIG.types`.
- `renderScopes()`: replace `SCOPES` with `CONFIG.scopes`.
- `buildAndShowQuestions()`: replace `questions = buildQuestions(selectedScope)` with `questions = visibleQuestions(selectedScope)`. Each rendered question must build its own entry in a module-level `answers` object as the user interacts:
  - stepper questions: `answers[q.id] = currentValue` (a plain number), updated by the existing `stepQuestion()` handler.
  - toggle questions: `answers[q.id] = currentBoolean`, updated by the existing `toggleQuestion()` handler.
  - checklist questions: `answers[q.id] = [...checkedOptionIds]`, updated by the existing `toggleOption()` handler — push/remove `oid` from the array instead of mutating an `option.checked` flag, and use `visibleOptions(q, selectedScope)` when rendering the option list so DFD-only options stay hidden outside DFD.
- `createEstimate()`: replace the call that builds `baselineTasks(selectedType).concat(...questions.map(q => q.generate(...)))` with a single call: `const lines = evaluateActivities(selectedType, selectedScope, answers);` — everything downstream (the TSV-building loop over `lines`) stays the same since `evaluateActivities` returns the same `{phase, task, location, trips}` shape.
- Wherever the page previously called `buildQuestions(scopeId)` directly (e.g. on scope change) call `visibleQuestions(scopeId)` instead, and re-seed `answers` from each question's `default` (steppers/toggles) or its options' `default` flags (checklists) whenever questions are rebuilt.

- [ ] **Step 4: Call `loadConfig()` before the app can be used**

Find the script's bottom-level initialization call (likely `renderProducts();` or similar run at parse time — check via `grep -n "renderProducts();" psbuilder/index.html`). Wrap page startup so nothing renders until config is loaded:

```js
    loadConfig().then(() => {
      renderProducts();
      renderTypes();
      renderScopes();
    });
```

- [ ] **Step 5: Manual verification — behavior parity**

This is a static site with no test runner, so verify by hand:
1. Serve the folder locally: `npx --yes http-server psbuilder -p 8080` (or open `psbuilder/index.html` directly in a browser — `fetch('./config.json')` needs `http://`, not `file://`, so use the http-server).
2. Open `http://localhost:8080/index.html`.
3. Select `Webex Contact Centre` → `Migration` → `Digital Front Door`.
4. Leave all questions at default, generate the estimate.
5. Confirm the output TSV contains all 3 migration-only tasks, all 26 always-included tasks, 4 workshop lines (default 4), 5 AI-agent-gate tasks + 2 domain-FAQ lines (default 2), all 9 AI-assistant tasks (default on), 3 default-checked omnichannel tasks + workshop + testing line, 1 agent-training line reading "— 2 sessions", 1 supervisor-training line. Total non-header rows should be 26 + 3 + 4 + 6 + 9 + (3+2) + 1 + 1 = 55.
6. Switch scope to `Standard Contact Centre`, confirm all DFD-gated questions (agent-domains, ai-assistant, omni-channels) disappear from the questionnaire and their tasks don't appear in output.

- [ ] **Step 6: Commit**

```bash
git add psbuilder/index.html
git commit -m "feat(psbuilder): drive index.html from config.json instead of hardcoded JS"
```

---

### Task 3: Build `admin.html` — token gate + config loading

**Files:**
- Create: `psbuilder/admin.html`

**Interfaces:**
- Consumes: `psbuilder/config.json` (Task 1) via `GET https://api.github.com/repos/{owner}/{repo}/contents/psbuilder/config.json` (using the token, so it also works before any public caching, and so the same call can capture the `sha` needed later for saving).
- Produces: `let GITHUB_TOKEN` (module-level, read from `localStorage.getItem('psbuilder_admin_token')`), `let REPO_OWNER`, `let REPO_NAME` (hardcode to this repo's actual owner/name — determine via `git remote get-url origin`), `let CONFIG`, `let CONFIG_SHA` (module-level, populated after the initial fetch, consumed by Task 6's save step).

- [ ] **Step 1: Determine the repo owner/name for the hardcoded API calls**

Run: `git remote get-url origin`
Expected output is a URL like `https://github.com/ArchiTechGit/architechdemo` or `git@github.com:ArchiTechGit/architechdemo.git` — extract owner (`ArchiTechGit`) and repo (`architechdemo`) for use in Step 3.

- [ ] **Step 2: Write the page shell + token gate**

Create `psbuilder/admin.html` with the same visual style as `index.html` (reuse its `<style>` block's CSS variables and card/button classes — copy the `:root` variables and `.pick-card`, `.btn-primary`, `.btn-ghost`, `.q-card` rules verbatim from `psbuilder/index.html`). Body structure:

```html
<div class="page">
  <div class="header">
    <span class="header-badge">PS BUILDER — ADMIN</span>
  </div>

  <div id="token-gate">
    <h2 class="page-title">Enter GitHub access token</h2>
    <p class="page-desc">
      Needs a fine-grained personal access token scoped to this repo only, with Contents: Read and write permission.
      Stored only in this browser's local storage — never sent anywhere except GitHub's API.
    </p>
    <input type="password" id="token-input" placeholder="github_pat_..." style="width:100%;max-width:480px;padding:12px;border-radius:8px;border:1px solid var(--border);background:var(--surface-1);color:var(--text);font-family:var(--font);margin-bottom:12px;" />
    <br/>
    <button class="btn-primary" onclick="saveTokenAndLoad()">Continue</button>
  </div>

  <div id="admin-app" style="display:none;">
    <div class="section-label">Questions</div>
    <div id="questions-list"></div>
    <div class="section-label" style="margin-top:32px;">Activities</div>
    <div id="activities-list"></div>
    <button class="btn-primary" onclick="saveConfig()">Save to GitHub</button>
    <span id="save-status" style="margin-left:14px;color:var(--muted);font-size:13px;"></span>
  </div>
</div>
```

- [ ] **Step 3: Write the token + config load script**

```html
<script>
  const REPO_OWNER = 'ArchiTechGit';
  const REPO_NAME = 'architechdemo';
  const CONFIG_PATH = 'psbuilder/config.json';
  let GITHUB_TOKEN = localStorage.getItem('psbuilder_admin_token') || '';
  let CONFIG = null;
  let CONFIG_SHA = null;

  async function fetchConfigFromGitHub() {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_PATH}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
    const data = await res.json();
    CONFIG_SHA = data.sha;
    CONFIG = JSON.parse(atob(data.content));
  }

  async function saveTokenAndLoad() {
    const input = document.getElementById('token-input').value.trim();
    if (!input) return;
    GITHUB_TOKEN = input;
    localStorage.setItem('psbuilder_admin_token', GITHUB_TOKEN);
    try {
      await fetchConfigFromGitHub();
      document.getElementById('token-gate').style.display = 'none';
      document.getElementById('admin-app').style.display = 'block';
      renderQuestionsList();
      renderActivitiesList();
    } catch (e) {
      alert('Could not load config — check your token has Contents read/write on this repo. ' + e.message);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (GITHUB_TOKEN) saveTokenAndLoad();
  });
</script>
```

(`renderQuestionsList`, `renderActivitiesList`, `saveConfig` are stubbed as no-ops for now — implemented in Tasks 4-6.) Add empty stub functions so the page doesn't throw:

```html
<script>
  function renderQuestionsList() {}
  function renderActivitiesList() {}
  function saveConfig() {}
</script>
```

- [ ] **Step 4: Manual verification**

1. Serve locally: `npx --yes http-server psbuilder -p 8080`.
2. Open `http://localhost:8080/admin.html`.
3. Confirm the token gate renders, matching `index.html`'s visual style.
4. Enter an invalid token (e.g. `test123`), click Continue, confirm the alert fires with a 401-style error (GitHub API will reject it) and the gate stays visible.
5. (If you have a real fine-grained PAT for this repo handy, enter it and confirm the gate hides and `admin-app` shows with empty Questions/Activities sections — full rendering comes in later tasks.)

- [ ] **Step 5: Commit**

```bash
git add psbuilder/admin.html
git commit -m "feat(psbuilder): add admin.html with GitHub token gate and config fetch"
```

---

### Task 4: Admin — Questions tab (list, add, edit, delete)

**Files:**
- Modify: `psbuilder/admin.html` (replace the `renderQuestionsList` stub from Task 3)

**Interfaces:**
- Consumes: `CONFIG.questions` (array, populated by Task 3's `fetchConfigFromGitHub`).
- Produces: mutates `CONFIG.questions` in place; `function renderQuestionsList()` re-renders the DOM from current `CONFIG.questions` — called after every add/edit/delete so the list always reflects state; no return value.

- [ ] **Step 1: Replace the `renderQuestionsList` stub with a real renderer + CRUD handlers**

```html
<script>
  function renderQuestionsList() {
    const root = document.getElementById('questions-list');
    root.innerHTML = '';
    CONFIG.questions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'q-card';
      card.innerHTML = `
        <div class="q-label">${q.label} <span style="color:var(--muted);font-weight:400;">(${q.type}, scope: ${q.scopeGate})</span></div>
        <div class="q-sub">id: ${q.id}${q.sub ? ' — ' + q.sub : ''}</div>
        <button class="btn-ghost" onclick="editQuestion(${idx})">Edit</button>
        <button class="btn-ghost" onclick="deleteQuestion(${idx})">Delete</button>
      `;
      root.appendChild(card);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-primary';
    addBtn.textContent = 'Add question';
    addBtn.onclick = () => editQuestion(-1);
    root.appendChild(addBtn);
  }

  function deleteQuestion(idx) {
    if (!confirm(`Delete question "${CONFIG.questions[idx].label}"? Any activities gated on it will stop firing.`)) return;
    CONFIG.questions.splice(idx, 1);
    renderQuestionsList();
  }

  function editQuestion(idx) {
    const existing = idx >= 0 ? CONFIG.questions[idx] : { id: '', type: 'stepper', label: '', sub: '', scopeGate: 'all', min: 0, max: 6, default: 0, options: [] };
    const id = prompt('Question id (short, unique, used by activity triggers):', existing.id);
    if (id === null) return;
    const type = prompt('Type (stepper / checklist / toggle):', existing.type);
    if (type === null) return;
    const label = prompt('Label (question text shown to user):', existing.label);
    if (label === null) return;
    const sub = prompt('Sub-text (optional helper text):', existing.sub || '');
    if (sub === null) return;
    const scopeGate = prompt('Scope gate (all / dfd):', existing.scopeGate);
    if (scopeGate === null) return;

    const updated = { id, type, label, sub, scopeGate };
    if (type === 'stepper') {
      updated.min = Number(prompt('Min:', existing.min ?? 0));
      updated.max = Number(prompt('Max:', existing.max ?? 6));
      updated.default = Number(prompt('Default:', existing.default ?? 0));
    } else if (type === 'toggle') {
      updated.default = confirm('Default on? (OK = yes, Cancel = no)');
    } else if (type === 'checklist') {
      updated.options = existing.options || [];
    }

    if (idx >= 0) CONFIG.questions[idx] = updated;
    else CONFIG.questions.push(updated);
    renderQuestionsList();
  }
</script>
```

Note: checklist option editing (add/remove options within a question) is handled in Task 5 alongside activities, since options and their gating activities are edited together in practice.

- [ ] **Step 2: Manual verification**

1. Serve locally, open `admin.html`, load with a valid token (or temporarily stub `GITHUB_TOKEN`/`CONFIG` in the browser console with a copy of `config.json` to test offline: `CONFIG = {questions: [...], activities: [...]}; renderQuestionsList();`).
2. Confirm all 8 questions from `config.json` render with correct label/type/scope.
3. Click "Add question", fill prompts for a throwaway stepper question, confirm it appears in the list.
4. Click "Edit" on it, change its label, confirm the list updates.
5. Click "Delete" on it, confirm it's removed after the confirm dialog.

- [ ] **Step 3: Commit**

```bash
git add psbuilder/admin.html
git commit -m "feat(psbuilder): add admin questions CRUD"
```

---

### Task 5: Admin — Activities tab (list, add, edit, delete, structured trigger picker)

**Files:**
- Modify: `psbuilder/admin.html` (replace the `renderActivitiesList` stub from Task 3)

**Interfaces:**
- Consumes: `CONFIG.activities` (array), `CONFIG.questions` (array, to populate the trigger picker's question dropdown and checklist option dropdown).
- Produces: mutates `CONFIG.activities` in place; `function renderActivitiesList()` re-renders from current state.

- [ ] **Step 1: Replace the `renderActivitiesList` stub with a table renderer + CRUD**

```html
<script>
  function describeTrigger(t) {
    if (t.type === 'always') return 'Always';
    if (t.type === 'typeEquals') return `Type = ${t.value}`;
    if (t.type === 'stepperGate') return `Stepper "${t.questionId}" > 0`;
    if (t.type === 'stepperRepeat') return `Stepper "${t.questionId}" (repeat per unit)`;
    if (t.type === 'toggleOn') return `Toggle "${t.questionId}" on`;
    if (t.type === 'checklistOption') return `Checklist "${t.questionId}" → "${t.optionId}"`;
    if (t.type === 'checklistAny') return `Checklist "${t.questionId}" (any checked)`;
    return 'Unknown';
  }

  function renderActivitiesList() {
    const root = document.getElementById('activities-list');
    root.innerHTML = '';
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.innerHTML = `<tr style="text-align:left;color:var(--muted);font-size:12px;">
      <th style="padding:6px;">Phase</th><th style="padding:6px;">Description</th>
      <th style="padding:6px;">Trigger</th><th style="padding:6px;">Location</th>
      <th style="padding:6px;">Trips</th><th></th></tr>`;
    CONFIG.activities.forEach((a, idx) => {
      const row = document.createElement('tr');
      row.style.borderTop = '1px solid var(--border)';
      row.innerHTML = `
        <td style="padding:6px;font-size:13px;">${a.phase}</td>
        <td style="padding:6px;font-size:13px;">${a.description}</td>
        <td style="padding:6px;font-size:12px;color:var(--muted);">${describeTrigger(a.trigger)}</td>
        <td style="padding:6px;font-size:13px;">${a.location}</td>
        <td style="padding:6px;font-size:13px;">${a.trips}</td>
        <td style="padding:6px;"><button class="btn-ghost" onclick="editActivity(${idx})">Edit</button>
        <button class="btn-ghost" onclick="deleteActivity(${idx})">Delete</button></td>`;
      table.appendChild(row);
    });
    root.appendChild(table);
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-primary';
    addBtn.textContent = 'Add activity';
    addBtn.onclick = () => editActivity(-1);
    root.appendChild(addBtn);
  }

  function deleteActivity(idx) {
    if (!confirm(`Delete activity "${CONFIG.activities[idx].description}"?`)) return;
    CONFIG.activities.splice(idx, 1);
    renderActivitiesList();
  }

  function buildTriggerFromPrompts(existingTrigger) {
    const validTypes = ['always', 'typeEquals', 'stepperGate', 'stepperRepeat', 'toggleOn', 'checklistOption', 'checklistAny'];
    const type = prompt(`Trigger type (${validTypes.join(' / ')}):`, existingTrigger?.type || 'always');
    if (!validTypes.includes(type)) { alert('Invalid trigger type — no changes made.'); return existingTrigger; }
    if (type === 'always') return { type };
    if (type === 'typeEquals') return { type, value: prompt('Type id (e.g. migration):', existingTrigger?.value || 'migration') };
    if (type === 'toggleOn' || type === 'stepperGate' || type === 'stepperRepeat' || type === 'checklistAny') {
      return { type, questionId: prompt('Question id:', existingTrigger?.questionId || '') };
    }
    if (type === 'checklistOption') {
      return {
        type,
        questionId: prompt('Question id:', existingTrigger?.questionId || ''),
        optionId: prompt('Option id:', existingTrigger?.optionId || ''),
      };
    }
    return existingTrigger;
  }

  function editActivity(idx) {
    const existing = idx >= 0 ? CONFIG.activities[idx] : {
      id: '', phase: 'Implementation', description: '', skillRequired: 'Collaboration',
      taskType: 'ArchiTech Activity', location: 'Office', trips: 0, trigger: { type: 'always' },
    };
    const id = prompt('Activity id (short, unique):', existing.id);
    if (id === null) return;
    const phase = prompt('Phase (Kickoff / Design / Staging / Implementation / Project Completion & Handover):', existing.phase);
    if (phase === null) return;
    const description = prompt('Description (use {{n}} where a count should be substituted):', existing.description);
    if (description === null) return;
    const location = prompt('Location (Office / Client Site):', existing.location);
    if (location === null) return;
    const trips = Number(prompt('Onsite trips (0 or 1):', existing.trips));
    const trigger = buildTriggerFromPrompts(existing.trigger);

    const updated = { id, phase, description, skillRequired: 'Collaboration', taskType: 'ArchiTech Activity', location, trips, trigger };
    if (idx >= 0) CONFIG.activities[idx] = updated;
    else CONFIG.activities.push(updated);
    renderActivitiesList();
  }
</script>
```

- [ ] **Step 2: Manual verification**

1. Serve locally, open `admin.html`, load config (real token or console-stub as in Task 4).
2. Confirm all 61 activities render in the table with human-readable trigger descriptions.
3. Add a throwaway activity with trigger type `checklistOption`, questionId `staging-channels`, optionId `sms`; confirm it appears with "Checklist "staging-channels" → "sms"".
4. Edit an existing activity's description, confirm the table updates.
5. Delete the throwaway activity, confirm it's removed.

- [ ] **Step 3: Commit**

```bash
git add psbuilder/admin.html
git commit -m "feat(psbuilder): add admin activities CRUD with structured trigger picker"
```

---

### Task 6: Admin — Save to GitHub

**Files:**
- Modify: `psbuilder/admin.html` (replace the `saveConfig` stub from Task 3)

**Interfaces:**
- Consumes: `CONFIG` (current in-memory edited state), `CONFIG_SHA` (from Task 3's fetch), `GITHUB_TOKEN`, `REPO_OWNER`, `REPO_NAME`, `CONFIG_PATH` (all from Task 3).
- Produces: on success, updates `CONFIG_SHA` to the new commit's file SHA (so a second save in the same session works without reloading); writes status text into `#save-status`.

- [ ] **Step 1: Implement `saveConfig`**

```html
<script>
  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  async function saveConfig() {
    const statusEl = document.getElementById('save-status');
    statusEl.textContent = 'Saving...';
    const body = {
      message: 'chore(psbuilder): update config via admin',
      content: utf8ToBase64(JSON.stringify(CONFIG, null, 2)),
      sha: CONFIG_SHA,
      branch: 'master',
    };
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.status === 409) {
      statusEl.textContent = 'Config changed since you loaded it — reload the page and redo your edit.';
      return;
    }
    if (!res.ok) {
      const errText = await res.text();
      statusEl.textContent = `Save failed (${res.status}): ${errText}`;
      return;
    }
    const data = await res.json();
    CONFIG_SHA = data.content.sha;
    statusEl.innerHTML = `Saved — <a href="${data.commit.html_url}" target="_blank" style="color:var(--cyan);">view commit</a>`;
  }
</script>
```

- [ ] **Step 2: Manual verification (requires a real fine-grained PAT scoped to this repo, Contents: read/write)**

1. Serve locally, open `admin.html`, enter a real token.
2. Make a small, reversible edit (e.g. add a throwaway question via Task 4's Add flow).
3. Click "Save to GitHub", confirm `#save-status` shows "Saved — view commit" with a working link.
4. Run `git pull` in the repo and confirm the new commit appears on `master` touching only `psbuilder/config.json`, with the throwaway question present in the diff.
5. Revert the throwaway change: repeat steps 2-3 removing it via Delete, confirming a second save in the same session succeeds without needing to reload (validates `CONFIG_SHA` gets updated after the first save).
6. To verify the 409 path: open the page in two browser tabs, save from tab A, then attempt a save from tab B without reloading — confirm tab B shows the "reload and redo" message instead of erroring silently or overwriting.

- [ ] **Step 3: Commit**

```bash
git add psbuilder/admin.html
git commit -m "feat(psbuilder): wire admin save to GitHub Contents API"
```

---

## Self-Review Notes

- **Spec coverage:** Data model (Task 1), Admin UI questions/activities tabs (Tasks 4-5), token gate (Task 3), GitHub write mechanism incl. 409 handling (Task 6), main tool changes (Task 2), security (token never leaves localStorage, confirmed in Task 3 Step 3) — all covered.
- **Trigger types:** all 7 from the spec (`always`, `typeEquals`, `stepperRepeat`, `stepperGate`, `toggleOn`, `checklistOption`, `checklistAny`) appear in Task 1's data, Task 2's evaluator, and Task 5's picker — consistent across all three.
- **No test framework exists in this repo for static HTML tools** (confirmed by spec's own Testing section) — manual browser verification steps substitute for automated tests throughout, matching the existing tool's own verification approach.
