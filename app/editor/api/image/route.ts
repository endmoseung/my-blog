import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { makeSlug } from "@/lib/editor";

// 로컬 전용 이미지 저장 — 클립보드 붙여넣기로 올라온 파일을
// public/images/<slug>/ 에 저장하고 마크다운에서 쓸 URL을 돌려준다.
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const rawSlug = String(form.get("slug") ?? "draft");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "이미지 파일만 받아요." }, { status: 400 });
  }

  const slug = makeSlug(rawSlug) || "draft";
  const ext = (file.type.split("/")[1] ?? "png").replace(/[^a-z0-9]/gi, "") || "png";
  const name = `${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "public/images", slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/images/${slug}/${name}` });
}
