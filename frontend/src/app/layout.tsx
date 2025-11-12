import '@/src/styles/globals.css';
import React from 'react';

export const metadata = {
  title: 'My E-Commerce',
  description: 'Starter layout',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
