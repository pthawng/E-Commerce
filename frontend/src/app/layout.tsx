import '@/styles/globals.css';
import '@/styles/typography.css';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

