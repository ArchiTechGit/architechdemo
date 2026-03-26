import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";
import logoUrl from "@/assets/logo_darkbackground.png";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-8">
      <img
        src={logoUrl}
        alt="ArchiTech"
        style={{ height: "40px", width: "auto", mixBlendMode: "screen" }}
      />
      <div className="text-center">
        <p className="text-[#05C3DD] font-mono text-xs tracking-widest uppercase mb-4">404 — Page not found</p>
        <h1 className="text-4xl font-black text-white mb-3">Nothing here.</h1>
        <p className="text-white/35 text-sm mb-8">The page you're looking for doesn't exist or has moved.</p>
        <Button
          onClick={() => setLocation("/")}
          className="bg-[#05C3DD] hover:bg-[#55CAFD] active:bg-[#0055B8] text-[#0D1825] font-bold border-0"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Demo
        </Button>
      </div>
    </div>
  );
}
