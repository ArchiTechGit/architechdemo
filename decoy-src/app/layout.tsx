import './globals.css';
import { SystemSwitcher } from '@/components/SystemSwitcher';

export const metadata = { title: "Decoy - ArchiTech's own CRM/EMR/PAS/EHR Simulator" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <SystemSwitcher />
        {children}
      </body>
    </html>
  );
}
