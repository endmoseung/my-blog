import { describe, it, expect } from "vitest";
import { getAllPosts, getPostBySlug } from "./posts";

describe("posts", () => {
  it("모든 글을 날짜 내림차순으로 반환한다", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).toHaveProperty("slug");
    expect(posts[0]).toHaveProperty("title");
    expect(posts[0]).toHaveProperty("date");
    expect(posts[0]).toHaveProperty("description");
    // 내림차순 확인
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].date >= posts[i].date).toBe(true);
    }
  });

  it("slug로 글 하나를 본문과 메타 정보까지 반환한다", () => {
    const first = getAllPosts()[0];
    const post = getPostBySlug(first.slug);
    expect(post.title).toBe(first.title);
    expect(post.content.length).toBeGreaterThan(0);
    expect(post.tags).toEqual(first.tags);
    expect(post.description.length).toBeGreaterThan(0);
    expect(post.description.length).toBeLessThanOrEqual(156);
  });
});
