import { useState, type ReactNode } from "react";
import type { Patient } from "@/types";

const WARDS = ["4B", "5A", "5B", "6A", "6B", "7A", "7B", "ICU"];
const ATTENDINGS = ["Dr James Chen", "Dr Rachel Kim", "Dr Alan Brock", "Dr Sarah Whitfield"];

function toArray(input: string): string[] {
  return input.split(",").map((s) => s.trim()).filter((s) => s.length > 0 && s.toLowerCase() !== "none");
}

export function AdmitPatientModal({ onSubmit, onClose }: { onSubmit: (patient: Patient) => void; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", gender: "", dob: "", allergies: "", language: "",
    ward: WARDS[0], room: "", bed: "A", attending: ATTENDINGS[0], reason: "",
    conditions: "", medications: "",
    bp: "", hr: "", spo2: "", rr: "", temp: "", height: "", weight: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    if (!form.name || !form.dob || !form.gender) {
      setError("Please fill in name, date of birth, and gender.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const [firstName, ...rest] = form.name.trim().split(" ");
    const lastName = rest.join(" ") || "—";
    const id = `${firstName}-${lastName}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const [systolicBP, diastolicBP] = form.bp.split("/").map((n) => Number(n.trim()) || 0);

    setTimeout(() => {
      const patient: Patient = {
        id,
        mrn: `NEW-${Date.now()}`,
        medicareNumber: "—",
        ihi: "—",
        firstName,
        lastName,
        dob: form.dob,
        age: Math.max(0, new Date().getFullYear() - new Date(form.dob).getFullYear()),
        sex: (form.gender as Patient["sex"]) || "Other",
        bloodType: "—",
        address: "—",
        phone: "—",
        nextOfKin: { name: "—", relationship: "—", phone: "—" },
        gp: { name: "—", practice: "—", phone: "—" },
        allergies: toArray(form.allergies).map((allergen) => ({
          allergen, type: "Drug", reaction: "Unspecified", severity: "Mild", verified: false,
        })),
        diagnoses: toArray(form.conditions).map((shortName, i) => ({
          icdCode: `NEW-${i}`, description: shortName, shortName, status: "Active",
        })),
        medications: toArray(form.medications).map((name, i) => ({
          id: `${id}-med-${i}`, name, dose: "—", frequency: "—", route: "Oral", status: "Active",
          isHighAlert: false, prescriber: form.attending, startDate: new Date().toISOString().slice(0, 10),
        })),
        vitals: [{
          timestamp: new Date().toISOString(),
          systolicBP: systolicBP || 120,
          diastolicBP: diastolicBP || 80,
          heartRate: Number(form.hr) || 70,
          respiratoryRate: Number(form.rr) || 16,
          temperature: Number(form.temp) || 36.8,
          oxygenSaturation: Number(form.spo2) || 98,
          ewsScore: 0,
          painScore: 0,
        }],
        encounters: [],
        ward: form.ward,
        bedNumber: `${form.room}${form.bed !== "-" ? form.bed : ""}`,
        admissionStatus: "Admitted",
        admissionDate: new Date().toISOString().slice(0, 10),
        treatingClinician: form.attending,
        department: "—",
        fallsRisk: "Low",
        ewsScore: 0,
        alerts: [],
      };
      setSubmitting(false);
      onSubmit(patient);
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[85vh] w-[560px] overflow-auto rounded bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Admit Patient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <Section title="Demographics">
          <Field label="Full name"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Select&hellip;</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Date of birth"><input type="date" className="input" value={form.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
          <Field label="Allergies"><input className="input" value={form.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="comma separated, or none" /></Field>
          <Field label="Preferred language"><input className="input" value={form.language} onChange={(e) => set("language", e.target.value)} /></Field>
        </Section>

        <Section title="Admission details">
          <Field label="Ward">
            <select className="input" value={form.ward} onChange={(e) => set("ward", e.target.value)}>
              {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Room"><input className="input" value={form.room} onChange={(e) => set("room", e.target.value)} /></Field>
          <Field label="Bed">
            <select className="input" value={form.bed} onChange={(e) => set("bed", e.target.value)}>
              <option value="A">A</option><option value="B">B</option><option value="-">-</option>
            </select>
          </Field>
          <Field label="Attending">
            <select className="input" value={form.attending} onChange={(e) => set("attending", e.target.value)}>
              {ATTENDINGS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Reason for admission"><input className="input" value={form.reason} onChange={(e) => set("reason", e.target.value)} /></Field>
        </Section>

        <Section title="Clinical">
          <Field label="Conditions"><input className="input" value={form.conditions} onChange={(e) => set("conditions", e.target.value)} placeholder="comma separated" /></Field>
          <Field label="Medications"><input className="input" value={form.medications} onChange={(e) => set("medications", e.target.value)} placeholder="comma separated" /></Field>
        </Section>

        <Section title="Vitals">
          <Field label="Blood pressure"><input className="input" value={form.bp} onChange={(e) => set("bp", e.target.value)} placeholder="120/80" /></Field>
          <Field label="Heart rate"><input className="input" value={form.hr} onChange={(e) => set("hr", e.target.value)} /></Field>
          <Field label="SpO2"><input className="input" value={form.spo2} onChange={(e) => set("spo2", e.target.value)} /></Field>
          <Field label="Respiratory rate"><input className="input" value={form.rr} onChange={(e) => set("rr", e.target.value)} /></Field>
          <Field label="Temperature"><input className="input" value={form.temp} onChange={(e) => set("temp", e.target.value)} /></Field>
          <Field label="Height"><input className="input" value={form.height} onChange={(e) => set("height", e.target.value)} /></Field>
          <Field label="Weight"><input className="input" value={form.weight} onChange={(e) => set("weight", e.target.value)} /></Field>
        </Section>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-3 py-1.5 text-sm text-gray-600">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded bg-[#0a1e4a] px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {submitting ? "Admitting…" : "Admit patient"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs text-gray-500">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
