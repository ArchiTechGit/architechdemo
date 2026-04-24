import { Router, Route, Switch, Redirect } from "wouter";
import { DemoStageProvider } from "@/contexts/DemoStageContext";
import AppShell from "@/components/layout/AppShell";
import PatientList from "@/pages/PatientList";

function PatientChartPage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Patient Chart — coming soon</span>
      </div>
    </AppShell>
  );
}

function AppointmentsPage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Appointments — coming soon</span>
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <DemoStageProvider>
      <Router base="/emrdemo/dist">
        <Switch>
          <Route path="/" component={() => <Redirect to="/patients" />} />
          <Route path="/patients" component={PatientList} />
          <Route path="/patients/:id" component={PatientChartPage} />
          <Route path="/appointments" component={AppointmentsPage} />
          <Route component={() => <Redirect to="/patients" />} />
        </Switch>
      </Router>
    </DemoStageProvider>
  );
}
