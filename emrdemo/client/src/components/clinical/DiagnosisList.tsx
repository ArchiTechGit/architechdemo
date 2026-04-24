import type { Diagnosis } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DiagnosisListProps {
  diagnoses: Diagnosis[];
}

const STATUS_STYLES: Record<string, string> = {
  Active:    "bg-red-50 text-red-700 border-red-200",
  Chronic:   "bg-orange-50 text-orange-700 border-orange-200",
  Suspected: "bg-purple-50 text-purple-700 border-purple-200",
  Resolved:  "bg-gray-50 text-gray-500 border-gray-200",
};

export default function DiagnosisList({ diagnoses }: DiagnosisListProps) {
  if (diagnoses.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No diagnoses recorded.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {diagnoses.map((d, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-muted-foreground w-16 shrink-0">{d.icdCode}</span>
            <span className="font-medium">{d.description}</span>
          </div>
          <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[d.status] ?? STATUS_STYLES.Active)}>
            {d.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
