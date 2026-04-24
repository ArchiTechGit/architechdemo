import { Router, Route, Switch, Redirect } from "wouter";
import { DemoStageProvider } from "@/contexts/DemoStageContext";
import DemoStageControl from "@/components/demo/DemoStageControl";
import WxccToast from "@/components/demo/WxccToast";
import PatientList from "@/pages/PatientList";
import PatientChart from "@/pages/PatientChart";
import Appointments from "@/pages/Appointments";
import DemoGuide from "@/pages/DemoGuide";

export default function App() {
  return (
    <DemoStageProvider>
      <Router base="/emrdemo/dist">
        <Switch>
          <Route path="/" component={() => <Redirect to="/patients" />} />
          <Route path="/patients" component={PatientList} />
          <Route path="/patients/:id" component={PatientChart} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/guide" component={DemoGuide} />
          <Route component={() => <Redirect to="/patients" />} />
        </Switch>
        <DemoStageControl />
        <WxccToast />
      </Router>
    </DemoStageProvider>
  );
}
