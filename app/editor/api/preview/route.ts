import { NextResponse } from "next/server";
import { serialize } from "next-mdx-remote/serialize";
import { blogMdxOptions } from "@/lib/mdx-options";

// 로컬 전용 미리보기 — 편집 중인 마크다운을 실제 글과 같은 설정으로 컴파일해 돌려준다.
// 클라이언트는 결과를 next-mdx-remote의 <MDXRemote>로 그린다.
// MDX 문법 오류는 200 + error로 돌려준다: 편집 중엔 오류가 정상 상태라 실패 응답으로 다루지 않는다.
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const body: unknown = await req.json().catch(() => null);
  const markdown = typeof body === "object" && body !== null && "markdown" in body ? body.markdown : undefined;
  if (typeof markdown !== "string") {
    return NextResponse.json({ error: "markdown 문자열이 필요해요." }, { status: 400 });
  }

  try {
    const compiled = await serialize(markdown, { mdxOptions: blogMdxOptions });
    return NextResponse.json({ compiled });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) });
  }
}
