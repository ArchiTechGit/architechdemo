import { useState } from "react";
import type { Encounter } from "@/types";
import ClinicalNote from "./ClinicalNote";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EncounterHistoryProps {
  encounters: Encounter[];
}

const TYPE_COLORS: Record<string, string> = {
  Admission:     "text-blue-600 bg-blue-50 border-blue-200",
  "Ward Round":  "text-green-600 bg-green-50 border-green-200",
  Procedure:     "text-purple-600 bg-purple-50 border-purple-200",
  Discharge:     "text-amber-600 bg-amber-50 border-amber-200",
  "ED Triage":   "text-red-600 bg-red-50 border-red-200",
  Nursing:       "text-teal-600 bg-teal-50 border-teal-200",
  "Pre-Admission":"text-indigo-600 bg-indigo-50 border-indigo-200",
  Outpatient:    "text-gray-600 bg-gray-50 border-gray-200",
};

export default function EncounterHistory({ encounters }: EncounterHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...encounters].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No encounters recorded.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {sorted.map(enc => {
        const isOpen = expanded === enc.id;
        const typeStyle = TYPE_COLORS[enc.type] ?? TYPE_COLORS["Ward Round"];
        return (
          <div key={enc.id}>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/40",
                isOpen && "bg-secondary/40"
              )}
              onClick={() => setExpanded(isOpen ? null : enc.id)}
            >
              {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0", typeStyle)}>
                {enc.type}
              </span>
              <span className="text-sm font-medium">{new Date(enc.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="text-xs text-muted-foreground">{enc.department}</span>
              <span className="text-xs text-muted-foreground ml-auto">{enc.clinician}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-2">
                <ClinicalNote note={enc.note} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
