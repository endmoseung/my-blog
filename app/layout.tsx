import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "내 블로그",
  description: "심플하고 읽기 좋은 개인 블로그",
};

const PRETENDARD =
  '"Pretendard Variable", Pretendard, -apple-system, "system-ui", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body style={{ fontFamily: PRETENDARD, minHeight: "100dvh" }}>
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
