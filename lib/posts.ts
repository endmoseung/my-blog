import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

const DESCRIPTION_MAX = 155;

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  updatedDate?: string;
  excerpt: string;
  description: string;
  tags: string[];
  featured: boolean;
  coverImage?: string;
  canonicalUrl?: string;
  noindex: boolean;
};
export type Post = PostMeta & { content: string };

function stripMdxToText(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, " ") // 코드블록 제거
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ") // 이미지 마크다운 제거
    .replace(/\[[^\]]+]\([^)]*\)/g, (match) => match.replace(/^\[|]\([^)]*\)$/g, "")) // 링크는 텍스트만
    .replace(/<[^>]+>/g, " ") // JSX 태그 제거
    .replace(/[#>*`_\-[\](){}]/g, " ") // 마크다운 기호
    .replace(/\s+/g, " ")
    .trim();
}

function truncateDescription(text: string, max = DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const sliced = normalized.slice(0, max + 1);
  const boundary = Math.max(sliced.lastIndexOf(" "), sliced.lastIndexOf("."), sliced.lastIndexOf("。"), sliced.lastIndexOf("다."));
  const cut = boundary > 80 ? sliced.slice(0, boundary + (sliced[boundary] === "다" ? 2 : 0)) : normalized.slice(0, max);
  return `${cut.replace(/[\s.,。]+$/g, "")}…`;
}

function read(slug: string): Post {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), "utf8");
  const { data, content } = matter(raw);
  const excerpt = String(data.excerpt ?? "").trim();
  const descriptionSource = String(data.description ?? data.summary ?? (excerpt || stripMdxToText(content)));
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    updatedDate: data.updatedDate ? String(data.updatedDate) : undefined,
    excerpt: excerpt || truncateDescription(stripMdxToText(content), 180),
    description: truncateDescription(descriptionSource),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    featured: data.featured ?? false,
    coverImage: data.coverImage ? String(data.coverImage) : undefined,
    canonicalUrl: data.canonicalUrl ? String(data.canonicalUrl) : undefined,
    noindex: data.noindex ?? false,
    content,
  };
}

export function getAllPosts(): PostMeta[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => read(f.replace(/\.mdx$/, "")))
    .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1))
    .map((p) => {
      const { content, ...meta } = p;
      void content;
      return meta;
    });
}

export function getPostBySlug(slug: string): Post {
  return read(slug);
}

// 검색용 doc — 본문에서 MDX/마크다운 기호를 대충 걷어낸 plain text 포함
export function getSearchDocs() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const post = read(f.replace(/\.mdx$/, ""));
      return {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        tags: post.tags,
        date: post.date,
        body: stripMdxToText(post.content),
      };
    });
}
