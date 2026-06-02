// 2D Simplex noise — public-domain 알고리즘(Stefan Gustavson)을 TypeScript로 직접 구현.
// 특정 레포 복붙이 아니라 널리 공개된 표준 기법이라 라이선스 깨끗.
// flow field 히어로의 "부드럽고 비반복적인 흐름"을 만드는 핵심.

const GRAD = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [1, 0], [-1, 0],
  [0, 1], [0, -1], [0, 1], [0, -1],
];

export function makeNoise2D(seed = 1) {
  // seed로 순열 테이블을 섞어 매 로드마다 약간 다른 흐름
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed >>> 0 || 1;
  const rnd = () => {
    // xorshift32 — Math.random 없이 결정적
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  return function noise2D(xin: number, yin: number): number {
    const s2 = (xin + yin) * F2;
    const i = Math.floor(xin + s2);
    const j = Math.floor(yin + s2);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    let i1: number, j1: number;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;

    const corner = (cx: number, cy: number, gi: number) => {
      let t2 = 0.5 - cx * cx - cy * cy;
      if (t2 < 0) return 0;
      const g = GRAD[gi % 12];
      t2 *= t2;
      return t2 * t2 * (g[0] * cx + g[1] * cy);
    };

    const n0 = corner(x0, y0, perm[ii + perm[jj]]);
    const n1 = corner(x1, y1, perm[ii + i1 + perm[jj + j1]]);
    const n2 = corner(x2, y2, perm[ii + 1 + perm[jj + 1]]);
    return 70 * (n0 + n1 + n2); // 대략 [-1, 1]
  };
}
