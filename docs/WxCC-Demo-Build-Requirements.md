# WxCC Demo Environment — Build Requirements

> **Purpose:** Exact list of everything that must be built, configured, and validated in the Webex Contact Center demo org for all 10 Demo Guides to run as documented.  
> **Reference:** Based on `demoguides/index.html` — each item maps directly to a demo step or config field.

---

## Users & Personas

Two user accounts are needed. The same credentials are reused across multiple demos.

### Agent User
| Requirement | Detail |
|---|---|
| Account type | Webex CC Agent license |
| Desktop profile | Access to voice, chat, and email channels |
| Team assignment | At least one team |
| Queue assignments | Primary agent queue (voice); at least one chat/email queue |
| Concurrent interaction capacity | Minimum 2 (required for Omnichannel demo — voice + chat simultaneously) |
| Skill tags | At least one skill (e.g. "General") for skills-based routing |

### Supervisor User
| Requirement | Detail |
|---|---|
| Account type | Webex CC Supervisor license |
| Permissions | Silent monitoring, whisper coaching, barge-in (all three required) |
| Team visibility | Must have visibility over the agent's team |
| Analyzer access | Read + custom report create access required for Reporting demo |
| QM access | Recording playback, scorecard creation, coaching workflow access |

---

## Telephony

| Requirement | Detail |
|---|---|
| Inbound PSTN number | One claimed number mapped to the entry point |
| Entry point | Single entry point routing to the AI Agent workflow by default |
| Caller ID configured | Required for Epic screen pop in the Integrations demo |

---

## Demo 01 — AI Agents

### Webex Connect / AI Agent
| Requirement | Detail |
|---|---|
| AI Agent created | Built in Webex Connect AI Agent builder |
| Agent name | Friendly name used in greeting (e.g. "Aria") |
| Supported intents | Minimum: appointment lookup, prescription refill, billing enquiry |
| Resolution flow | At least one intent must fully resolve without escalation (to demo self-service) |
| Escalation intent | At least one intent that triggers handoff to a live agent |
| Escalation queue | A WxCC queue the AI agent escalates to when it can't resolve |
| Context handoff | Conversation transcript must appear on the agent desktop at escalation |
| Connect workflow | Named workflow routing the inbound number to the AI Agent |

### Flow
| Requirement | Detail |
|---|---|
| Entry point flow | Routes inbound call to Connect AI Agent workflow |

---

## Demo 02 — AI Assist

### AI Features
| Requirement | Detail |
|---|---|
| Live transcription | Enabled on the demo queue/channel profile |
| Agent Answers | Enabled — must surface KB article suggestions based on caller speech |
| Auto call summary | Enabled — must generate sentiment, key topics, and action items post-call |
| Summary CRM write | One-click write to CRM record must be demonstrated (at minimum show the button — see Integrations for full setup) |

### Flow
| Requirement | Detail |
|---|---|
| Connect workflow | Separate named workflow for the AI Assist demo (routes inbound call to a voice queue with AI features active) |
| Queue | Dedicated queue with AI Assist features enabled, agent assigned |

---

## Demo 03 — Agent Experience

### Desktop
| Requirement | Detail |
|---|---|
| Agent desktop profile | Custom profile (not default) showing at minimum: interaction panel, screen pop widget, AI transcript panel |
| Screen pop | Configured to fire on inbound call — must display caller data (name, account/patient info) |
| Softphone | Browser-based (no external softphone required) |
| Voice queue | At least one voice queue with the agent assigned |
| Specialist queue | A second queue for warm transfer destination (e.g. "Specialist" or "Billing") |
| Chat/email queue | At least one chat or email queue assigned to the agent for concurrent channel demo |
| Disposition codes | At least 3 disposition codes configured and assigned to the queue |

### Flow
| Requirement | Detail |
|---|---|
| Entry point flow | Routes inbound number to agent voice queue |

---

## Demo 04 — Supervisor Dashboard

### Real-Time Views
| Requirement | Detail |
|---|---|
| Real-time queue panel | Queue must have active calls during demo — either live or simulated via test calls |
| Agent state visibility | Supervisor must see agent state in real time (Available, In-Call, ACW, etc.) |
| Silent monitoring | Enabled in supervisor profile — must be able to join call without agent/caller awareness |
| Whisper coaching | Enabled in supervisor profile — must be able to speak to agent only |
| Barge-in | Enabled in supervisor profile — must be able to join as full participant |
| Team performance panel | Must show agent-level ACW duration and allow supervisor to change agent state or send a message |
| Multi-site view (optional) | For larger org demos — configure a second team or site if required |

> **Dependency:** Agent must be on an active call during this demo. Coordinate a test caller or have a colleague call in.

---

## Demo 05 — Flow Builder

### Flow
| Requirement | Detail |
|---|---|
| Demo flow | A pre-built, readable flow with clearly labelled nodes — must be simple enough to be visually understandable at a glance |
| Editable IVR menu | The flow must have a Menu node with at least 3 options (so a 4th can be added live) |
| Business hours condition | A Business Hours node routing to queue (open hours) and to voicemail/callback (after hours) |
| HTTP Request node | At least one HTTP Request node present and configured — must be able to show the request/response JSON |
| Publishable | Flow must be in a state where it can be edited, saved, and published live during the demo |
| Post-publish test call | Immediately after publish, the demo presenter calls the inbound number and hears the new menu option — this moment must work reliably |

---

## Demo 06 — Omnichannel Routing

### Chat Channel
| Requirement | Detail |
|---|---|
| Patient portal demo page | A hosted web page (URL provided in config) with the Webex CC chat widget embedded |
| Chat widget | Configured, connected to a WxCC chat queue, and routing to the agent |
| Chat queue | Separate from voice queue (or the same queue with chat channel enabled) — agent must be assigned |
| Chat routing flow | A Connect flow routing inbound chats to the agent queue |

### Chat-to-Voice Escalation
| Requirement | Detail |
|---|---|
| Escalation path | Chat interaction must be able to escalate to a voice call |
| History carry-over | Chat transcript must appear on the agent desktop when the voice call connects |

### Supervisor
| Requirement | Detail |
|---|---|
| Omnichannel supervisor view | Real-time dashboard must show voice and chat channels simultaneously |

---

## Demo 07 — Callback & Queue Management

### Callback Feature
| Requirement | Detail |
|---|---|
| Callback option in IVR | Flow must offer a callback option when queue is busy or above a wait-time threshold |
| Estimated wait time announcement | IVR must announce the current estimated wait before offering callback |
| Queue position held | Caller's position must be maintained in queue after they hang up |
| Auto-dial back | System must automatically dial the patient when an agent becomes available |
| Callback reason on desktop | The original reason for callback must pre-populate on the agent desktop when the call connects |
| Callback queue | A dedicated named queue for the callback demo |
| Supervisor queue view | Callback requests must appear in the supervisor real-time queue panel alongside live calls |
| Scheduled callback (optional) | Patients can select a specific callback time slot — configure if available and relevant |

> **Note:** To demonstrate the callback trigger reliably, either route calls to a small single-agent queue and have that agent go unavailable, or use a flow condition to force the callback offer.

---

## Demo 08 — Reporting & Analytics

### Cisco Analyzer
| Requirement | Detail |
|---|---|
| Real-time dashboard | Pre-built dashboard showing: live call volume, SLA/service level widget, agent state widget |
| Historical report | Pre-built queue performance report showing: abandonment rate, AHT, FCR trend — must have 30 days of data |
| Self-service filtering | Filters for team, queue, and time range must work |
| Custom visualisation | Supervisor must be able to drag a new metric onto a dashboard, save, and share during the demo — verify permissions |
| Scheduled report | At least one scheduled report configured (e.g. weekly email to a leadership alias) — must be able to show the configuration |
| API access (optional) | If the audience is technical/BI-focused, confirm Analyzer API docs are ready to reference |

> **Note:** 30 days of data requires the demo org to have been receiving calls for at least 30 days, or for historical data to have been seeded. Plan accordingly.

---

## Demo 09 — Integrations

### Epic Integration
| Requirement | Detail |
|---|---|
| Epic screen pop | On inbound call, the agent desktop must automatically display: patient name, MRN, last appointment date, open cases — triggered by caller ID |
| Implementation | Either a live Epic sandbox integration via HTTP Request node + screen pop widget, or a simulated screen pop widget populated from a mock API |
| Caller ID match | The inbound demo phone number must match a patient record in the Epic sandbox (or mock data) |

### Salesforce Integration
| Requirement | Detail |
|---|---|
| Salesforce widget on agent desktop | Agent desktop must have an embedded Salesforce widget showing a case record |
| Case update | Agent must be able to update the case from within the desktop widget — no tab switching |
| Implementation | Salesforce CTI adapter or embedded Salesforce widget configured in the desktop layout |

### Microsoft Teams Integration
| Requirement | Detail |
|---|---|
| Teams presence visible | Agent desktop must show Teams presence (Available/Busy/Away) for at least one specialist user |
| Transfer to Teams user | Agent must be able to initiate a transfer to a Teams user directly from the agent desktop |
| Implementation | Webex CC + Teams integration configured; specialist user must have a Teams account with Webex CC integration enabled |

### Flow Builder (supporting)
| Requirement | Detail |
|---|---|
| HTTP Request node | Same flow used in Demo 05 — ensure it is accessible and the JSON request/response is readable for IT audiences |

---

## Demo 10 — Quality Management

### Recording
| Requirement | Detail |
|---|---|
| Call recording enabled | Recording must be active on all queues used in the demo org |
| Recording library | Supervisor must have access to the recording library in the WxCC portal |
| Playback with transcript | Recording playback must show the waveform, the AI-generated transcript, and call metadata side by side |
| Recent recording | At least one recent recording (from the last 7 days) must be available at demo time — make a test call beforehand |

### Quality Management Workflows
| Requirement | Detail |
|---|---|
| Quality scorecard | At least one scorecard template created and assigned to the demo queue — must include: compliance checklist section, soft skills section, resolution quality section |
| Scorecard workflow | Supervisor must be able to open a recording, open a scorecard, score it, and save — end to end |
| Coaching workflow | Supervisor must be able to attach a timestamped note/clip to a recording and assign it to the agent |
| Agent coaching inbox | Agent must be able to receive and view the coaching item in their desktop |

### Compliance / Access Controls
| Requirement | Detail |
|---|---|
| Retention policy | At least one retention policy configured (e.g. 90 days) — must be visible to show during demo |
| Role-based access | Recording access restricted by role — confirm that the agent login cannot access other agents' recordings |

---

## Shared Infrastructure Summary

| Component | Required For | Notes |
|---|---|---|
| 1 × PSTN inbound number | Demos 01, 02, 03, 05, 06, 07, 09 | Single number is fine — map to entry point |
| 1 × Agent user account | Demos 01–07, 09, 10 | Browser-based softphone, 2 concurrent channels |
| 1 × Supervisor user account | Demos 04, 07, 08, 10 | Monitor/whisper/barge + Analyzer + QM access |
| 1 × AI Agent (Webex Connect) | Demo 01 | Min 3 intents, 1 resolution, 1 escalation |
| 1 × AI Assist queue | Demo 02 | Transcription + Agent Answers + auto-summary enabled |
| 1 × Demo flow (Flow Builder) | Demos 05, 09 | Editable, publishable, with HTTP node |
| 1 × Patient portal page with chat widget | Demo 06 | Hosted URL, chat widget connected to WxCC |
| 1 × Callback-configured queue | Demo 07 | With IVR treatment and auto-dial back |
| Analyzer dashboard + 30-day data | Demo 08 | Pre-built dashboard + historical report |
| Epic screen pop (or mock) | Demo 09 | Caller ID → patient record match required |
| Salesforce desktop widget | Demo 09 | Embedded in agent desktop layout |
| Teams presence + transfer | Demo 09 | At least 1 specialist Teams user configured |
| QM: recording + scorecard + coaching | Demo 10 | Recording library, scorecard template, coaching flow |

---

## Demo Config Values to Fill In

Once the environment is built, populate these values in `demoguides/index.html` under `DEMO_CONFIG`:

```javascript
const DEMO_CONFIG = {
  phone:              '',   // Inbound PSTN number (e.g. +61 2 XXXX XXXX)
  aiAgentName:        '',   // AI Agent display name (e.g. Aria)
  aiAgentWorkflow:    '',   // Connect workflow name for AI Agent demo
  aiAgentQueue:       '',   // Queue AI Agent escalates to
  assistWorkflow:     '',   // Connect workflow for AI Assist demo
  assistQueue:        '',   // Queue for AI Assist demo
  agentLogin:         '',   // Demo agent email address
  agentPassword:      '',   // Demo agent password
  agentQueue:         '',   // Primary voice queue name
  supervisorLogin:    '',   // Demo supervisor email address
  supervisorPassword: '',   // Demo supervisor password
  flowName:           '',   // Flow Designer flow name (for Flow Builder demo)
  chatPortalUrl:      '',   // Patient portal URL with chat widget embedded
  callbackQueue:      '',   // Queue name used for callback demo
};
```

Once filled in, these values will automatically appear in each demo guide's **Demo Details** box.
