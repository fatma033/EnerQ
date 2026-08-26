import React, { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
}

/**
 * Animates a number counting up/down to its new value whenever it changes,
 * instead of snapping instantly — makes the Digital Twin feel like it's
 * actually computing when you switch scenarios, not just swapping text.
 *
 * Uses setInterval rather than requestAnimationFrame: no external animation
 * library (avoids the framer-motion/React 19 hook-call crash found while
 * building this), and setInterval keeps ticking in more environments where
 * rAF gets throttled or paused (backgrounded/unfocused tabs), at the cost
 * of slightly less silky-smooth frame pacing — imperceptible over ~500ms.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, decimals = 0, className }) => {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const duration = 500;
    const stepMs = 16;
    const steps = Math.max(1, Math.round(duration / stepMs));
    let step = 0;

    const id = setInterval(() => {
      step += 1;
      const t = Math.min(1, step / steps);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(from + (to - from) * eased);
      if (t >= 1) {
        clearInterval(id);
        fromRef.current = to;
      }
    }, stepMs);

    return () => clearInterval(id);
  }, [value]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
};
