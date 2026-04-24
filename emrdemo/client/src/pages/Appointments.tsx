import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { APPOINTMENTS, PATIENTS, HERO_PATIENT_ID } from "@/lib/data";
import { useDemoStage } from "@/contexts/DemoStageContext";
import type { Appointment, AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";

const CLINICIANS_FILTER = [
  "All Clinicians",
  "Dr Rachel Kim",
  "Dr James Chen",
  "Dr Patricia Lam",
  "Dr Michael Torres",
  "Dr Emma Walsh",
  "Dr Simon Burke",
  "Dr William Patel",
  "Dr Fatima Malik",
  "Dr Sarah Nguyen",
];

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  Scheduled:  "bg-blue-50 text-blue-700 border-blue-200",
  Confirmed:  "bg-green-50 text-green-700 border-green-200",
  Completed:  "bg-gray-50 text-gray-500 border-gray-200",
  Cancelled:  "bg-red-50 text-red-600 border-red-200",
  DNA:        "bg-red-50 text-red-600 border-red-200",
  Pending:    "bg-amber-50 text-amber-700 border-amber-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  Routine:   "bg-gray-50 text-gray-500 border-gray-200",
  Urgent:    "bg-amber-50 text-amber-700 border-amber-200",
  Emergency: "bg-red-50 text-red-700 border-red-200",
};

export default function Appointments() {
  const { currentStage } = useDemoStage();
  const [clinician, setClinician] = useState("All Clinicians");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");

  const heroPatient = PATIENTS.find(p => p.id === HERO_PATIENT_ID);

  const appointments = useMemo(() => {
    return APPOINTMENTS.map(apt => {
      if (heroPatient?.isHeroPatient && heroPatient.demoStages) {
        const stage = heroPatient.demoStages[currentStage];
        const update = stage.appointmentUpdates.find(u => u.id === apt.id);
        if (update) {
          return { ...apt, status: update.status, reminderSent: update.reminderSent };
        }
      }
      return apt;
    });
  }, [currentStage, heroPatient]);

  const filtered = useMemo(() => {
    return appointments
      .filter(apt => {
        const matchesClinician = clinician === "All Clinicians" || apt.clinician === clinician;
        const matchesStatus = status === "All" || apt.status === status;
        const matchesPriority = priority === "All" || apt.priority === priority;
        return matchesClinician && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        const dateA = `${a.scheduledDate}T${a.scheduledTime}`;
        const dateB = `${b.scheduledDate}T${b.scheduledTime}`;
        return dateA.localeCompare(dateB);
      });
  }, [appointments, clinician, status, priority]);

  const patientName = (patientId: string) => {
    const p = PATIENTS.find(pt => pt.id === patientId);
    return p ? `${p.firstName} ${p.lastName}` : patientId;
  };

  return (
    <AppShell>
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Select value={clinician} onValueChange={setClinician}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLINICIANS_FILTER.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {["All", "Scheduled", "Confirmed", "Pending", "Completed", "Cancelled"].map(s => (
              <SelectItem key={s} value={s}>{s === "All" ? "All Statuses" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            {["All", "Routine", "Urgent", "Emergency"].map(p => (
              <SelectItem key={p} value={p}>{p === "All" ? "All Priorities" : p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Appointment list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {filtered.map(apt => (
          <div
            key={apt.id}
            className={cn(
              "bg-card border rounded p-4 flex items-center gap-4",
              apt.priority === "Urgent" && "border-l-4 border-l-amber-400",
              apt.priority === "Emergency" && "border-l-4 border-l-red-500",
            )}
          >
            {/* Date/Time block */}
            <div className="w-24 shrink-0 text-center">
              <div className="text-xs text-muted-foreground">
                {new Date(`${apt.scheduledDate}T${apt.scheduledTime}`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <div className="text-lg font-bold tabular-nums text-foreground">{apt.scheduledTime}</div>
            </div>

            <div className="w-px h-10 bg-border shrink-0" />

            {/* Patient + Type */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{patientName(apt.patientId)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{apt.type}</div>
              <div className="text-xs text-muted-foreground">{apt.department} · {apt.room}</div>
            </div>

            {/* Clinician */}
            <div className="w-40 shrink-0 text-sm text-muted-foreground text-right">
              {apt.clinician}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={cn("text-[10px]", PRIORITY_STYLES[apt.priority])}>
                {apt.priority}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[apt.status])}>
                {apt.status}
              </Badge>
              {apt.reminderSent ? (
                <Bell className="w-3.5 h-3.5 text-green-500" aria-label="Reminder sent" />
              ) : (
                <BellOff className="w-3.5 h-3.5 text-muted-foreground" aria-label="Reminder not sent" />
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No appointments match the current filters.
          </div>
        )}
      </div>
    </AppShell>
  );
}
