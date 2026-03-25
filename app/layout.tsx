import type {Metadata} from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Financial Video Studio',
  description: 'Generate short-form vertical financial videos from market data.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
