export interface Patient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{ system: string; value: string }>;
  name: Array<{ family: string; given: string[]; use?: string }>;
  gender: string;
  birthDate: string;
  address: Array<{ line: string[]; city: string; state: string; postalCode: string }>;
  telecom: Array<{ system: string; value: string }>;
}

export interface Encounter {
  resourceType: 'Encounter';
  id: string;
  status: string;
  class: { code: string };
  subject: { reference: string };
  period: { start: string; end?: string };
  serviceProvider: { display: string };
  location: Array<{ location: { display: string } }>;
  participant?: Array<{ individual: { reference: string } }>;
}

export interface Condition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: { coding: Array<{ code: string }> };
  code: { coding: Array<{ system: string; code: string }>; text: string };
  subject: { reference: string };
}

export interface MedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: string;
  medicationCodeableConcept: { text: string };
  subject: { reference: string };
  dosageInstruction: Array<{ text: string; route: { text: string } }>;
  authoredOn: string;
}

export interface Observation {
  resourceType: 'Observation';
  id: string;
  status: string;
  code: { coding: Array<{ system: string; code: string; display: string }> };
  subject: { reference: string };
  effectiveDateTime: string;
  valueQuantity: { value: number; unit: string };
}

export interface AllergyIntolerance {
  resourceType: 'AllergyIntolerance';
  id: string;
  clinicalStatus: { coding: Array<{ code: string }> };
  code: { text: string };
  patient: { reference: string };
  reaction: Array<{ manifestation: Array<{ text: string }>; severity: string }>;
}

export interface Practitioner {
  resourceType: 'Practitioner';
  id: string;
  name: Array<{ family: string; given: string[]; prefix?: string[] }>;
}
