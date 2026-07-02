import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="site-header mx-auto flex max-w-[680px] items-center justify-between px-6 pt-8">
      <Link
        href="/"
        className="site-name"
        style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em" }}
      >
        김승모<span className="name-dot">.</span>
      </Link>
      <nav
        className="flex items-center gap-[22px]"
        style={{ fontSize: 13.5, color: "var(--dim)" }}
      >
        <Link href="/" className="u">글</Link>
        <Link href="/about" className="u">소개</Link>
        <Link href="/search" className="u">검색</Link>
        <a href="/feed.xml" className="u">RSS</a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
