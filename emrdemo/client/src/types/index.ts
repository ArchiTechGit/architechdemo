export type AdmissionStatus =
  | "Pre-Admission"
  | "Scheduled"
  | "Admitted"
  | "In Procedure"
  | "Ready for Discharge"
  | "Discharged"
  | "Inpatient"
  | "ED"
  | "ICU"
  | "Day Surgery";

export type AllergySeverity = "Mild" | "Moderate" | "Severe" | "Life-threatening";
export type AllergyType = "Drug" | "Food" | "Environmental" | "Contrast" | "Latex";
export type DiagnosisStatus = "Active" | "Resolved" | "Chronic" | "Suspected";
export type MedicationStatus = "Active" | "Ceased" | "On Hold" | "PRN";
export type MedicationRoute = "Oral" | "IV" | "SC" | "IM" | "Topical" | "Inhaled" | "PR" | "SL";
export type EncounterType =
  | "Admission"
  | "Ward Round"
  | "Procedure"
  | "Discharge"
  | "ED Triage"
  | "Nursing"
  | "Allied Health"
  | "Outpatient"
  | "Pre-Admission";
export type AppointmentStatus = "Scheduled" | "Confirmed" | "Completed" | "Cancelled" | "DNA" | "Pending";
export type AppointmentPriority = "Routine" | "Urgent" | "Emergency";

export interface Allergy {
  allergen: string;
  type: AllergyType;
  reaction: string;
  severity: AllergySeverity;
  verified: boolean;
}

export interface Diagnosis {
  icdCode: string;
  description: string;
  shortName: string;
  status: DiagnosisStatus;
}

export interface Medication {
  id: string;
  name: string;
  brandName?: string;
  dose: string;
  frequency: string;
  route: MedicationRoute;
  status: MedicationStatus;
  isHighAlert: boolean;
  prescriber: string;
  startDate: string;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface VitalReading {
  timestamp: string;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  ewsScore: number;
  painScore: number;
  glucoseBSL?: number;
}

export interface Encounter {
  id: string;
  type: EncounterType;
  date: string;
  facility: string;
  department: string;
  clinician: string;
  note: SOAPNote;
}

export interface NextOfKin {
  name: string;
  relationship: string;
  phone: string;
}

export interface GP {
  name: string;
  practice: string;
  phone: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  type: string;
  department: string;
  clinician: string;
  scheduledDate: string;
  scheduledTime: string;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  room: string;
  reminderSent: boolean;
}

export interface DemoStage {
  stageNumber: 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  wxccStage: string;
  status: AdmissionStatus;
  latestVitals: VitalReading;
  newEncounter: Encounter;
  activeMedicationIds: string[];
  appointmentUpdates: Array<{
    id: string;
    reminderSent: boolean;
    status: AppointmentStatus;
  }>;
}

export interface Patient {
  id: string;
  mrn: string;
  medicareNumber: string;
  ihi: string;
  firstName: string;
  lastName: string;
  dob: string;
  age: number;
  sex: "Male" | "Female" | "Other";
  bloodType: string;
  address: string;
  phone: string;
  nextOfKin: NextOfKin;
  gp: GP;
  allergies: Allergy[];
  diagnoses: Diagnosis[];
  medications: Medication[];
  vitals: VitalReading[];
  encounters: Encounter[];
  ward: string;
  bedNumber: string;
  admissionStatus: AdmissionStatus;
  admissionDate: string;
  treatingClinician: string;
  department: string;
  fallsRisk: "Low" | "Medium" | "High";
  ewsScore: number;
  alerts: string[];
  isHeroPatient?: boolean;
  demoStages?: DemoStage[];
}
