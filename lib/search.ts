// 경량 자연어(키워드+유사도) 검색 — 외부 API·임베딩 없이 동작.
// 제목·태그·발췌·본문을 토큰화해 쿼리와 부분일치·빈도로 점수를 매긴다.
// 나중에 임베딩으로 업그레이드해도 이 인터페이스(search())는 유지 가능.

export type SearchDoc = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
  body: string; // 검색 대상 본문(plain text)
};

export type SearchHit = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
  score: number;
};

// 한글/영문/숫자 단위로 토큰화 (1글자 이상 — 한글 한 글자도 의미 있어 허용)
function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[가-힣a-z0-9]+/g) ?? []).filter((t) => t.length >= 1);
}

// 필드별 가중치 — 제목 > 태그 > 발췌 > 본문
const WEIGHT = { title: 6, tag: 4, excerpt: 2, body: 1 };

export function search(docs: SearchDoc[], query: string, limit = 20): SearchHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const scored = docs.map((doc) => {
    const title = doc.title.toLowerCase();
    const tags = doc.tags.map((t) => t.toLowerCase());
    const excerpt = doc.excerpt.toLowerCase();
    const body = doc.body.toLowerCase();
    let score = 0;
    let matchedTerms = 0;

    for (const term of terms) {
      let hit = false;
      if (title.includes(term)) { score += WEIGHT.title; hit = true; }
      if (tags.some((t) => t.includes(term))) { score += WEIGHT.tag; hit = true; }
      if (excerpt.includes(term)) { score += WEIGHT.excerpt; hit = true; }
      // 본문은 등장 횟수만큼(상한 5) 가중
      const bodyCount = Math.min(5, body.split(term).length - 1);
      if (bodyCount > 0) { score += WEIGHT.body * bodyCount; hit = true; }
      if (hit) matchedTerms += 1;
    }

    // 여러 검색어가 함께 맞으면 보너스(AND에 가깝게)
    if (terms.length > 1 && matchedTerms === terms.length) score *= 1.5;

    return { doc, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc, score }) => ({
      slug: doc.slug,
      title: doc.title,
      excerpt: doc.excerpt,
      tags: doc.tags,
      date: doc.date,
      score,
    }));
}
