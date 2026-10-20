import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { makeSlug, makeFrontmatter, updateMdx, localDate, planImageMoves, rewriteImageUrls, type DraftMeta, type ImageMove } from "@/lib/editor";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const PUBLIC_DIR = path.join(process.cwd(), "public");

// 이미지 파일을 옮기고, 실제로 옮긴 것만 돌려준다(파일이 없거나 받을 자리에 이미 있으면 건너뜀).
function moveImages(moves: ImageMove[]): ImageMove[] {
  const done: ImageMove[] = [];
  for (const m of moves) {
    const src = path.join(PUBLIC_DIR, m.from);
    const dst = path.join(PUBLIC_DIR, m.to);
    if (!fs.existsSync(src) || fs.existsSync(dst)) continue;
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.renameSync(src, dst);
    done.push(m);
    // 옮기고 나서 빈 폴더(draft 등)는 지운다
    const left = path.dirname(src);
    if (fs.readdirSync(left).length === 0) fs.rmdirSync(left);
  }
  return done;
}

function badSlug(slug: string) {
  return !slug || slug.includes("/") || slug.includes("..");
}

// 로컬 전용 저장 API — 프로덕션에선 존재 자체를 숨긴다(404).
// create: 새 글(중복 409, slug는 출간 창에서 고친 값 → 없으면 제목) / update: 기존 글 덮어쓰기(slug 고정, 미지 frontmatter 키 보존).
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
        updatedDate: localDate(),
        // 출간 창에서 대표 이미지를 뺐으면 빈 문자열 → frontmatter에서도 지운다.
        coverImage: meta.coverImage ?? "",
      },
      markdown,
    );
    fs.writeFileSync(file, next, "utf8");
    return NextResponse.json({ slug, path: `content/posts/${slug}.mdx` });
  }

  const slug = makeSlug(targetSlug?.trim() || meta.title);
  // makeSlug가 경로 구분자를 이미 제거하지만, 파일 쓰기 직전 이중 안전벨트.
  if (badSlug(slug)) {
    return NextResponse.json({ error: "slug를 만들 수 없는 제목이에요." }, { status: 400 });
  }
  const file = path.join(POSTS_DIR, `${slug}.mdx`);
  if (fs.existsSync(file)) {
    return NextResponse.json({ error: `이미 같은 slug의 글이 있어요: ${slug}.mdx` }, { status: 409 });
  }
  // 제목을 정하기 전이나 바꾸기 전에 올린 이미지를 이 글의 폴더(public/images/<slug>/)로 모은다.
  const ownedByPost = (dir: string) => fs.existsSync(path.join(POSTS_DIR, `${dir}.mdx`));
  const moved = moveImages(planImageMoves([markdown, meta.coverImage ?? ""], slug, ownedByPost));
  const finalMeta = { ...meta, coverImage: meta.coverImage ? rewriteImageUrls(meta.coverImage, moved) : meta.coverImage };
  try {
    fs.writeFileSync(file, makeFrontmatter(finalMeta) + "\n" + rewriteImageUrls(markdown, moved).trim() + "\n", "utf8");
  } catch (e) {
    // 글을 못 썼으면 이미지도 원래 자리로 돌려, 편집기 본문의 주소가 계속 맞게 한다.
    moveImages(moved.map((m) => ({ from: m.to, to: m.from })));
    throw e;
  }
  return NextResponse.json({ slug, path: `content/posts/${slug}.mdx` });
}
