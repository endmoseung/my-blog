import SeoulClock from "./SeoulClock";

export default function Footer() {
  return (
    <footer
      className="mx-auto flex max-w-[680px] items-center justify-between px-6"
      style={{ padding: "70px 24px 46px", fontSize: 13, color: "var(--dim)" }}
    >
      <span>© 2026 김승모</span>
      <SeoulClock />
    </footer>
  );
}
