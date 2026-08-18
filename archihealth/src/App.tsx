import { useState } from "react";
import { SystemSwitcher } from "./components/SystemSwitcher";
import { Header, Sidebar, Footer, type SidebarView } from "./components/Shell";

export default function App() {
  const [view, setView] = useState<SidebarView>("worklist");

  return (
    <div className="flex h-screen flex-col">
      <SystemSwitcher />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={view} onSelect={setView} onAdmit={() => console.log("admit (Task 8)")} />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {view === "overview" && <div className="text-gray-500">Overview isn&apos;t modeled in this demo.</div>}
          {view === "worklist" && <div className="text-gray-500">Worklist goes here (Task 5).</div>}
        </main>
      </div>
      <Footer />
    </div>
  );
}
