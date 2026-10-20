// 편집기 미리보기 변환 요청 줄 세우기 — 요청은 한 번에 하나만 보내고, 그사이 바뀐 내용은 가장 최신 것 하나만 이어서 보낸다.
// 키마다 기다림을 새로 거는 디바운스는 타이핑하는 내내 미리보기를 멈춰 세웠다.
// 보내는 방법(send)을 밖에서 받아, 브라우저 없이 가짜 타이머로 동작을 테스트한다.

// 한글 조합처럼 몰아서 오는 변경을 한 요청으로 묶는 짧은 틈. 길게 잡으면 그만큼 미리보기가 늦다.
export const SETTLE_MS = 30;

export function createCompileQueue<T>(opts: {
  send(markdown: string, signal: AbortSignal): Promise<T>;
  onResult(result: T): void;
  onError(error: unknown): void;
  settleMs?: number;
}) {
  const settleMs = opts.settleMs ?? SETTLE_MS;
  let latest: string | null = null;
  let busy = false;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ctrl = new AbortController();

  const run = async () => {
    timer = undefined;
    if (busy || latest === null) return;
    const markdown = latest;
    latest = null;
    busy = true;
    try {
      const result = await opts.send(markdown, ctrl.signal);
      if (!disposed) opts.onResult(result);
    } catch (e) {
      if (!disposed) opts.onError(e);
    } finally {
      busy = false;
      if (!disposed && latest !== null) run();
    }
  };

  return {
    request(markdown: string) {
      if (disposed) return;
      latest = markdown;
      if (!busy && timer === undefined) timer = setTimeout(run, settleMs);
    },
    dispose() {
      disposed = true;
      clearTimeout(timer);
      ctrl.abort();
    },
  };
}
