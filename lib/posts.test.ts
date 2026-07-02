import { describe, it, expect } from "vitest";
import { getAllPosts, getPostBySlug } from "./posts";

describe("posts", () => {
  it("모든 글을 날짜 내림차순으로 반환한다", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).toHaveProperty("slug");
    expect(posts[0]).toHaveProperty("title");
    expect(posts[0]).toHaveProperty("date");
    // 내림차순 확인
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].date >= posts[i].date).toBe(true);
    }
  });

  it("minRead는 1 이상의 정수다", () => {
    for (const p of getAllPosts()) {
      expect(p.minRead).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(p.minRead)).toBe(true);
    }
  });

  it("slug로 글 하나를 본문과 함께 반환한다", () => {
    // hello-world는 velog 마이그레이션 때 삭제됨 — 실존하는 대표 글로 검증
    const post = getPostBySlug("retrospect");
    expect(post.title).toBe("회고");
    expect(post.content).toContain("이직");
    expect(post.tags).toContain("회고");
  });
});
