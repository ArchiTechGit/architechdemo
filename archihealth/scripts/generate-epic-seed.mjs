// Run after transpiling data.ts — see Task 2 Step 2 for the exact command.
import { PATIENTS } from "../../tmp-epic-seed-build/data.js";

function sqlStr(s) {
  if (s === undefined || s === null) return "null";
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function sqlJson(obj) {
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

const LOINC = {
  heartRate: ["8867-4", "Heart rate"],
  systolicBP: ["8480-6", "Systolic blood pressure"],
  diastolicBP: ["8462-4", "Diastolic blood pressure"],
  oxygenSaturation: ["59408-5", "Oxygen saturation"],
  respiratoryRate: ["9279-1", "Respiratory rate"],
  temperature: ["8310-5", "Body temperature"],
};
const UNITS = {
  heartRate: "/min", systolicBP: "mmHg", diastolicBP: "mmHg",
  oxygenSaturation: "%", respiratoryRate: "/min", temperature: "Cel",
};

const patientRows = [];
const encounterRows = [];
const conditionRows = [];
const medicationRows = [];
const observationRows = [];
const allergyRows = [];
const diagnosticReportRows = [];
const procedureRows = [];
const practitionerByName = new Map(); // name -> { id, sql }
const practitionerRoleRows = [];

function practitionerId(name, department) {
  if (!practitionerByName.has(name)) {
    const id = `pr-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const [given, ...rest] = name.replace(/^Dr\s+/, "").split(" ");
    const family = rest.join(" ");
    const data = { resourceType: "Practitioner", id, name: [{ family, given: [given], prefix: ["Dr"] }] };
    practitionerByName.set(name, { id, sql: `(${sqlStr(id)}, ${sqlJson(data)})` });
    practitionerRoleRows.push(
      `(${sqlStr(`role-${id}`)}, ${sqlJson({
        resourceType: "PractitionerRole",
        id: `role-${id}`,
        practitioner: { reference: `Practitioner/${id}` },
        specialty: department ? [{ text: department }] : [],
      })}, ${sqlStr(id)})`,
    );
  }
  return practitionerByName.get(name).id;
}

for (const p of PATIENTS) {
  const patientId = p.id;
  patientRows.push(
    `(${sqlStr(patientId)}, ${sqlJson({
      resourceType: "Patient",
      id: patientId,
      identifier: [
        { system: "urn:archihealth:mrn", value: p.mrn },
        { system: "urn:archihealth:ihi", value: p.ihi },
      ],
      name: [{ family: p.lastName, given: [p.firstName], use: "official" }],
      gender: p.sex.toLowerCase(),
      birthDate: p.dob,
      address: [{ line: [p.address], city: "", state: "", postalCode: "" }],
      telecom: [{ system: "phone", value: p.phone }],
    })})`,
  );

  encounterRows.push(
    `(${sqlStr(`enc-${patientId}`)}, ${sqlJson({
      resourceType: "Encounter",
      id: `enc-${patientId}`,
      status: p.admissionStatus === "Discharged" ? "finished" : "in-progress",
      class: { code: p.admissionStatus },
      subject: { reference: `Patient/${patientId}` },
      period: { start: p.admissionDate },
      serviceProvider: { display: "ArchiTech Hospital" },
      location: [{ location: { display: `Ward ${p.ward}, Bed ${p.bedNumber}` } }],
    })}, ${sqlStr(patientId)})`,
  );

  p.diagnoses.forEach((d, i) => {
    conditionRows.push(
      `(${sqlStr(`cond-${patientId}-${i}`)}, ${sqlJson({
        resourceType: "Condition",
        id: `cond-${patientId}-${i}`,
        clinicalStatus: { coding: [{ code: d.status.toLowerCase() }] },
        code: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: d.icdCode }], text: d.shortName },
        subject: { reference: `Patient/${patientId}` },
      })}, ${sqlStr(patientId)})`,
    );
  });

  p.medications.forEach((m) => {
    medicationRows.push(
      `(${sqlStr(m.id)}, ${sqlJson({
        resourceType: "MedicationRequest",
        id: m.id,
        status: m.status.toLowerCase() === "active" ? "active" : "stopped",
        medicationCodeableConcept: { text: m.brandName ? `${m.name} (${m.brandName})` : m.name },
        subject: { reference: `Patient/${patientId}` },
        dosageInstruction: [{ text: `${m.dose} ${m.frequency}`, route: { text: m.route } }],
        authoredOn: m.startDate,
      })}, ${sqlStr(patientId)})`,
    );
  });

  p.vitals.forEach((v, vi) => {
    Object.keys(LOINC).forEach((key) => {
      const [code, display] = LOINC[key];
      observationRows.push(
        `(${sqlStr(`obs-${patientId}-${vi}-${key}`)}, ${sqlJson({
          resourceType: "Observation",
          id: `obs-${patientId}-${vi}-${key}`,
          status: "final",
          code: { coding: [{ system: "http://loinc.org", code, display }] },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: v.timestamp,
          valueQuantity: { value: v[key], unit: UNITS[key] },
        })}, ${sqlStr(patientId)})`,
      );
    });
  });

  p.allergies.forEach((a, i) => {
    allergyRows.push(
      `(${sqlStr(`allergy-${patientId}-${i}`)}, ${sqlJson({
        resourceType: "AllergyIntolerance",
        id: `allergy-${patientId}-${i}`,
        clinicalStatus: { coding: [{ code: "active" }] },
        code: { text: a.allergen },
        patient: { reference: `Patient/${patientId}` },
        reaction: [{ manifestation: [{ text: a.reaction }], severity: a.severity.toLowerCase() }],
      })}, ${sqlStr(patientId)})`,
    );
  });

  practitionerId(p.treatingClinician, p.department);

  // Astrid Nygaard's TKR is the one encounter note describing an actual
  // procedure — everyone else's encounter notes are ward-round/admission
  // narrative, not a discrete procedure/report event.
  if (patientId === "astrid-nygaard") {
    procedureRows.push(
      `(${sqlStr("proc-astrid-tkr")}, ${sqlJson({
        resourceType: "Procedure",
        id: "proc-astrid-tkr",
        status: "completed",
        code: { text: "Right total knee replacement" },
        subject: { reference: `Patient/${patientId}` },
        performedDateTime: "2026-04-25",
      })}, ${sqlStr(patientId)})`,
    );
    diagnosticReportRows.push(
      `(${sqlStr("dr-astrid-preop")}, ${sqlJson({
        resourceType: "DiagnosticReport",
        id: "dr-astrid-preop",
        status: "final",
        code: { text: "Pre-operative bloods" },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: "2026-04-23",
      })}, ${sqlStr(patientId)})`,
    );
  }
}

const practitionerRows = [...practitionerByName.values()].map((v) => v.sql);

function insertBlock(table, cols, rows) {
  if (rows.length === 0) return "";
  return `insert into epic.${table} (${cols}) values\n    ${rows.join(",\n    ")};\n\n`;
}

let sql = "create or replace function epic.reset_demo_data()\n";
sql += "returns void\nlanguage plpgsql\nsecurity definer\nset search_path = epic, pg_temp\nas $$\nbegin\n";
sql += "  truncate table epic.practitioner_role, epic.diagnostic_report, epic.procedure, epic.allergy_intolerance, epic.observation, epic.medication_request, epic.condition, epic.encounter, epic.patient, epic.practitioner cascade;\n\n";
sql += "  " + insertBlock("patient", "id, data", patientRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("practitioner", "id, data", practitionerRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("encounter", "id, data, patient_id", encounterRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("condition", "id, data, patient_id", conditionRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("medication_request", "id, data, patient_id", medicationRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("observation", "id, data, patient_id", observationRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("allergy_intolerance", "id, data, patient_id", allergyRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("diagnostic_report", "id, data, patient_id", diagnosticReportRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("procedure", "id, data, patient_id", procedureRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("practitioner_role", "id, data, practitioner_id", practitionerRoleRows).replace(/\n/g, "\n  ");
sql += "end;\n$$;\n\n";
sql += "revoke execute on function epic.reset_demo_data() from public, anon, authenticated;\n";
sql += "grant execute on function epic.reset_demo_data() to service_role;\n\n";
sql += "select epic.reset_demo_data();\n";

process.stdout.write(sql);
