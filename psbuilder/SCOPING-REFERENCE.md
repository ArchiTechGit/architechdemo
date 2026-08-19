# PS Engagement Builder — Scoping Reference

Reference for generating a WxCC engagement task list without opening [psbuilder/index.html](index.html).
Give me the inputs below in any format, I output the same TSV table the tool produces
(header row: `Phase	Skill Required	Task Type	Description`, paste-ready into the engagement spreadsheet).

`Skill Required` is always **Collaboration**. `Task Type` is always **ArchiTech Activity**. Only `Phase` and `Description` vary per task.

## Inputs needed

1. **Product** — currently only `Webex Contact Centre` is live (Wireless / Cisco Spaces are stubbed, disabled).
2. **Engagement Type** — `New / Greenfield` or `Migration`.
3. **Engagement Scope** — `Digital Front Door` (DFD: core CC + AI Agent + AI Assistant/CRM + omnichannel) or `Standard Contact Centre` (routing/IVR/queue/agent config only, no AI/digital layer).
4. **Scoping question answers** (see below) — only ask the ones gated to your scope.

## Baseline tasks (always included, no question asked)

If Type = Migration, these 3 are prepended:
- Design — Legacy platform environment review & migration mapping
- Staging — Legacy platform parallel-run validation
- Project Completion & Handover — Legacy platform decommission

Then always, regardless of type/scope:
- Kickoff — Kick Off Session with Stakeholders
- Design — WxCC — Existing Environment Review
- Design — WxCC — Skills, Team, Queue Design
- Design — Design Documentation & Sign-off
- Staging — WxCC A2Q Process
- Staging — Webex Contact Centre tenant provisioning and validation
- Implementation — Tenant & Org General Settings
- Implementation — Site Configuration
- Implementation — Teams Configuration
- Implementation — Queue Configuration
- Implementation — Skills Based Routing Configuration
- Implementation — Entry Point Configurations
- Implementation — Channel/CX settings (voice, chat, SMS, email, Messenger, Instagram)
- Implementation — Voice IVR/flow build (greetings, menus, text-to-speech, VIP treatment)
- Implementation — Business hours and holiday treatment configuration
- Implementation — Wrap-up code configuration
- Implementation — Agent Desktop layout customisation
- Implementation — Detailed Functional Test Plan Document
- Implementation — Detailed Functional Testing — Voice
- Implementation — User Acceptance Testing Plan
- Implementation — User Acceptance Testing Execution (assistance)
- Implementation — Remediations
- Project Completion & Handover — Quick Reference Guide development
- Project Completion & Handover — Production cutover
- Project Completion & Handover — Hypercare support period
- Project Completion & Handover — As-built documentation

## Scoping questions

Ask in this order. AI-gated ones (marked **DFD only**) are skipped entirely for Standard scope.

| # | Question | Type | Default | Generates |
|---|---|---|---|---|
| 1 | How many discovery workshops? | stepper 0–6 | 4 | `n` × Design — "Workshop N — discovery session" |
| 2 | Which channels need staging/provisioning? | checklist | none checked | one Staging task per checked: SMS asset provisioning / Webex Connect account+asset setup / Facebook Business Manager+Meta setup / Instagram DM custom channel setup / Email channel asset setup + mailbox routing / CRM environment access confirmed (**option only visible if DFD**) |
| 3 **DFD only** | How many AI Agent bots/knowledge domains? | stepper 0–6 | 2 (0 if Standard) | if n=0: nothing. Else: 5 fixed Implementation tasks (Knowledge base content sourcing; Intent-based routing configuration; Knowledge accuracy testing; Agent Detailed Testing & Remediation; Detailed Functional Testing — AI Agent) + `n` × "AI Agent build — knowledge domain N FAQ" |
| 4 **DFD only** | Include AI Assistant + CRM integration? | toggle | on if DFD | if on: Design — Workshop AI Assistant Use Cases; Design — Workshop CRM Field Mapping; Staging — CRM environment access and credentials confirmed; Implementation — Screen-pop configuration; Implementation — Call transcription and summarisation enablement; Implementation — Suggested response configuration; Implementation — Wrap-up and task automation configuration; Implementation — Write-back mapping (notes, summaries, outcomes into CRM); Implementation — Detailed Functional Testing — AI Assistant |
| 5 **DFD only** | Which omnichannel channels in scope for build? | checklist | Web chat / SMS flow / Email routing pre-checked if DFD | one Implementation task per checked channel (Web chat widget; SMS flow configuration; Email routing and triage configuration; Facebook Messenger integration and testing; Instagram DM custom channel integration and testing; Quick Button — external SMS sender API; Quick Button — external SMS agent desktop). If ≥1 checked, also adds Design — Workshop Omnichannel Scope + Implementation — Detailed Functional Testing — OmniChannel |
| 6 | Which reporting/analytics components? | checklist | none checked | one Implementation task per checked: Topic analytics configuration / Analyzer dashboard setup / Dashboard embedding into Agent Desktop / Journey Data Service configuration |
| 7 | How many agent training sessions? | stepper 0–6 | 2 | if n=0: nothing. Else 1 task: Project Completion & Handover — "Agent training (desktop, call/chat handling, wrap-up codes) — N sessions" (location Client Site, 1 onsite trip) |
| 8 | Include supervisor training? | toggle | on | if on: Project Completion & Handover — Supervisor training (queue monitoring, reporting) (location Client Site, 1 onsite trip) |

## Onsite trip counter

Only two tasks ever count as onsite trips: agent training (question 7, if n>0) and supervisor training (question 8, if on) — each contributes 1 trip. Everything else is "Office" / 0 trips. The tool's "Onsite trips" summary is just the sum of those.

## What to give me

Fastest format — just answer inline, e.g.:

> Type: Migration. Scope: DFD. Workshops: 3. Staging channels: SMS, Email. AI domains: 2. AI Assistant: yes. Omnichannel: webchat, sms. Reporting: analyzer dashboard. Training: 3 sessions. Supervisor training: yes.

Any question you omit, I'll use the tool's default. I'll output the full TSV block (header + baseline + generated rows) ready to paste.
