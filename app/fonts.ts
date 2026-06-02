import localFont from "next/font/local";

// Pretendard 가변 폰트를 self-host. CDN render-blocking <link>를 대체.
// weight는 단일값이 아닌 가변 범위 '45 920' — 생략하면 WebKit(Safari)에서 굵기가 어긋남(Pretendard README).
// next/font가 자동으로 preload + size-adjust fallback을 넣어 CLS를 거의 없앤다.
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});
