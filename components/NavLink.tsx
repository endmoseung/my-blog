"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 현재 경로면 강조(굵게 + 밑줄 유지). 부분 일치(/blog/x도 /blog 활성)
export default function NavLink({
  href,
  children,
  ariaLabel,
  fontSize,
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel?: string;
  fontSize?: string;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className="nav-link"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      style={{ fontSize, color: active ? "var(--accent)" : "var(--fg)", fontWeight: active ? 800 : 600 }}
    >
      {children}
    </Link>
  );
}
