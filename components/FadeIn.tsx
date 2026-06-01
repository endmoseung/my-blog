"use client";
import { motion } from "motion/react";

// 스크롤·로드 시 아래에서 부드럽게 떠오르는 등장 애니메이션.
// prefers-reduced-motion은 motion이 자동 존중.
export default function FadeIn({
  children,
  delay = 0,
  y = 16,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
