import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Nav from "@/components/Nav";
import { SITE_URL, SITE_NAME, SITE_DESC } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s` },
  description: SITE_DESC,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESC,
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESC },
  alternates: { types: { "application/rss+xml": `${SITE_URL}/feed.xml` } },
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
