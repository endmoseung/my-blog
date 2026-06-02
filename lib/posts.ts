import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  featured: boolean;
};
export type Post = PostMeta & { content: string };

function read(slug: string): Post {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    tags: data.tags ?? [],
    featured: data.featured ?? false,
    content,
  };
}

export function getAllPosts(): PostMeta[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => read(f.replace(/\.mdx$/, "")))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
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
      const plain = post.content
        .replace(/```[\s\S]*?```/g, " ") // 코드블록 제거
        .replace(/<[^>]+>/g, " ") // JSX 태그 제거
        .replace(/[#>*`_\-[\]()]/g, " ") // 마크다운 기호
        .replace(/\s+/g, " ")
        .trim();
      return {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        tags: post.tags,
        date: post.date,
        body: plain,
      };
    });
}
