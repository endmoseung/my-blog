import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { makeSlug, makeFrontmatter, updateMdx, type DraftMeta } from "@/lib/editor";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

function badSlug(slug: string) {
  return !slug || slug.includes("/") || slug.includes("..");
}

// 로컬 전용 저장 API — 프로덕션에선 존재 자체를 숨긴다(404).
// create: 새 글(중복 409) / update: 기존 글 덮어쓰기(slug 고정, 미지 frontmatter 키 보존).
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const { mode = "create", meta, markdown, slug: targetSlug } = (await req.json()) as {
    mode?: "create" | "update";
    meta: DraftMeta;
    markdown: string;
    slug?: string;
  };
  if (!meta?.title?.trim()) {
    return NextResponse.json({ error: "제목이 비어 있어요." }, { status: 400 });
  }

  if (mode === "update") {
    const slug = targetSlug ?? "";
    if (badSlug(slug)) {
      return NextResponse.json({ error: "잘못된 slug예요." }, { status: 400 });
    }
    const file = path.join(POSTS_DIR, `${slug}.mdx`);
    if (!fs.existsSync(file)) {
      return NextResponse.json({ error: `수정 대상이 없어요: ${slug}.mdx` }, { status: 404 });
    }
    const originalRaw = fs.readFileSync(file, "utf8");
    const next = updateMdx(
      originalRaw,
      {
        title: meta.title.trim(),
        excerpt: meta.excerpt,
        tags: meta.tags,
        featured: meta.featured,
        updatedDate: new Date().toISOString().slice(0, 10),
      },
      markdown,
    );
    fs.writeFileSync(file, next, "utf8");
    return NextResponse.json({ slug, path: `content/posts/${slug}.mdx` });
  }

  const slug = makeSlug(meta.title);
  // makeSlug가 경로 구분자를 이미 제거하지만, 파일 쓰기 직전 이중 안전벨트.
  if (badSlug(slug)) {
    return NextResponse.json({ error: "slug를 만들 수 없는 제목이에요." }, { status: 400 });
  }
  const file = path.join(POSTS_DIR, `${slug}.mdx`);
  if (fs.existsSync(file)) {
    return NextResponse.json({ error: `이미 같은 slug의 글이 있어요: ${slug}.mdx` }, { status: 409 });
  }
  fs.writeFileSync(file, makeFrontmatter(meta) + "\n" + markdown.trim() + "\n", "utf8");
  return NextResponse.json({ slug, path: `content/posts/${slug}.mdx` });
}
