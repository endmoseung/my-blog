// 히어로의 순환 단어. CSS keyframes만 사용 — 서버 컴포넌트로 렌더 가능.
// globals.css의 @keyframes roll이 4행(마지막 = 첫 단어 복제)을 전제로 한다.
const WORDS = ["만들고,", "기록하고,", "나누고,", "만들고,"];

export default function RollingWord() {
  return (
    <span className="roll" aria-label={WORDS[0]}>
      {WORDS.map((w, i) => (
        <span key={i} aria-hidden={i > 0}>
          {w}
        </span>
      ))}
    </span>
  );
}
