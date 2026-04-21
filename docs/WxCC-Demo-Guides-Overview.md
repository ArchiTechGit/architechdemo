# WxCC Demo Guides — Overview

> **Audience:** ArchiTech presales team  
> **Purpose:** Reference guide explaining each WxCC demo — what it shows, why it matters, and how to run it.

---

## What Are the Demo Guides?

The WxCC Demo Guides are a presales reference library of 10 structured, step-by-step demonstrations covering key Webex Contact Center use cases. Each guide is scoped for a specific audience and moment in the sales cycle, and includes:

- **What to show** — exact steps, in order, with what to click and say
- **Why it matters** — the business objective the demo addresses
- **Talk track tips** — discovery questions and narrative hooks to land the story

The guides are organised into three tiers based on when they should be used.

---

## Tier 1 — Lead with These

These four demos should anchor every WxCC discovery and demo. They address the highest-value, broadest-audience use cases.

---

### 01 · AI Agents
**Tag:** Self-Service

**What it shows:**  
A Webex AI Agent handling a patient inquiry end-to-end — no human agent involved — then escalating seamlessly when needed, with full conversation context pre-loaded on the agent desktop so the patient never has to repeat themselves.

**The story:**  
Healthcare contact centres handle 60–70% repeat, routine calls (appointment checks, prescription refills, billing questions). AI Agents deflect those, freeing agents for complex cases. And when escalation does happen, the agent already knows exactly why the patient called.

**How to run it:**
1. Call the inbound demo number. Let the AI Agent greet the caller and present self-service options.
2. Choose a common use case (e.g. "Check my appointment"). Walk through the natural language conversation — no menu presses.
3. Show the AI Agent confirming and resolving the request without agent involvement. Pause here — let it land.
4. Place a second call. Request something the bot can't resolve. Show the escalation to a live agent, with the full conversation transcript pre-loaded on the agent desktop.
5. Highlight zero repeat context — the agent already knows why the patient called.

**Key talk track hooks:**
- Lead with the stat: 60–70% of contact centre calls are routine and repeatable — AI handles those.
- Emphasise no-code flow building — clinical or ops staff can update the bot without IT.
- For IT audiences: show the webhook/API integration point where the bot pulls live patient data.

---

### 02 · AI Assist
**Tag:** Agent Augmentation

**What it shows:**  
Webex AI surfacing real-time suggestions and KB articles as the call progresses, transcribing the call live word-by-word, then auto-generating a post-call summary with sentiment, key topics, and action items — before the agent touches wrap-up.

**The story:**  
Average after-call work runs 60–90 seconds per call. AI Assist eliminates most of it. Every agent performs like your best agent. The transcript is also the compliance record — no more manual note disputes.

**How to run it:**
1. Log in as the agent, set status to Available, and accept an inbound call. Show the live transcription panel updating in real time.
2. As the caller mentions a topic (e.g. billing dispute), point out Agent Answers surfacing relevant KB articles and suggested responses automatically.
3. Have the agent use a suggested response — show how it reduces dead air and keeps the conversation moving.
4. End the call and immediately show the auto-generated summary — sentiment, topics, action items — populated before the agent touches wrap-up.
5. Show the summary written to the CRM/patient record with one click.

**Key talk track hooks:**
- Quantify it: average ACW is 60–90 seconds per call. Auto-summary eliminates most of it.
- For healthcare: the transcript is the compliance record — no manual note disputes.
- If accuracy is challenged: show the agent can edit the summary before saving — AI assists, agent confirms.

---

### 03 · Agent Experience
**Tag:** Day in the Life

**What it shows:**  
The full agent desktop experience from login to wrap-up — a single browser tab replacing multiple apps and a separate softphone. Screen pop, interaction controls, warm transfer, concurrent channels, and disposition.

**The story:**  
Ask the audience how many applications their agents juggle today. Then show how many you just replaced. The desktop is fully customisable — widgets, layouts, integrations — per team.

**How to run it:**
1. Open the Webex CC Agent Desktop and log in. Show the single-browser experience — no separate softphone, no multiple apps.
2. Set status to Available. Accept an inbound call. Show the screen pop pulling patient/caller data immediately.
3. Show the interaction controls (hold, mute, transfer, conference) and execute a warm transfer to a specialist queue.
4. Show handling a second channel simultaneously (chat or email) in the same desktop without dropping the call.
5. Complete wrap-up: select disposition code, add notes, close. Show how fast the cycle is.

**Key talk track hooks:**
- Ask the audience how many applications their agents use today — then show how many you just replaced.
- Highlight full customisability — widgets, layouts, and integrations tailored per team.
- If they're on Finesse today, draw the direct contrast — same concept, radically simpler.

---

### 04 · Supervisor Dashboard
**Tag:** Real-Time Management

**What it shows:**  
The supervisor's real-time command centre — live queue stats, agent states, silent monitoring, whisper coaching, and barge-in — all from a browser, whether on the floor or remote.

**The story:**  
Ask supervisors how they currently know if a call is going badly. Then show barge/whisper as the answer. Works for remote and hybrid teams — no physical floor required.

**How to run it:**
1. Log in as the supervisor. Show the live queue panel — calls waiting, average wait time, agents available — updating in real time.
2. Click into an active agent. Show their current call duration, channel, and state.
3. Demonstrate silent monitoring — join the call without the agent or caller knowing. Then switch to whisper coaching — speak only to the agent.
4. Show barge-in — join the call as a full participant.
5. Pull up the team performance panel — show which agents are in after-call work too long, and reassign or message them directly.

**Key talk track hooks:**
- "How do you currently know if a call is going badly?" — then show barge/whisper as the answer.
- Highlight remote/hybrid — no physical floor required.
- For larger orgs: show multi-team or multi-site views in the same dashboard.

---

## Tier 2 — Supporting Use Cases

Use these to deepen the story for operational buyers or when a specific objection needs addressing.

---

### 05 · Flow Builder
**Tag:** IVR & Routing

**What it shows:**  
The visual drag-and-drop flow designer — adding a new IVR menu option live, publishing it, and calling the number immediately to prove the change is live. No coding, no change request, no vendor ticket.

**The story:**  
Replace "it takes 6 weeks and a change request to update our IVR" with a live change made in minutes. The live publish-and-call moment is the demo's best surprise — build to it.

**How to run it:**
1. Open Webex CC Flow Designer and load the demo flow. Highlight how visually readable it is.
2. Make a live change: add a new menu option (e.g. "Press 4 for pharmacy") by dragging a node and wiring it up.
3. Show a business hours condition — open hours route to queue, after-hours route to voicemail or callback.
4. Publish the flow and immediately call the inbound number to prove the change is live.
5. Show an HTTP Request node — explain how the flow talks to Epic, Salesforce, or any API in real time.

**Key talk track hooks:**
- The live publish-and-call moment is the best surprise in the demo. Build to it.
- "Who owns your IVR changes today?" — then show they could own it themselves.
- For technical audiences: open the HTTP node and show the JSON request/response to an external API.

---

### 06 · Omnichannel Routing
**Tag:** Voice · Chat · Email

**What it shows:**  
Voice, chat, and email interactions all routing through the same engine, landing in a unified agent desktop — same routing rules, same agent pool, no channel silos. Chat-to-voice escalation with history carried over.

**The story:**  
Many healthcare orgs are voice-only today. This is where their patients already are — and routing rules are shared across all channels, in one place.

**How to run it:**
1. Open the patient portal demo page and initiate a chat as the patient.
2. On the agent desktop, show the chat interaction arriving in the same queue view as voice — same routing rules, same agent pool.
3. Accept the chat. Show the agent handling it while simultaneously on a voice call — concurrent interaction capacity.
4. Escalate the chat to a voice call — show the transition is seamless and the chat history carries over.
5. Pull up the supervisor view and show all channels represented in the same real-time dashboard.

**Key talk track hooks:**
- Frame this as where their patients already are — not just a future-state capability.
- Routing rules are shared — one place to manage skills, priority, and overflow across all channels.

---

### 07 · Callback & Queue Management
**Tag:** Patient Experience

**What it shows:**  
A patient offered a callback instead of holding, their position held in queue after they hang up, and the system auto-dialling them back when an agent is free — with the original callback reason pre-populated on the agent desktop.

**The story:**  
Hold time is one of healthcare's biggest patient satisfaction pain points and a direct HCAHPS metric. Callback is a concrete, working solution — and scheduled callbacks let patients pick a specific time slot.

**How to run it:**
1. Call the inbound number during a simulated busy period. Have the IVR announce the estimated wait and offer a callback.
2. Accept the callback. Show the caller's position held in queue — they hang up but don't lose their place.
3. On the supervisor dashboard, show the callback request in the queue alongside live calls.
4. When the agent becomes available, show the system dialling the patient back automatically and the call connecting.
5. Show the agent desktop pre-populated with the original callback reason so the patient doesn't have to repeat themselves.

**Key talk track hooks:**
- "What's your current HCAHPS score for wait time?" — callback directly moves that metric.
- Mention scheduled callbacks — patients can pick a specific time slot, not just "as soon as possible."

---

## Tier 3 — Targeted Buyers

Use these for specific executive or technical buyer audiences. Not suited for broad group demos.

---

### 08 · Reporting & Analytics
**Tag:** Ops & Data

**What it shows:**  
Cisco Analyzer — real-time dashboards and historical reports. Live call volume, SLA, agent state widgets. Queue performance over 30 days. Self-service filtering. Custom visualisations. Scheduled report delivery. API export to Power BI or Tableau.

**The story:**  
Ask "How do you get your contact centre reports today?" — the answer is usually manual exports and spreadsheets. Show the alternative.

**How to run it:**
1. Log in as the supervisor and open Cisco Analyzer. Show a real-time dashboard — live call volume, SLA, and agent state widgets.
2. Switch to historical. Pull a queue performance report for the last 30 days — abandonment rate, AHT, FCR trends.
3. Show filtering by team, queue, or time range — demonstrate the self-service nature.
4. Create a custom visualisation by dragging a new metric onto a dashboard. Save and share it.
5. Show scheduled report delivery — a report emailed to leadership every Monday morning, automatically.

**Key talk track hooks:**
- "How do you get your contact centre reports today?" — manual exports is the usual answer.
- Mention the API — data can be pushed to Power BI, Tableau, or any existing BI tool.

---

### 09 · Integrations
**Tag:** Epic · Salesforce · Teams

**What it shows:**  
Webex CC connecting to Epic (screen pop with patient name, MRN, last appointment), Salesforce Health Cloud (case update widget on the agent desktop), and Microsoft Teams (presence integration and direct transfer to specialists).

**The story:**  
Remove the "but will it work with our systems?" objection by showing live integrations with the platforms they already own. Epic screen pop is almost always the biggest reaction from healthcare audiences.

**How to run it:**
1. Call the inbound number. Show the Epic screen pop on the agent desktop — patient name, MRN, last appointment, and open cases surfaced automatically from caller ID.
2. Show the agent updating a Salesforce case directly from the agent desktop widget — no tab switching.
3. Show Teams presence integration — the agent can see if a specialist is available in Teams and transfer directly.
4. Open the Flow Designer HTTP node — briefly show how any REST API integration is configured (for IT audiences).

**Key talk track hooks:**
- Ask before the demo which systems they use — tailor this section to their exact stack.
- Epic screen pop is almost always the biggest reaction from healthcare audiences. Lead with it.
- For Teams-heavy orgs: presence and transfer integration removes a key objection to moving off UCCE.

---

### 10 · Quality Management
**Tag:** Compliance & Coaching

**What it shows:**  
Call recording playback with waveform, transcript, and metadata. Quality scorecard workflow — compliance checklist, soft skills, resolution scoring. Supervisor coaching workflow with timestamped clip annotations delivered to the agent desktop. HIPAA-aligned retention and role-based access controls.

**The story:**  
Address compliance requirements and agent development needs in a single platform — no separate QM tool. The AI transcript on recording playback is also a natural bridge back to the AI Assist story.

**How to run it:**
1. Log in as the supervisor and navigate to the recording library. Play back a recent call — show the waveform, transcript, and metadata side by side.
2. Open a quality scorecard. Walk through scoring the call — compliance checklist, soft skills, resolution quality.
3. Show the agent coaching workflow — supervisor attaches a note and a specific clip timestamp, agent receives it in their desktop.
4. Show retention and access controls — recordings stored per policy, accessible only to authorised roles. Key for HIPAA conversations.

**Key talk track hooks:**
- For healthcare: frame recording retention as a compliance requirement, not a nice-to-have.
- Ask if they have a separate QM platform — if yes, position this as a consolidation opportunity.
- The AI-generated transcript on recording playback bridges naturally back to the AI Assist story.

---

## Demo Configuration Fields

Each guide surfaces a **Demo Details** box with the pre-configured values for that specific demo. The shared configuration fields across all guides are:

| Field | Used In |
|---|---|
| Inbound Number | AI Agents, AI Assist, Agent Experience, Flow Builder, Callback, Integrations |
| AI Agent Name | AI Agents |
| AI Agent Connect Workflow | AI Agents |
| AI Agent Escalation Queue | AI Agents |
| AI Assist Connect Workflow | AI Assist, Integrations |
| AI Assist Queue | AI Assist |
| Agent Login / Password | AI Assist, Agent Experience, Flow Builder, Omnichannel, Integrations, QM |
| Agent Primary Queue | Agent Experience, Omnichannel, Supervisor, Reporting |
| Supervisor Login / Password | Supervisor, Callback, Reporting, QM |
| Flow Designer Flow Name | Flow Builder |
| Patient Portal / Chat URL | Omnichannel |
| Callback Queue | Callback |
