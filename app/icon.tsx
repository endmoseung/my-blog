import { ImageResponse } from "next/og";

// 코드 생성 favicon 보조 아이콘(32×32). favicon.ico는 생성 불가라 app/favicon.ico를 그대로 둔다.
// 32px에서 또렷하도록 폰트 없이 도형으로 — 슬레이트 라운드 사각 + 흰 점.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: 999, background: "#f8fafc", display: "flex" }} />
      </div>
    ),
    { ...size },
  );
}
