import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/clinical/StatusBadge";
import { PATIENTS } from "@/lib/data";
import type { Patient } from "@/types";
import { cn } from "@/lib/utils";
import { useDemoStage } from "@/contexts/DemoStageContext";

const WARDS = ["All Wards", "4A", "4B", "5A", "5B", "ED", "ICU", "DAY"];
const CLINICIANS = [
  "All Clinicians",
  "Dr James Chen",
  "Dr Patricia Lam",
  "Dr Michael Torres",
  "Dr Rachel Kim",
  "Dr Emma Walsh",
  "Dr Simon Burke",
  "Dr William Patel",
  "Dr Fatima Malik",
  "Dr Sarah Nguyen",
];

function ewsBadge(score: number) {
  const color = score >= 4 ? "text-red-600 font-bold" : score >= 2 ? "text-amber-600 font-semibold" : "text-green-600";
  return <span className={cn("font-mono tabular-nums", color)}>{score}</span>;
}

export default function PatientList() {
  const [, navigate] = useLocation();
  const { currentStage } = useDemoStage();
  const [search, setSearch] = useState("");
  const [ward, setWard] = useState("All Wards");
  const [clinician, setClinician] = useState("All Clinicians");

  // Apply demo stage to Astrid's status in the list
  const patients = useMemo(() => {
    return PATIENTS.map(p => {
      if (p.isHeroPatient && p.demoStages) {
        const stage = p.demoStages[currentStage];
        return { ...p, admissionStatus: stage.status, ewsScore: stage.latestVitals.ewsScore };
      }
      return p;
    });
  }, [currentStage]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter(p => {
      const matchesSearch =
        !q ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.diagnoses[0]?.shortName.toLowerCase().includes(q);
      const matchesWard = ward === "All Wards" || p.ward === ward;
      const matchesClinician = clinician === "All Clinicians" || p.treatingClinician === clinician;
      return matchesSearch && matchesWard && matchesClinician;
    });
  }, [patients, search, ward, clinician]);

  return (
    <AppShell>
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, MRN, diagnosis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={ward} onValueChange={setWard}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WARDS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={clinician} onValueChange={setClinician}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLINICIANS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {patients.length} patients
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary z-10">
            <TableRow className="h-9 text-[11px] uppercase tracking-widest">
              <TableHead className="w-48 pl-4">Patient / MRN</TableHead>
              <TableHead className="w-28">DOB / Age</TableHead>
              <TableHead className="w-24">Ward / Bed</TableHead>
              <TableHead>Primary Diagnosis</TableHead>
              <TableHead className="w-16 text-center">EWS</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead className="w-40">Clinician</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((patient, i) => (
              <TableRow
                key={patient.id}
                className={cn(
                  "h-9 cursor-pointer transition-colors hover:bg-secondary/60 text-sm",
                  i % 2 === 0 ? "bg-card" : "bg-background"
                )}
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <TableCell className="pl-4 font-medium">
                  <div>{patient.firstName} {patient.lastName}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{patient.mrn}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">{new Date(patient.dob).toLocaleDateString("en-AU")}</div>
                  <div className="text-[11px] text-muted-foreground">{patient.age}y {patient.sex[0]}</div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{patient.ward}</div>
                  <div className="text-[11px] text-muted-foreground">{patient.bedNumber}</div>
                </TableCell>
                <TableCell className="text-sm">
                  {patient.diagnoses[0]?.shortName ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  {ewsBadge(patient.ewsScore)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={patient.admissionStatus} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {patient.treatingClinician}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No patients match the current filters.
          </div>
        )}
      </div>

      {/* Demo Mode pill */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <span className="text-[10px] px-3 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 font-medium">
          ● DEMO DATA — NOT REAL PATIENT INFORMATION
        </span>
      </div>
    </AppShell>
  );
}
