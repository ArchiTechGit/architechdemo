import { Badge } from "@/components/ui/badge";
import type { AdmissionStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: AdmissionStatus;
  className?: string;
}

const STATUS_CONFIG: Record<AdmissionStatus, { label: string; className: string }> = {
  "Pre-Admission":       { label: "Pre-Admission",       className: "bg-blue-50 text-blue-700 border-blue-200" },
  "Scheduled":           { label: "Scheduled",           className: "bg-blue-50 text-blue-700 border-blue-200" },
  "Admitted":            { label: "Admitted",            className: "bg-green-50 text-green-700 border-green-200" },
  "In Procedure":        { label: "In Procedure",        className: "bg-purple-50 text-purple-700 border-purple-200" },
  "Ready for Discharge": { label: "Ready for Discharge", className: "bg-amber-50 text-amber-700 border-amber-200" },
  "Discharged":          { label: "Discharged",          className: "bg-gray-50 text-gray-600 border-gray-200" },
  "Inpatient":           { label: "Inpatient",           className: "bg-green-50 text-green-700 border-green-200" },
  "ED":                  { label: "ED",                  className: "bg-red-50 text-red-700 border-red-200" },
  "ICU":                 { label: "ICU",                 className: "bg-red-100 text-red-800 border-red-300 font-semibold" },
  "Day Surgery":         { label: "Day Surgery",         className: "bg-teal-50 text-teal-700 border-teal-200" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-50 text-gray-600 border-gray-200" };
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
