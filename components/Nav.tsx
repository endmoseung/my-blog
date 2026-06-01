import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
      <Link
        href="/"
        style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--accent)", letterSpacing: "-0.02em" }}
      >
        내 블로그
      </Link>
      <div className="flex items-center gap-4 sm:gap-5" style={{ fontWeight: 600 }}>
        <Link href="/blog" className="nav-link">글</Link>
        <Link href="/about" className="nav-link">소개</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
