import type {Metadata} from 'next';
import { Inter } from 'next/font/google' // Using Inter as a fallback, Geist is similar
import './globals.css';
import { Toaster } from "@/components/ui/toaster" // Import Toaster

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' }) // Configure Inter font

export const metadata: Metadata = {
  title: 'CV Optimizer', // Updated title
  description: 'Optimize your CV against job descriptions.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Use the Inter font variable */}
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster component here */}
      </body>
    </html>
  );
}
