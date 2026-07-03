import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { pretendard } from "./fonts";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ScrollHairline from "@/components/site/ScrollHairline";
import { SITE_URL, SITE_NAME, SITE_DESC, SITE_AUTHOR, SITE_KEYWORDS } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // template은 자식 페이지에만 적용 — 자식이 plain title을 주면 '제목 — 모승 블로그'로 자동 완성.
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_AUTHOR }],
  creator: SITE_AUTHOR,
  publisher: SITE_AUTHOR,
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESC,
    url: "/",
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} 대표 이미지`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESC,
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  // 검색엔진 등록(Search Console / 네이버 서치어드바이저)에서 발급한 코드를 채운다.
  // verification: { google: "", other: { "naver-site-verification": "" } },
};

// self-host한 Pretendard(var(--font-pretendard))를 우선, 미로드 구간엔 시스템 폰트로 폴백.
const PRETENDARD =
  'var(--font-pretendard), "Pretendard Variable", Pretendard, -apple-system, "system-ui", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <body style={{ fontFamily: PRETENDARD, minHeight: "100dvh" }}>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <ScrollHairline />
          <Header />
          <main className="mx-auto max-w-[680px] px-6 py-10">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
