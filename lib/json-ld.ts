// JSON-LD를 Server Component 본문에 native <script>로 주입할 때 쓰는 헬퍼.
// JSON.stringify는 XSS를 막아주지 않으므로 '<'를 유니코드로 이스케이프해 </script> 탈출을 차단한다.
// (Next.js 16 공식 JSON-LD 가이드 그대로. next/script는 쓰지 않는다 — 실행 코드가 아니라 데이터다.)
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
