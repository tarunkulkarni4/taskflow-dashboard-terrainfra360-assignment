"use client";

import { motion, Variants } from "framer-motion";
import { useMemo } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: any;
  splitType?: "chars" | "words";
  from?: { opacity?: number; y?: number; x?: number; filter?: string };
  to?: { opacity?: number; y?: number; x?: number; filter?: string };
  threshold?: number;
  rootMargin?: string;
  textAlign?: "left" | "center" | "right";
  onLetterAnimationComplete?: () => void;
  variableSpeed?: number; // optional speed variation for typing effect
  onSentenceComplete?: () => void; // optional callback after each sentence
}

export function SplitText({
  text,
  className = "",
  delay = 50,
  duration = 0.4,
  ease = "easeOut",
  splitType = "words",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  textAlign = "left",
  onLetterAnimationComplete,
  variableSpeed,
  onSentenceComplete,
}: SplitTextProps) {
  const tokens = useMemo(
    () =>
      splitType === "chars"
        ? text.split("")
        : text.split(" ").map((w, i, arr) =>
            i < arr.length - 1 ? w + "\u00a0" : w
          ),
    [text, splitType]
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
    hidden: from,
    visible: {
      ...to,
      transition: {
        duration,
        ease,
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap ${className}`}
      style={{ textAlign }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      onAnimationComplete={onLetterAnimationComplete}
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
