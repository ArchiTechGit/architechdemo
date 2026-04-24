import type { ReactNode } from "react";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import StageBanner from "@/components/demo/StageBanner";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNav />
      <StageBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
