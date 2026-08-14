import { TopNav } from '@/components/TopNav';

export default function DynamicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
