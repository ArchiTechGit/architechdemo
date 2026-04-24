import type { SOAPNote } from "@/types";

interface ClinicalNoteProps {
  note: SOAPNote;
}

const SECTIONS: { key: keyof SOAPNote; label: string; abbr: string }[] = [
  { key: "subjective",  label: "Subjective",  abbr: "S" },
  { key: "objective",   label: "Objective",   abbr: "O" },
  { key: "assessment",  label: "Assessment",  abbr: "A" },
  { key: "plan",        label: "Plan",        abbr: "P" },
];

export default function ClinicalNote({ note }: ClinicalNoteProps) {
  return (
    <div className="grid grid-cols-2 gap-px bg-border rounded overflow-hidden">
      {SECTIONS.map(({ key, label, abbr }) => (
        <div key={key} className="bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold text-primary w-5">{abbr}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{note[key]}</p>
        </div>
      ))}
    </div>
  );
}
