import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DuoLogic - Collaborative Digital Logic Learning',
  description: 'A multi-touch collaborative digital logic learning platform.',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-hidden select-none touch-none">
        {children}
      </body>
    </html>
  );
}
