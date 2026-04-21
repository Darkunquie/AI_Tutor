import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";
import { SpeechWarmUpProvider } from "@/components/SpeechWarmUpProvider";

export const metadata: Metadata = {
  metadataBase: new URL('https://talkivo.in'),
  title: {
    default: 'Talkivo — AI English Tutor | Practice Speaking with AI',
    template: '%s | Talkivo',
  },
  description:
    'Practice English speaking with an AI tutor that listens, corrects with reason, and remembers your patterns. Free Talk, Role Play, Debate, Grammar, Pronunciation. Start free.',
  keywords: [
    'AI English tutor',
    'English speaking practice',
    'practice English with AI',
    'spoken English online',
    'English fluency app',
    'IELTS speaking practice',
    'English pronunciation AI',
    'free English speaking app',
    'English speaking course online',
    'Talkivo',
  ],
  authors: [{ name: 'Talkivo' }],
  creator: 'Talkivo',
  publisher: 'Talkivo',
  applicationName: 'Talkivo',
  category: 'education',
  alternates: {
    canonical: '/',
    languages: { 'en-IN': '/', 'en-US': '/' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://talkivo.in',
    siteName: 'Talkivo',
    title: 'Talkivo — AI English Tutor',
    description:
      'Speak English like you think. AI tutor that listens first, corrects with reason, and remembers your patterns.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Talkivo — Practice English with AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talkivo — AI English Tutor',
    description: 'Practice English speaking with AI. Free to start.',
    images: ['/logo.png'],
    creator: '@talkivo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/branding/talkivo-icon.svg',
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400..600&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..500&family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <SpeechWarmUpProvider>
            {children}
          </SpeechWarmUpProvider>
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
