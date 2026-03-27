# Patient Experience Journey — Workflow Detail

**Platform:** Webex Contact Center (WxCC) + Webex Connect
**Audience:** Clinical Operations, IT Buyers, C-Level
**Demo URL:** architechdemo.com/wxccworkflowdemo/dist/

---

## Overview

Four automated workflows cover the full patient episode from first referral to post-operative recovery. Each workflow is triggered by an event in the EMR — no manual handoff, no staff intervention required to initiate. The patient interacts entirely via SMS from their own phone.

```
EMR Event → HL7 / API → Webex CC → Webex Connect → SMS to Patient
                                                         ↓
                                              Patient Reply / Form Completion
                                                         ↓
                                          System Update / AI Escalation Logic
```

---

## Workflow 01 — Appointment Scheduling

**Trigger:** Referral received by the health information team. An HL7 message from the EMR is sent to Webex CC, which fires the workflow.

**What happens:**
1. WxCC receives the HL7 referral message
2. Webex Connect sends the patient an SMS containing their proposed appointment date and two clear options: confirm or reschedule
3. Patient replies **YES** to confirm — scheduling platform is updated automatically
4. If the patient wants to reschedule, they are connected to an AI agent via SMS that handles the rebooking conversationally
5. Outcome is written back to the scheduling platform regardless of path taken

**Patient SMS (example):**
> "Hi! We've received your referral and have an appointment ready for you. Reply YES to confirm, or tap below to reschedule at a time that suits you."

**Patient action:** Reply YES · or · tap reschedule link to talk to AI

**System outcome:** Scheduling platform updated with confirmed or rescheduled appointment date

---

## Workflow 02 — Pre-Admission

**Trigger:** EMR activity as the patient's status moves from *Scheduled* to *Admitted* (pre-admission phase).

**What happens:**
1. EMR state change fires a new workflow in Webex CC
2. Webex Connect sends the patient an SMS containing:
   - Their confirmed appointment date
   - A link to a digital pre-enrolment form
3. Patient completes the form at their own pace — no staff follow-up required
4. Form completion triggers a new automated workflow: a confirmation SMS is sent to the patient acknowledging receipt
5. No further action is required from the patient

**Patient SMS (example):**
> "Your appointment is confirmed. Before your visit, please complete your pre-admission forms — it only takes a few minutes and keeps things moving on the day."

**Patient action:** Tap link → complete form (patient does not need to reply to the SMS)

**System outcome:** Pre-admission data captured in system. Patient notified of successful submission automatically.

---

## Workflow 03 — Surgery Prep

**Trigger:** EMR transitions the patient's episode to the surgical stage.

**What happens:**
1. EMR surgical stage event fires the workflow in Webex CC
2. Webex Connect sends the patient an SMS with a URL linking to their procedure preparation guide
3. Patient is not required to take any action — the guide is informational
4. An AI agent is available via SMS reply for any questions the patient has about how to prepare for their procedure (fasting, medications, arrival time, what to bring, etc.)
5. No data collection, no reply required

**Patient SMS (example):**
> "Your procedure is coming up. We've sent you a preparation guide — please review it before your appointment. Have questions? Reply anytime and our care assistant will help."

**Patient action:** Optional — read prep guide · reply to ask AI questions

**System outcome:** No required outcome. AI conversation logs available if needed.

---

## Workflow 04 — Recovery

**Trigger:** EMR moves the patient to the recovery phase, starting a 24–48 hour timer post-procedure.

**What happens:**
1. 24–48 hours after the procedure, the workflow fires automatically via Webex CC
2. An AI agent reaches out via SMS and conducts a structured recovery check-in, asking about:
   - Pain levels
   - Soreness / wound site status
   - Medication questions
   - Mental state and general wellbeing
3. Patient responds conversationally — the AI handles follow-up questions and clarifications
4. All response data is collated and surfaced to the clinical team
5. **Escalation logic:**
   - If any response crosses a defined threshold (e.g. high pain score, concerning medication interaction, distress indicators), one of three actions is triggered automatically:
     - A call is scheduled with clinical staff
     - An urgent appointment is created
     - Medical professionals are engaged immediately

**Patient SMS (example):**
> "Hi! It's been a couple of days since your procedure. Your care team wants to check in. How are you feeling? Reply to share a quick update and we'll make sure you have everything you need."

**Patient action:** Reply to AI recovery survey (pain, soreness, medication, mental state)

**System outcome:** Recovery data collated and shared with clinical team. Threshold breaches trigger automated escalation — call scheduled, urgent appointment, or immediate clinical engagement.

---

## Integration Stack

| Layer | Technology |
|---|---|
| EMR event source | HL7 v2 / FHIR API |
| Workflow orchestration | Webex CC Flow Designer |
| Messaging delivery | Webex Connect |
| AI agent (reschedule, prep Q&A, recovery) | Webex Connect AI |
| Scheduling platform write-back | Calendar API |
| Pre-admission form | EHR Integration / Insurance Gateway |
| Escalation routing | Webex CC agent queue |

---

## Key Selling Points by Audience

**Clinical Operations:**
- Zero manual initiation — every workflow fires from an EMR event
- Recovery data goes directly to the clinical team, structured and ready to act on
- Escalation is automatic — high-risk patients are flagged without staff monitoring every reply

**IT Buyers:**
- HL7 / FHIR native integration — works with existing EMR infrastructure
- No new app for patients — standard SMS
- Webex CC Flow Designer is the orchestration layer — fully configurable by the team

**C-Level:**
- Covers the full patient episode from referral to recovery in four automated touchpoints
- Staff time recovered at every stage — nothing requires manual initiation or follow-up
- Escalation logic means clinical risk is managed automatically, not absorbed by staff bandwidth
