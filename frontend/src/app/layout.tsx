import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthHydrator } from '@/components/shared/AuthHydrator';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini Jira',
  description: 'Team task management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-50 antialiased">
        <AuthHydrator />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fafafa',
              border: '1px solid #27272a',
            },
          }}
        />
      </body>
    </html>
  );
}
