import { permanentRedirect } from "next/navigation";

// quiet craft에서 홈이 곧 글 목록 — 옛 /blog 인덱스는 홈으로 영구 이동(308).
// 글 상세(/blog/[slug])는 그대로 산다. 목록용 Blog/ItemList JSON-LD는 홈이 가진다.
export default function BlogIndex() {
  permanentRedirect("/");
}
