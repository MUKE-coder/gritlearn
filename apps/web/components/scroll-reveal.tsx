"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// ScrollReveal: standard "fade + rise" reveal we use across the
// marketing site. Lives once here so every section feels coherent
// instead of each component picking its own easing / distance.

const baseVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={baseVariants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// StaggerChildren wraps a list so its descendants animate in one by
// one. Use ScrollRevealItem for each child so each one inherits the
// stagger from the parent.
export function StaggerChildren({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren: 0.05 },
    },
  };
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={container}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={baseVariants}>
      {children}
    </motion.div>
  );
}
