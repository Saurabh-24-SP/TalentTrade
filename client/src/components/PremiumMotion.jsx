import { AnimatePresence, motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const staggerWrap = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export function PageShell({ children, className = "" }) {
  return (
    <div className={`premium-page ${className}`}>
      <div className="premium-orb premium-orb-a" />
      <div className="premium-orb premium-orb-b" />
      <div className="premium-orb premium-orb-c" />
      {children}
    </div>
  );
}

export function Reveal({ children, className = "", delay = 0, amount = 0.2 }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: amount });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className = "" }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerWrap}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

export function GlassCard({ children, className = "" }) {
  return <div className={`glass-card ${className}`}>{children}</div>;
}

export function SectionHeading({ eyebrow, title, description, align = "left" }) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-3 ${alignClass}`}>
      {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-description max-w-3xl">{description}</p>}
    </div>
  );
}

export function PremiumButton({ children, className = "", type = "button", ...props }) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`premium-button ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function GhostButton({ children, className = "", type = "button", ...props }) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`premium-button premium-button-ghost ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function AnimatedCounter({ end = 0, suffix = "", prefix = "", decimals = 0, className = "" }) {
  const [value, setValue] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.35 });
  const target = Number(end) || 0;

  useEffect(() => {
    if (!inView) return;

    const duration = 1300;
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [inView, target]);

  const display = useMemo(() => {
    if (decimals > 0) return value.toFixed(decimals);
    return Math.round(value).toLocaleString();
  }, [value, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function AnimatedTypingText({ sequences, className = "" }) {
  return (
    <TypeAnimation
      sequence={sequences}
      wrapper="span"
      speed={50}
      repeat={Infinity}
      className={className}
    />
  );
}

export function AnimatedProgress({ value = 0, className = "" }) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className={`progress-track ${className}`}>
      <motion.div
        className="progress-fill"
        initial={{ width: 0 }}
        whileInView={{ width: `${width}%` }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return <div className={`skeleton-card shimmer ${className}`} />;
}

export function LoadingGrid({ count = 6, className = "" }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} className="h-64 rounded-3xl" />
      ))}
    </div>
  );
}

export { AnimatePresence, motion };