import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Devology System | Richieste clienti",
  description: "Form richieste e pannello di gestione per Devology System.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Devology System",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090b10" },
    { media: "(prefers-color-scheme: light)", color: "#f3f4f7" },
  ],
};

/** Applica il tema salvato prima del paint, per evitare flash scuro→chiaro. */
const themeInitScript = `
(function(){
  try {
    if (localStorage.getItem('devology-theme') === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-brand-bg font-sans text-brand-text antialiased">{children}</body>
    </html>
  );
}
