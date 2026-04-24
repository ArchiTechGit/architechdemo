import { AlertTriangle, CheckCircle } from "lucide-react";
import type { Allergy } from "@/types";

interface AllergyBannerProps {
  allergies: Allergy[];
}

export default function AllergyBanner({ allergies }: AllergyBannerProps) {
  if (allergies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-l-4 shrink-0"
        style={{ borderLeftColor: "#1A6B3C", backgroundColor: "#F0FDF4", borderBottomColor: "var(--border)" }}>
        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#1A6B3C" }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1A6B3C" }}>
          NKDA
        </span>
        <span className="text-xs" style={{ color: "#166534" }}>
          No known drug allergies
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-l-4 shrink-0 flex-wrap"
      style={{ borderLeftColor: "#C0392B", backgroundColor: "#FEF2F2", borderBottomColor: "var(--border)" }}>
      <div className="flex items-center gap-1.5 shrink-0">
        <AlertTriangle className="w-4 h-4" style={{ color: "#C0392B" }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#C0392B" }}>
          ALLERGIES
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {allergies.map((allergy, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
            style={{
              backgroundColor: allergy.severity === "Life-threatening" || allergy.severity === "Severe" ? "#FEE2E2" : "#FEF9C3",
              borderColor: allergy.severity === "Life-threatening" || allergy.severity === "Severe" ? "#FECACA" : "#FDE68A",
              color: allergy.severity === "Life-threatening" || allergy.severity === "Severe" ? "#991B1B" : "#92400E",
            }}>
            <span className="font-semibold">{allergy.allergen}</span>
            <span className="opacity-75">— {allergy.reaction}</span>
            <span className="font-semibold">({allergy.severity})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
