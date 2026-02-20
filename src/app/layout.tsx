
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';
import './globals.css';
import ParticlesBackground from '@/components/ParticlesBackground';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} grid-bg min-h-screen pb-24`}>
        <ParticlesBackground />
        <Providers>
          {children}
          <Navbar />
        </Providers>
      </body>
    </html>
  );
}

