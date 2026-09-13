import type { Metadata, Viewport } from 'next';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import QueryProvider from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
});
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'RailGaadi AI — Indian Railway Intelligence Platform',
  description:
    'Real-time Indian railway intelligence powered by live location, route, weather and terrain data. Track every train, understand every journey.',
  keywords: ['train tracking', 'RailGaadi', 'live train status', 'Indian Railways', 'train map', 'IRCTC train', 'railway intelligence'],
  authors: [{ name: 'RailGaadi AI' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RailGaadi AI',
  },
  openGraph: {
    title: 'RailGaadi AI — Indian Railway Intelligence Platform',
    description: 'Real-time Indian railway intelligence with live tracking, delay analytics, weather, and terrain data.',
    type: 'website',
    locale: 'en_IN',
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F8FAFC' }, { media: '(prefers-color-scheme: dark)', color: '#060a14' }],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem('railgaadi-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
        <link rel="preconnect" href="https://api.railradar.in" />
        <link rel="preconnect" href="https://api.maptiler.com" />
        <link rel="preconnect" href="https://api.openweathermap.org" />
      </head>
      <body
        className={`${poppins.className} min-h-full flex flex-col`}
      >
        <ThemeProvider>
          <QueryProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <BottomNav />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
