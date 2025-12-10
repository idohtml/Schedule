import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const DURATION = 0.25;
const STAGGER = 0.025;

interface FlipperLinkProps {
  children: React.ReactNode;
  className?: string;
}

export const FlipperLink = ({ children, className }: FlipperLinkProps) => {
  const text = typeof children === "string" ? children : "";
  const textWithSpaces = text.replace(/ /g, "\u00A0");

  return (
    <motion.div
      initial="initial"
      whileHover="hovered"
      className={cn(
        "relative block overflow-hidden whitespace-nowrap px-1",
        className
      )}
      style={{
        lineHeight: 1.2,
      }}
    >
      <div>
        {textWithSpaces.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: 0,
              },
              hovered: {
                y: "-100%",
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </div>
      <div className="absolute inset-0">
        {textWithSpaces.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: "100%",
              },
              hovered: {
                y: 0,
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
};
