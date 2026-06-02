import { ImageResponse } from "next/og";

// iOS 홈 화면 아이콘(apple-touch-icon). iOS Safari는 manifest 아이콘을 무시하고 이걸 쓴다.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020817",
        }}
      >
        <div style={{ width: 72, height: 72, borderRadius: 999, background: "#f8fafc", display: "flex" }} />
      </div>
    ),
    { ...size },
  );
}
