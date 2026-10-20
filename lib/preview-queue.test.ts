import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCompileQueue } from "./preview-queue";

// 보낸 요청을 기록하고, 응답은 테스트가 원할 때 돌려주는 가짜 서버
function fakeServer() {
  const sent: string[] = [];
  const pending: Array<(v: string) => void> = [];
  const send = (markdown: string) =>
    new Promise<string>((resolve) => {
      sent.push(markdown);
      pending.push(() => resolve(`html:${markdown}`));
    });
  const respond = async () => {
    pending.shift()?.("");
    await vi.advanceTimersByTimeAsync(0);
  };
  return { sent, send, respond };
}

describe("createCompileQueue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("짧은 틈 안에 몰아친 변경은 마지막 것 하나만 보낸다", async () => {
    const s = fakeServer();
    const results: string[] = [];
    const q = createCompileQueue({ send: s.send, onResult: (r) => results.push(r), onError: () => {}, settleMs: 30 });
    q.request("a");
    q.request("ab");
    q.request("abc");
    await vi.advanceTimersByTimeAsync(30);
    expect(s.sent).toEqual(["abc"]);
    await s.respond();
    expect(results).toEqual(["html:abc"]);
  });

  it("요청 중에 들어온 변경은 기다렸다가 가장 최신 것 하나만 이어서 보낸다 — 마지막 입력은 반드시 반영된다", async () => {
    const s = fakeServer();
    const results: string[] = [];
    const q = createCompileQueue({ send: s.send, onResult: (r) => results.push(r), onError: () => {}, settleMs: 30 });
    q.request("1");
    await vi.advanceTimersByTimeAsync(30);
    q.request("12");
    q.request("123");
    q.request("1234");
    expect(s.sent).toEqual(["1"]); // 한 번에 하나만
    await s.respond();
    expect(s.sent).toEqual(["1", "1234"]); // 응답이 오자마자 기다림 없이 최신 것
    await s.respond();
    expect(results).toEqual(["html:1", "html:1234"]);
  });

  it("타이핑이 이어지는 동안에도 응답마다 다음 요청이 나간다 (디바운스처럼 멈추지 않는다)", async () => {
    const s = fakeServer();
    const q = createCompileQueue({ send: s.send, onResult: () => {}, onError: () => {}, settleMs: 30 });
    q.request("a");
    await vi.advanceTimersByTimeAsync(30);
    for (const text of ["ab", "abc", "abcd"]) {
      q.request(text);
      await s.respond();
    }
    expect(s.sent).toEqual(["a", "ab", "abc", "abcd"]);
  });

  it("실패는 onError로 넘기고, 그 뒤 요청도 계속 보낸다", async () => {
    const errors: unknown[] = [];
    const results: string[] = [];
    let fail = true;
    const q = createCompileQueue({
      send: async (m) => {
        if (fail) throw new Error("서버 꺼짐");
        return m;
      },
      onResult: (r) => results.push(r),
      onError: (e) => errors.push(e),
      settleMs: 30,
    });
    q.request("a");
    await vi.advanceTimersByTimeAsync(30);
    expect(errors).toHaveLength(1);
    fail = false;
    q.request("b");
    await vi.advanceTimersByTimeAsync(30);
    expect(results).toEqual(["b"]);
  });

  it("dispose 뒤에는 늦게 온 응답을 버리고, 진행 중 요청을 끊고, 새 요청도 보내지 않는다", async () => {
    const s = fakeServer();
    const results: string[] = [];
    let signal: AbortSignal | undefined;
    const q = createCompileQueue({
      send: (m, sig) => {
        signal = sig;
        return s.send(m);
      },
      onResult: (r) => results.push(r),
      onError: () => {},
      settleMs: 30,
    });
    q.request("a");
    await vi.advanceTimersByTimeAsync(30);
    q.request("b");
    q.dispose();
    expect(signal?.aborted).toBe(true);
    await s.respond();
    q.request("c");
    await vi.advanceTimersByTimeAsync(100);
    expect(results).toEqual([]);
    expect(s.sent).toEqual(["a"]);
  });
});
