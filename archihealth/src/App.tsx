import { useState } from "react";
import { SystemSwitcher } from "./components/SystemSwitcher";
import { Header, Sidebar, Footer, type SidebarView } from "./components/Shell";
import { Worklist } from "./components/Worklist";
import { PatientView } from "./components/PatientView";
import { AdmitPatientModal } from "./components/AdmitPatientModal";
import { PATIENTS } from "@/lib/data";
import type { Patient } from "@/types";

export default function App() {
  const [view, setView] = useState<SidebarView>("worklist");
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [admitting, setAdmitting] = useState(false);

  const selected = patients.find((p) => p.id === selectedId) ?? null;

  function handleAdmit(patient: Patient) {
    setPatients((prev) => [patient, ...prev]);
    setAdmitting(false);
  }

  return (
    <div className="flex h-screen flex-col">
      <SystemSwitcher />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          active={view}
          onSelect={(v) => { setView(v); setSelectedId(null); }}
          onAdmit={() => setAdmitting(true)}
        />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {view === "overview" && <div className="text-gray-500">Overview isn&apos;t modeled in this demo.</div>}
          {view === "worklist" && !selected && <Worklist patients={patients} onOpen={setSelectedId} />}
          {view === "worklist" && selected && <PatientView patient={selected} onBack={() => setSelectedId(null)} />}
        </main>
      </div>
      <Footer />
      {admitting && <AdmitPatientModal onSubmit={handleAdmit} onClose={() => setAdmitting(false)} />}
    </div>
  );
}
