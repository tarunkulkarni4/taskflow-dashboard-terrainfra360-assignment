"use client";

import { motion, Variants } from "framer-motion";
import { useMemo } from "react";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  splitType?: "chars" | "words";
  animateBy?: "chars" | "words";
  threshold?: number;
}

export function BlurText({
  text,
  className = "",
  delay = 80,
  duration = 0.6,
  animateBy = "words",
}: BlurTextProps) {
  const tokens = useMemo(
    () =>
      animateBy === "chars"
        ? text.split("")
        : text.split(" ").map((w, i, arr) =>
            i < arr.length - 1 ? w + "\u00a0" : w
          ),
    [text, animateBy]
  );

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay / 1000,
      },
    },
  };

  const childVariants: Variants = {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 8,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap ${className}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {tokens.map((token, index) => (
        <motion.span
          key={index}
          variants={childVariants}
          className="inline-block"
          style={{ whiteSpace: "pre" }}
        >
          {token}
        </motion.span>
      ))}
    </motion.span>
  );
}
