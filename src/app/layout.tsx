import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "AI English Tutor - Practice English with AI",
  description: "Improve your English speaking skills with AI-powered conversations. Practice Free Talk, Role Play, Debate, and Grammar exercises.",
  keywords: ["English learning", "AI tutor", "language practice", "speaking skills"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${lexend.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
