import { useMemo, useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import AppShell from "@/components/layout/AppShell";
import PatientHeader from "@/components/clinical/PatientHeader";
import AllergyBanner from "@/components/clinical/AllergyBanner";
import VitalsSummary from "@/components/clinical/VitalsSummary";
import VitalsChart from "@/components/clinical/VitalsChart";
import DiagnosisList from "@/components/clinical/DiagnosisList";
import MedicationsList from "@/components/clinical/MedicationsList";
import EncounterHistory from "@/components/clinical/EncounterHistory";
import { PATIENTS, HERO_PATIENT_ID } from "@/lib/data";
import { useDemoStage } from "@/contexts/DemoStageContext";
import type { Patient, VitalReading, Encounter, Medication } from "@/types";

function useChartPatient(id: string | undefined): Patient | null {
  const { currentStage } = useDemoStage();

  return useMemo(() => {
    const patient = PATIENTS.find(p => p.id === id);
    if (!patient) return null;

    if (!patient.isHeroPatient || !patient.demoStages) return patient;

    // Hero patient: overlay current demo stage data
    const stage = patient.demoStages[currentStage];

    // Build vitals: base vitals + stage vitals
    const vitals: VitalReading[] = [...patient.vitals];
    if (!vitals.find(v => v.timestamp === stage.latestVitals.timestamp)) {
      vitals.push(stage.latestVitals);
    }

    // Build encounters: base encounters + any new encounter from this stage and prior stages
    const stageEncounterIds = new Set(
      patient.demoStages.slice(0, currentStage + 1).map(s => s.newEncounter.id)
    );
    const encounters: Encounter[] = [
      ...patient.encounters,
      ...patient.demoStages
        .slice(0, currentStage + 1)
        .map(s => s.newEncounter)
        .filter(e => !patient.encounters.find(pe => pe.id === e.id)),
    ];

    // Build medications: only those active in current stage
    const medications: Medication[] = stage.activeMedicationIds.length > 0
      ? patient.medications.filter(m => stage.activeMedicationIds.includes(m.id))
      : patient.medications;

    return {
      ...patient,
      admissionStatus: stage.status,
      ewsScore: stage.latestVitals.ewsScore,
      vitals,
      encounters,
      medications,
    };
  }, [id, currentStage]);
}

export default function PatientChart() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { recommendedTab } = useDemoStage();
  const patient = useChartPatient(id);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    if (patient?.isHeroPatient && recommendedTab) {
      setActiveTab(recommendedTab);
    }
  }, [recommendedTab, patient?.isHeroPatient]);

  if (!patient) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Patient not found.</p>
          <button onClick={() => navigate("/patients")} className="text-sm text-primary underline">
            Return to Patient List
          </button>
        </div>
      </AppShell>
    );
  }

  const latestVitals = patient.vitals[patient.vitals.length - 1];

  return (
    <AppShell>
      {/* Back button */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-secondary/30 shrink-0">
        <button
          onClick={() => navigate("/patients")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Patient List
        </button>
      </div>

      {/* Sticky patient header */}
      <PatientHeader patient={patient} />

      {/* Sticky allergy banner */}
      <AllergyBanner allergies={patient.allergies} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 rounded-none border-b bg-card px-4 justify-start h-10 gap-1">
          <TabsTrigger value="summary" className="text-xs h-8">Summary</TabsTrigger>
          <TabsTrigger value="medications" className="text-xs h-8">Medications</TabsTrigger>
          <TabsTrigger value="vitals" className="text-xs h-8">Vitals</TabsTrigger>
          <TabsTrigger value="encounters" className="text-xs h-8">Encounters</TabsTrigger>
          <TabsTrigger value="details" className="text-xs h-8">Details</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="flex-1 overflow-y-auto m-0">
          <div className="p-4 grid grid-cols-2 gap-4">
            {/* Vitals snapshot */}
            <Card className="col-span-2">
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Latest Vitals</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <VitalsSummary vitals={patient.vitals} />
              </CardContent>
            </Card>

            {/* Diagnoses */}
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Problem List</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DiagnosisList diagnoses={patient.diagnoses} />
              </CardContent>
            </Card>

            {/* Active Medications snapshot */}
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Active Medications</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MedicationsList medications={patient.medications.filter(m => m.status === "Active")} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="flex-1 overflow-y-auto m-0">
          <div className="p-4">
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Medication Chart</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MedicationsList medications={patient.medications} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vitals Tab */}
        <TabsContent value="vitals" className="flex-1 overflow-y-auto m-0">
          <div className="p-4 flex flex-col gap-4">
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Vitals Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <VitalsChart vitals={patient.vitals} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Latest Readings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <VitalsSummary vitals={patient.vitals} />
                {latestVitals?.glucoseBSL !== undefined && (
                  <div className="px-4 py-2 border-t text-sm">
                    <span className="text-muted-foreground">BSL: </span>
                    <span className="font-semibold">{latestVitals.glucoseBSL} mmol/L</span>
                  </div>
                )}
                {latestVitals && (
                  <div className="px-4 py-2 border-t text-xs text-muted-foreground">
                    Pain Score: <span className="font-semibold text-foreground">{latestVitals.painScore}/10</span>
                    <span className="ml-4">Recorded: {new Date(latestVitals.timestamp).toLocaleString("en-AU")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Encounters Tab */}
        <TabsContent value="encounters" className="flex-1 overflow-y-auto m-0">
          <div className="p-4">
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Encounter History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <EncounterHistory encounters={patient.encounters} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="flex-1 overflow-y-auto m-0">
          <div className="p-4 grid grid-cols-2 gap-4">
            {/* Demographics */}
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Demographics</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                <Field label="Full Name" value={`${patient.firstName} ${patient.lastName}`} />
                <Field label="Date of Birth" value={new Date(patient.dob).toLocaleDateString("en-AU")} />
                <Field label="Age" value={`${patient.age} years`} />
                <Field label="Sex" value={patient.sex} />
                <Field label="Blood Type" value={patient.bloodType} />
                <Field label="Phone" value={patient.phone} />
                <Field label="Address" value={patient.address} mono={false} className="col-span-2" />
              </CardContent>
            </Card>

            {/* Identifiers */}
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Identifiers</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 gap-3 text-sm">
                <Field label="MRN" value={patient.mrn} mono />
                <Field label="Medicare Number" value={patient.medicareNumber} mono />
                <Field label="IHI" value={patient.ihi} mono />
              </CardContent>
            </Card>

            {/* Next of Kin */}
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Next of Kin</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                <Field label="Name" value={patient.nextOfKin.name} />
                <Field label="Relationship" value={patient.nextOfKin.relationship} />
                <Field label="Phone" value={patient.nextOfKin.phone} />
              </CardContent>
            </Card>

            {/* GP */}
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">General Practitioner</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                <Field label="Name" value={patient.gp.name} />
                <Field label="Practice" value={patient.gp.practice} />
                <Field label="Phone" value={patient.gp.phone} />
              </CardContent>
            </Card>

            {/* Clinical */}
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Clinical Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                <Field label="Department" value={patient.department} />
                <Field label="Ward / Bed" value={`${patient.ward} / ${patient.bedNumber}`} />
                <Field label="Treating Clinician" value={patient.treatingClinician} />
                <Field label="Admission Date" value={patient.admissionDate} />
                <Field label="Falls Risk" value={patient.fallsRisk} />
                <Field label="EWS Score" value={String(patient.ewsScore)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Field({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className={mono ? "font-mono font-medium" : "font-medium"}>{value}</p>
    </div>
  );
}
