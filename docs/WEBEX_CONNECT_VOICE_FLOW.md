# WebEx Connect — Post Discharge AI Call Flow

## Overview

When the "Call AI" button is clicked on the Stage 6 (Post Discharge Check-Up) card, it triggers an outbound call to the patient's mobile number. When the patient answers, the call is handed off to an AI agent.

## Call Flow Architecture

```
Button click
  → POST to https://hooks.au.webexconnect.io/events/ODITZ4C6HA  (Flow 1)
    → Flow 1 dials patient mobile
      → Patient answers
        → ANSWERED event fires to https://hooks.au.webexconnect.io/events/QYGRLWF71J  (Flow 2)
          → AI Agent takes over the call
```

## Webhook URLs

| Flow | Purpose | Webhook URL |
|------|---------|-------------|
| Flow 1 | Outbound call trigger | `https://hooks.au.webexconnect.io/events/ODITZ4C6HA` |
| Flow 2 | AI Agent call handler | `https://hooks.au.webexconnect.io/events/QYGRLWF71J` |

## Flow 1 — Outbound Call Trigger

- **Trigger**: Inbound Webhook (receives POST from the app when button is clicked)
- **Parsed variables**: `mobileNumber`, `patientName`, `demoMobile`
- **Action**: HTTP POST node calls the WebEx Connect Voice API v1

### HTTP POST configuration

**URL:** `https://api.au.webexconnect.io/v1/voice/messages`

**Headers:**
```
Content-Type: application/json
Authorization: <Service Key>
```

**Body:**
```json
{
  "callerId": "YOUR_VOICE_ASSET_NUMBER",
  "dialedNumber": "$(mobileNumber)",
  "callbackUrl": "https://hooks.au.webexconnect.io/events/QYGRLWF71J",
  "audio": {
    "type": "TTS",
    "style": "NEURAL",
    "language": "en-US",
    "voice": "AriaNeural",
    "gender": "FEMALE",
    "engine": "AZURE",
    "textFormat": "TEXT",
    "text": "Hi, this is ArchiTech Hospital calling for your post-discharge check-in. Please hold for a moment."
  }
}
```

## Flow 2 — AI Agent Call Handler

- **Trigger**: Inbound Webhook (receives ANSWERED event from WebEx Connect)
- **Parsed variables**: `event`, `sessionId`, `dialedNumber`, `callerId`
- **Action**: AI Agent node handles the conversation

### Callback payload (ANSWERED event)

```json
{
  "event": "ANSWERED",
  "callerId": "+61XXXXXXXXXX",
  "dialedNumber": "+61412345678",
  "offeredTime": "2026-04-15T09:22:55.624Z",
  "answeredTime": "2026-04-15T09:23:06.139Z",
  "eventTime": "2026-04-15T09:23:06.161Z",
  "sessionId": "a12c95ad-1999-XXXX-XXXX-25ed04d2d7c2"
}
```

## App Code

The "Call AI" button is in [Home.tsx](../wxccworkflowdemo/client/src/pages/Home.tsx) at line 1209.

The button POSTs the following payload to Flow 1's webhook URL:

```json
{
  "workflowId": "PATIENT_POST_DISCHARGE_SURVEY_VOICE",
  "patientName": "John Smith",
  "mobileNumber": "+61412345678",
  "demoMobile": "+61298765432",
  "timestamp": "Tuesday 15 April 2026 at 2pm",
  "appointmentDate": "Wednesday 16 April 2026 at 3pm"
}
```

> Note: `mobileNumber` arrives with spaces stripped.
