import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Nav from "@/components/Nav";

const sans = IBM_Plex_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "내 블로그",
  description: "쾌활한 개인 블로그 — 생각을 푸는 곳",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning className={sans.variable}>
      <body style={{ fontFamily: "var(--font-sans), sans-serif", minHeight: "100dvh" }}>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <Nav />
          <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
          <footer className="mx-auto max-w-3xl px-6 py-10" style={{ color: "var(--muted)", fontSize: ".85rem" }}>
            © 2026 · 내 블로그
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
