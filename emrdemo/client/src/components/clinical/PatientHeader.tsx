import type { Patient } from "@/types";
import StatusBadge from "./StatusBadge";

interface PatientHeaderProps {
  patient: Patient;
}

export default function PatientHeader({ patient }: PatientHeaderProps) {
  const age = patient.age;
  const dob = new Date(patient.dob).toLocaleDateString("en-AU");

  return (
    <div className="px-4 py-3 border-b bg-card shrink-0">
      {/* Row 1 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">
            {patient.firstName} {patient.lastName}
          </h1>
          <StatusBadge status={patient.admissionStatus} />
          {patient.alerts.map((alert, i) => (
            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide"
              style={{ backgroundColor: "#FFF7ED", color: "#C2410C", borderColor: "#FDBA74" }}>
              {alert}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Ward <span className="font-semibold text-foreground">{patient.ward}</span></span>
          <span>Bed <span className="font-semibold text-foreground">{patient.bedNumber}</span></span>
          <span>EWS <span className={`font-bold ${patient.ewsScore >= 4 ? "text-red-600" : patient.ewsScore >= 2 ? "text-amber-600" : "text-green-600"}`}>{patient.ewsScore}</span></span>
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>MRN <span className="font-mono font-semibold text-foreground">{patient.mrn}</span></span>
        <span>DOB <span className="font-semibold text-foreground">{dob}</span> ({age}y)</span>
        <span>Sex <span className="font-semibold text-foreground">{patient.sex}</span></span>
        <span>Blood <span className="font-semibold text-foreground">{patient.bloodType}</span></span>
        <span>Medicare <span className="font-mono font-semibold text-foreground">{patient.medicareNumber}</span></span>
        <span>IHI <span className="font-mono font-semibold text-foreground">{patient.ihi}</span></span>
        <span>Clinician <span className="font-semibold text-foreground">{patient.treatingClinician}</span></span>
        <span>GP <span className="font-semibold text-foreground">{patient.gp.name}</span></span>
        <span>Admitted <span className="font-semibold text-foreground">{patient.admissionDate}</span></span>
      </div>
    </div>
  );
}
