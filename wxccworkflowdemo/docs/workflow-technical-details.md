# Workflow Technical Details

**Application:** Webex CC Patient Experience Journey Demo
**Demo URL:** architechdemo.com/wxccworkflowdemo/dist/

---

## Webhook Configuration

All four workflows currently POST to a single Webex Connect inbound webhook. The `workflowId` field in the payload identifies which flow to execute on the Webex Connect side.

### Endpoint

```
POST https://hooks.au.webexconnect.io/events/FV4O2STRLD
Content-Type: application/json
```

---

## Payload Structure

The same payload shape is sent for all four workflows. Only `workflowId` changes per trigger.

```json
{
  "workflowId": "<see table below>",
  "patientName": "<value entered in Patient Name field>",
  "mobileNumber": "<value entered in Patient Mobile field, whitespace stripped>",
  "timestamp": "<human-readable datetime of trigger, e.g. Friday 27 March 2026 at 7pm>",
  "appointmentDate": "<tomorrow's date, rounded to next hour, e.g. Saturday 28 March 2026 at 7pm>"
}
```

### Field Notes

| Field | Source | Format |
|---|---|---|
| `workflowId` | Hardcoded per stage (see below) | Kebab-case string |
| `patientName` | Patient Name input, trimmed | Free text string |
| `mobileNumber` | Patient Mobile input, all whitespace removed | E.g. `+61212345678` |
| `timestamp` | `new Date()` at moment of button press | `"DayName D Month YYYY at H[am/pm]"` |
| `appointmentDate` | Trigger time + 24 hours, rounded to next half-hour boundary | Same format as `timestamp` |

---

## Workflow IDs

| Stage | Button Label | `workflowId` |
|---|---|---|
| 01 | Appointment Scheduling | `appointment-scheduling` |
| 02 | Pre-Admission | `pre-admission` |
| 03 | Surgery Prep | `surgery-prep` |
| 04 | Recovery | `recovery` |

---

## Example Payloads

### 01 — Appointment Scheduling

```json
{
  "workflowId": "appointment-scheduling",
  "patientName": "Sarah Johnson",
  "mobileNumber": "+61212345678",
  "timestamp": "Friday 27 March 2026 at 7pm",
  "appointmentDate": "Saturday 28 March 2026 at 7pm"
}
```

### 02 — Pre-Admission

```json
{
  "workflowId": "pre-admission",
  "patientName": "Sarah Johnson",
  "mobileNumber": "+61212345678",
  "timestamp": "Friday 27 March 2026 at 7pm",
  "appointmentDate": "Saturday 28 March 2026 at 7pm"
}
```

### 03 — Surgery Prep

```json
{
  "workflowId": "surgery-prep",
  "patientName": "Sarah Johnson",
  "mobileNumber": "+61212345678",
  "timestamp": "Friday 27 March 2026 at 7pm",
  "appointmentDate": "Saturday 28 March 2026 at 7pm"
}
```

### 04 — Recovery

```json
{
  "workflowId": "recovery",
  "patientName": "Sarah Johnson",
  "mobileNumber": "+61212345678",
  "timestamp": "Friday 27 March 2026 at 7pm",
  "appointmentDate": "Saturday 28 March 2026 at 7pm"
}
```

---

## Webex Connect — Expected Routing Logic

Since all four workflows hit the same inbound webhook URL, the Webex Connect flow must branch on `workflowId` to execute the correct downstream logic:

```
Inbound webhook received
        │
        ▼
  Read workflowId
        │
        ├── "appointment-scheduling" → Appointment confirmation flow
        │                              (SMS with date, YES to confirm, AI reschedule)
        │
        ├── "pre-admission"          → Pre-admission flow
        │                              (SMS with form link + appointment date)
        │
        ├── "surgery-prep"           → Surgery prep flow
        │                              (SMS with prep guide URL, AI Q&A available)
        │
        └── "recovery"               → Recovery check-in flow
                                       (AI-driven SMS survey, threshold escalation)
```

Alternatively, each workflow can be given its own inbound webhook URL — update the `webhookUrl` field in `JOURNEY_STAGES` in `client/src/pages/Home.tsx` per stage.

---

## Changing Webhook URLs

Each stage has its own `webhookUrl` field in `JOURNEY_STAGES` inside `client/src/pages/Home.tsx`:

```ts
const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "appointment-scheduling",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    ...
  },
  {
    id: "pre-admission",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    ...
  },
  ...
]
```

To route each workflow to its own Webex Connect flow, replace the `webhookUrl` value per stage with the corresponding inbound webhook URL from Webex Connect Flow Designer.

---

## appointmentDate Behaviour

`appointmentDate` is always calculated as **trigger time + 24 hours**, then rounded to the next clean half-hour:

```ts
const appointmentDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
appointmentDate.setMinutes(appointmentDate.getMinutes() >= 30 ? 60 : 0, 0, 0);
```

This is demo-only logic. In production, the appointment date would come from the EMR/scheduling platform.

---

## Error Handling

- If the webhook returns a non-2xx HTTP status, the trigger is treated as failed — the stage does not advance and an error toast is shown.
- If `webhookUrl` is empty/null, the app simulates an 800ms delay and advances the stage anyway (useful for offline demos).
- Mobile number is validated client-side before any POST is made — must contain only digits, spaces, hyphens, plus, and parentheses.
