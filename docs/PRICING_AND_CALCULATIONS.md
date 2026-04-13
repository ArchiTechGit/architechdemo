# WxCC Pricing & ROI Calculation Reference

> **Source of truth** for all cost models used in the ArchiTech ROI calculators.
> Last updated: April 2026

---

## 1. Platform Licensing

Monthly cost is calculated from the number of concurrent agent seats and IVR ports. All rates are **RRP per seat/port per month**.

| SKU | RRP / month |
|---|---|
| WxCC Standard Concurrent Agent | $177.79 |
| WxCC Premium Concurrent Agent | $262.82 |
| WxCC Additional IVR Port | $108.22 |

**Monthly platform cost** = `(standardSeats × $177.79) + (premiumSeats × $262.82) + (ivrPorts × $108.22)`

### Customer-facing calculator — seat count assumptions

Seat counts are calculated from the **number of contact centre agents** entered by the user in the calculator wizard.

| Parameter | Value | Basis |
|---|---|---|
| Standard / Premium split | 70% Standard / 30% Premium | Typical hospital deployment |
| IVR port ratio | 1.2× agent count | Conservative self-service headroom |

**Derivation:**
```
concurrentAgents    = agentsEntered
premiumSeats        = round(concurrentAgents × 0.30)
standardSeats       = concurrentAgents − premiumSeats
ivrPorts            = round(concurrentAgents × 1.2)
monthlyLicenceCost  = (standardSeats × $177.79) + (premiumSeats × $262.82) + (ivrPorts × $108.22)
```

---

## 2. AI Agent

AI Agent is a **customer-facing** product. It handles inbound voice calls and digital interactions on behalf of the contact centre.

### Unit pricing

| Item | Value |
|---|---|
| Price per unit | $154.60 RRP |
| Voice capacity per unit | 1,600 minutes (96,000 seconds) |
| Digital capacity per unit | 4,800 sessions |

### Metering

- **Voice** — metered **per second**. A 90-second call consumes 90 seconds of unit capacity, not a 2-minute block.
- **Digital** — metered per **10-message session**. Each 10-message exchange = 1 session.

### Units required

A customer purchases however many units are needed to cover their monthly voice and digital usage. The number of units is driven by whichever dimension (voice or digital) requires more.

```
voiceSeconds        = voiceCallsPerMonth × avgCallDurationSec
unitsForVoice       = ceil(voiceSeconds ÷ 96,000)
unitsForDigital     = ceil(digitalSessionsPerMonth ÷ 4,800)
agentUnitsRequired  = max(unitsForVoice, unitsForDigital)
monthlyAiCost       = agentUnitsRequired × $154.60
```

> If both voice and digital are zero, 0 units are purchased (no AI cost).

### Customer-facing calculator — usage assumptions

Voice and digital usage are derived automatically from separations and selected workflows:

```
voiceCallsPerMonth    = round(monthlySeparations × 0.30)
voiceSecondsPerMonth  = voiceCallsPerMonth × 180   ← 3-min average handle time
digitalSessionsPerMonth = sum of (wxConnectRunsPerWorkflow × monthlySeparations)
```

---

## 3. AI Assistant

AI Assistant is an **internal-facing** product for agent assist, knowledge surfacing, and supervisor tooling. It is **not included** in the Digital Front Door ROI calculator.

| Item | Value |
|---|---|
| Price per unit | $46.38 RRP |
| Voice capacity per unit | 1,500 minutes |
| Digital capacity per unit | 1,000 sessions |

Unit calculation follows the same pattern as AI Agent (see above).

---

## 4. Digital Channel Unit Costs

| Channel | Rate |
|---|---|
| SMS per segment | $0.04 |
| WX Connect remote run | $0.08 |
| Email send | $0.00 |

---

## 5. Labour Saving Assumptions

| Parameter | Default | Notes |
|---|---|---|
| Staff hourly rate | $60.00 | Editable in both calculators |
| FTE = annual hours | 1,920 hrs | 48 weeks × 40 hours |
| Postage / paper per letter | Configurable | Internal calculator only |

---

## 6. ROI Formulae

```
annualLabourSaving  = sum of (minutesRemovedPerWorkflow ÷ 60 × hourlyRate × annualVolume)
annualPlatformCost  = monthlyLicenceCost × 12
annualAiCost        = monthlyAiCost × 12
totalAnnualCost     = annualPlatformCost + annualAiCost + otherMonthlyCosts × 12
netAnnualSaving     = annualLabourSaving − totalAnnualCost
ROI                 = annualLabourSaving ÷ totalAnnualCost
paybackMonths       = totalAnnualCost ÷ (annualLabourSaving ÷ 12)
```

---

## 7. Calculator Files

| Calculator | File | Audience |
|---|---|---|
| Digital Front Door ROI | `wxccroi-public/index.html` | Customer-facing (public) |
| Internal WxCC ROI | `wxccroidemo/client/src/pages/Home.tsx` | Internal sales tool |
