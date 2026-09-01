import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scriffle — Market Research Canvas',
  description: 'A visual FigJam-style whiteboard for event-driven market monitoring and automated research notes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Stack+Sans+Text:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/mingcute/Mingcute.css" />
      </head>
      <body className="antialiased bg-[#F8F9FC] text-slate-900 selection:bg-yellow-200">
        {children}
      </body>
    </html>
  );
}
