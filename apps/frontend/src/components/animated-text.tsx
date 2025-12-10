import { motion } from "motion/react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  startDelay?: number;
}

export const AnimatedText = ({
  text,
  className,
  startDelay = 0,
}: AnimatedTextProps) => {
  const words = text.split(" ");

  return (
    <div className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: startDelay + index * 0.05,
            ease: [0.32, 0, 0.67, 0],
          }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};
