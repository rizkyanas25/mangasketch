import type { Metadata } from 'next';
import { Anton, Libre_Franklin, Space_Mono } from 'next/font/google';
import Providers from '@/providers';
import Header from '@/components/Header';
import './globals.css';

const anton = Anton({
  variable: '--font-anton',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const libreFranklin = Libre_Franklin({
  variable: '--font-libre-franklin',
  subsets: ['latin'],
  display: 'swap',
});

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  // 1. Base URL for resolving absolute paths of file-based metadata like opengraph-image.png
  metadataBase: new URL('https://mangasketch.vercel.app'),

  // 2. SEO Title: Main target keywords first for better Google ranking weight
  title: 'AI Manga Panel & Sketch Generator Online — MangaSketch',

  // 3. SEO Description: Matches the OG description perfectly
  description:
    'Turn your manga ideas and scene concepts into stylized black-and-white ink sketches in seconds. Anyone can easily start visualizing their stories for free.',

  // 4. Target Keywords: Focused on search intent, excluding any screentone terms
  keywords: [
    'AI manga panel generator',
    'manga sketch generator free',
    'online manga storyboard creator',
    'anime concept art generator',
    'black and white ink drawing AI',
    'mangaka digital assistant',
    'manga visualizer tool',
    'manga for everyone',
  ],

  // 5. Open Graph Metadata (Social Platforms)
  openGraph: {
    title: 'MangaSketch — AI Manga Panel & Sketch Generator',
    description:
      'Turn your manga ideas and scene concepts into stylized black-and-white ink sketches in seconds. Anyone can easily start visualizing their stories for free.',
    type: 'website',
    url: 'https://mangasketch.vercel.app',
    siteName: 'MangaSketch',
    locale: 'en_US',
  },

  // 6. Twitter Card Metadata (X Platform)
  twitter: {
    card: 'summary_large_image', // Required to display the large banner image layout
    title: 'MangaSketch — AI Manga Panel & Sketch Generator',
    description:
      'Turn your manga ideas and scene concepts into stylized black-and-white ink sketches in seconds. Anyone can easily start visualizing their stories for free.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`${anton.variable} ${libreFranklin.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className='h-screen flex flex-col overflow-hidden font-sans bg-screentone text-foreground bg-background transition-colors duration-200'>
        <Providers>
          <Header />
          <main className='flex-1 w-full overflow-y-auto'>
            <div className='w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-10'>
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
