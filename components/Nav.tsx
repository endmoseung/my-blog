import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import NavLink from "./NavLink";

export default function Nav() {
  return (
    <nav className="site-nav mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
      <Link
        href="/"
        style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--accent)", letterSpacing: "-0.02em" }}
      >
        내 블로그
      </Link>
      <div className="flex items-center gap-4 sm:gap-5">
        <NavLink href="/blog">글</NavLink>
        <NavLink href="/about">소개</NavLink>
        <NavLink href="/search" ariaLabel="검색" fontSize="1.05rem">🔍</NavLink>
        <ThemeToggle />
      </div>
    </nav>
  );
}
