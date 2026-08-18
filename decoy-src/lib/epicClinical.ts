import type { AllergyIntolerance, Condition, Observation, Patient } from './epicTypes';

const LOINC_KEY: Record<string, Exclude<keyof VitalsReading, 'timestamp'>> = {
  '8867-4': 'heartRate',
  '8480-6': 'systolicBP',
  '8462-4': 'diastolicBP',
  '59408-5': 'oxygenSaturation',
  '9279-1': 'respiratoryRate',
  '8310-5': 'temperature',
};

export interface VitalsReading {
  timestamp: string;
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  temperature?: number;
}

export function groupObservationsByTimestamp(observations: Observation[]): VitalsReading[] {
  const byTimestamp = new Map<string, VitalsReading>();
  for (const obs of observations) {
    const code = obs.code.coding[0]?.code;
    const key = code ? LOINC_KEY[code] : undefined;
    if (!key) continue;
    const ts = obs.effectiveDateTime;
    if (!byTimestamp.has(ts)) byTimestamp.set(ts, { timestamp: ts });
    (byTimestamp.get(ts) as VitalsReading)[key] = obs.valueQuantity?.value;
  }
  return [...byTimestamp.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function patientName(p: Patient) {
  const n = p.name[0];
  return { firstName: n?.given?.[0] ?? '', lastName: n?.family ?? '' };
}

export function patientMrn(p: Patient): string {
  return p.identifier.find((i) => i.system.endsWith(':mrn'))?.value ?? '—';
}

export function patientIhi(p: Patient): string {
  return p.identifier.find((i) => i.system.endsWith(':ihi'))?.value ?? '—';
}

export function patientAge(p: Patient): number {
  const ms = Date.now() - new Date(p.birthDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
}

export function patientSex(p: Patient): string {
  return p.gender ? p.gender[0].toUpperCase() + p.gender.slice(1) : 'Other';
}

// FHIR Observation has no direct "early warning score" field — status is
// derived from heart rate + SpO2 thresholds instead of a stored ewsScore
// (that was a demo-only field on the old static Patient type, never
// migrated into any FHIR resource).
export function statusFor(latest: VitalsReading | undefined): 'Critical' | 'Watch' | 'Stable' {
  if (!latest) return 'Stable';
  const spo2 = latest.oxygenSaturation ?? 100;
  const hr = latest.heartRate ?? 70;
  if (spo2 < 92 || hr > 120) return 'Critical';
  if (spo2 < 95 || hr > 100) return 'Watch';
  return 'Stable';
}

export function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function relativeTime(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function hasSevereAllergy(allergies: AllergyIntolerance[]): boolean {
  return allergies.some((a) => {
    const sev = a.reaction?.[0]?.severity;
    return sev === 'severe' || sev === 'life-threatening';
  });
}

export function primaryDiagnosis(conditions: Condition[]): string {
  const active = conditions.find((c) => c.clinicalStatus.coding[0]?.code === 'active');
  return active?.code.text ?? conditions[0]?.code.text ?? '—';
}
