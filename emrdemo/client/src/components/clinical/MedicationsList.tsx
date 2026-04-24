import type { Medication } from "@/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicationsListProps {
  medications: Medication[];
}

const STATUS_STYLES: Record<string, string> = {
  Active:    "bg-green-50 text-green-700 border-green-200",
  "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
  Ceased:    "bg-gray-50 text-gray-500 border-gray-200 line-through",
  PRN:       "bg-blue-50 text-blue-700 border-blue-200",
};

export default function MedicationsList({ medications }: MedicationsListProps) {
  if (medications.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No medications recorded.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {medications.map(med => (
        <div
          key={med.id}
          className={cn(
            "flex items-center gap-4 px-4 py-2.5 text-sm border-l-2",
            med.isHighAlert ? "border-l-amber-400 bg-amber-50/30" : "border-l-transparent"
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{med.name}</span>
              {med.brandName && (
                <span className="text-[11px] text-muted-foreground">({med.brandName})</span>
              )}
              {med.isHighAlert && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border"
                  style={{ backgroundColor: "#FEF3C7", color: "#92400E", borderColor: "#FDE68A" }}>
                  <AlertTriangle className="w-2.5 h-2.5" />
                  HIGH ALERT
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {med.dose} · {med.frequency} · {med.route} · Prescriber: {med.prescriber}
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", STATUS_STYLES[med.status] ?? STATUS_STYLES.Active)}>
            {med.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
