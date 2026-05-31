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

  it("slug로 글 하나를 본문과 함께 반환한다", () => {
    const post = getPostBySlug("hello-world");
    expect(post.title).toBe("안녕, 첫 글이야");
    expect(post.content).toContain("반가워");
    expect(post.tags).toContain("일상");
  });
});
