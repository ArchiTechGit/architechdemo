import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppShell from "@/components/layout/AppShell";
import PatientHeader from "@/components/clinical/PatientHeader";
import AllergyBanner from "@/components/clinical/AllergyBanner";
import VitalsSummary from "@/components/clinical/VitalsSummary";
import DiagnosisList from "@/components/clinical/DiagnosisList";
import MedicationsList from "@/components/clinical/MedicationsList";
import EncounterHistory from "@/components/clinical/EncounterHistory";
import { PATIENTS } from "@/lib/data";
import { useDemoStage } from "@/contexts/DemoStageContext";
import type { Patient, VitalReading, Encounter, Medication } from "@/types";

function useChartPatient(id: string | undefined): Patient | null {
  const { currentStage } = useDemoStage();

  return useMemo(() => {
    const patient = PATIENTS.find(p => p.id === id);
    if (!patient) return null;

    if (!patient.isHeroPatient || !patient.demoStages) return patient;

    const stage = patient.demoStages[currentStage];

    const vitals: VitalReading[] = [...patient.vitals];
    if (!vitals.find(v => v.timestamp === stage.latestVitals.timestamp)) {
      vitals.push(stage.latestVitals);
    }

    const encounters: Encounter[] = [
      ...patient.encounters,
      ...patient.demoStages
        .slice(0, currentStage + 1)
        .map(s => s.newEncounter)
        .filter(e => !patient.encounters.find(pe => pe.id === e.id)),
    ];

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
  const { currentStage, recommendedTab } = useDemoStage();
  const patient = useChartPatient(id);
  const [activeTab, setActiveTab] = useState("overview");
  const [newEncounterIds, setNewEncounterIds] = useState<Set<string>>(new Set());
  const [newMedicationIds, setNewMedicationIds] = useState<Set<string>>(new Set());
  const prevStageRef = useRef<number>(-1);

  useEffect(() => {
    if (patient?.isHeroPatient && recommendedTab) {
      setActiveTab(recommendedTab);
    }
  }, [recommendedTab, patient?.isHeroPatient]);

  // Compute and show NEW badges for 15 seconds after each stage advance
  useEffect(() => {
    if (!patient?.isHeroPatient || prevStageRef.current === currentStage) return;
    const rawPatient = PATIENTS.find(p => p.isHeroPatient);
    if (!rawPatient?.demoStages) return;

    const stage = rawPatient.demoStages[currentStage];
    const prevStage = currentStage > 0 ? rawPatient.demoStages[currentStage - 1] : null;

    const newEnc = new Set([stage.newEncounter.id]);
    const prevMedIds = new Set(prevStage?.activeMedicationIds ?? []);
    const newMeds = new Set(
      stage.activeMedicationIds.filter(mid => !prevMedIds.has(mid))
    );

    setNewEncounterIds(newEnc);
    setNewMedicationIds(newMeds);
    prevStageRef.current = currentStage;

    const t = setTimeout(() => {
      setNewEncounterIds(new Set());
      setNewMedicationIds(new Set());
    }, 15000);
    return () => clearTimeout(t);
  }, [currentStage, patient?.isHeroPatient]);

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

      {/* 3 tabs: Overview, Medications, Visit History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 rounded-none border-b bg-card px-4 justify-start h-10 gap-1">
          <TabsTrigger value="overview" className="text-xs h-8">Overview</TabsTrigger>
          <TabsTrigger value="medications" className="text-xs h-8">Medications</TabsTrigger>
          <TabsTrigger value="history" className="text-xs h-8">Visit History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto m-0">
          <div className="p-4 grid grid-cols-2 gap-4">
            {/* Vitals snapshot */}
            <Card className="col-span-2">
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                  Current Vitals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <VitalsSummary vitals={patient.vitals} />
              </CardContent>
            </Card>

            {/* Diagnoses */}
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                  Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DiagnosisList diagnoses={patient.diagnoses} />
              </CardContent>
            </Card>

            {/* Active Medications snapshot */}
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                  Current Medications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MedicationsList medications={patient.medications.filter(m => m.status === "Active")} newIds={newMedicationIds} />
              </CardContent>
            </Card>

            {/* Patient info summary */}
            <Card className="col-span-2">
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-4 gap-4 text-sm">
                <InfoField label="Doctor" value={patient.treatingClinician} />
                <InfoField label="Ward / Bed" value={`${patient.ward} · Bed ${patient.bedNumber}`} />
                <InfoField label="Admitted" value={patient.admissionDate} />
                <InfoField label="Risk Level" value={`${patient.ewsScore >= 4 ? "High" : patient.ewsScore >= 2 ? "Medium" : "Low"} (Score ${patient.ewsScore})`} />
                <InfoField label="Blood Type" value={patient.bloodType} />
                <InfoField label="Date of Birth" value={new Date(patient.dob).toLocaleDateString("en-AU")} />
                <InfoField label="Next of Kin" value={`${patient.nextOfKin.name} (${patient.nextOfKin.relationship})`} />
                <InfoField label="Next of Kin Phone" value={patient.nextOfKin.phone} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="flex-1 overflow-y-auto m-0">
          <div className="p-4">
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                  Medication Chart
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MedicationsList medications={patient.medications} newIds={newMedicationIds} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Visit History Tab */}
        <TabsContent value="history" className="flex-1 overflow-y-auto m-0">
          <div className="p-4">
            <Card>
              <CardHeader className="py-2 px-4 border-b">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                  Visit History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <EncounterHistory encounters={patient.encounters} newIds={newEncounterIds} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
