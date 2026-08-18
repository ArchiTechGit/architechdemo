import { SystemSwitcher } from "./components/SystemSwitcher";

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <SystemSwitcher />
      <div className="p-8 text-lg">ArchiTech Health — scaffold OK</div>
    </div>
  );
}
