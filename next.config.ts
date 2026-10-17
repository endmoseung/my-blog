import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev 표시(N 버튼)가 왼쪽 아래에 있으면 편집기 하단 「나가기」 버튼을 가린다.
  devIndicators: { position: "top-right" },
};

export default nextConfig;
