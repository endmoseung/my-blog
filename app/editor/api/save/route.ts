import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { makeSlug, makeFrontmatter, type DraftMeta } from "@/lib/editor";

// 로컬 전용 저장 API — 프로덕션에선 존재 자체를 숨긴다(404).
// 파일 쓰기는 content/posts/ 안으로만 허용.
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const { meta, markdown } = (await req.json()) as { meta: DraftMeta; markdown: string };
  if (!meta?.title?.trim()) {
    return NextResponse.json({ error: "제목이 비어 있어요." }, { status: 400 });
  }

  const slug = makeSlug(meta.title);
  // makeSlug가 경로 구분자를 이미 제거하지만, 파일 쓰기 직전 이중 안전벨트.
  if (!slug || slug.includes("/") || slug.includes("..")) {
    return NextResponse.json({ error: "slug를 만들 수 없는 제목이에요." }, { status: 400 });
  }

  const file = path.join(process.cwd(), "content/posts", `${slug}.mdx`);
  if (fs.existsSync(file)) {
    return NextResponse.json({ error: `이미 같은 slug의 글이 있어요: ${slug}.mdx` }, { status: 409 });
  }

  fs.writeFileSync(file, makeFrontmatter(meta) + "\n" + markdown.trim() + "\n", "utf8");
  return NextResponse.json({ slug, path: `content/posts/${slug}.mdx` });
}
