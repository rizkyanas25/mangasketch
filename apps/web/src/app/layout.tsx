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
  title: 'MangaSketch — AI Manga Sketch & Concept Art Generator',
  description:
    'Turn your manga storyboards, character ideas, and scene concepts into stylized black-and-white ink sketches in seconds. Built for mangakas and comic artists.',
  keywords: [
    'manga',
    'mangaka',
    'sketch',
    'AI image generator',
    'concept art',
    'storyboarding',
    'ink drawings',
    'screentone',
    'anime art',
    'layout visualizer',
  ],
  openGraph: {
    title: 'MangaSketch — AI Manga Sketch & Concept Art Generator',
    description:
      'An AI concept art assistant for mangakas and comic artists. Generate black & white manga storyboards, character sketches, and screentone panels instantly.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangaSketch — AI Manga Sketch & Concept Art Generator',
    description:
      'Turn your manga storyboards, character ideas, and scene concepts into stylized black-and-white ink sketches in seconds.',
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
