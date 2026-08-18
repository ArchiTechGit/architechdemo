import type { Patient, VitalReading } from "@/types";

export function statusFor(patient: Patient): "Critical" | "Watch" | "Stable" {
  if (patient.ewsScore >= 5) return "Critical";
  if (patient.ewsScore >= 3) return "Watch";
  return "Stable";
}

export function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function latestVital(patient: Patient): VitalReading | undefined {
  if (patient.vitals.length === 0) return undefined;
  return [...patient.vitals].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
}

export function relativeTime(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function hasSevereAllergy(patient: Patient): boolean {
  return patient.allergies.some((a) => a.severity === "Severe" || a.severity === "Life-threatening");
}

export function primaryDiagnosis(patient: Patient): string {
  const active = patient.diagnoses.find((d) => d.status === "Active");
  return active?.shortName ?? patient.diagnoses[0]?.shortName ?? "—";
}
