import React, { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { ChevronRight, Fingerprint } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Scroll-triggered cinematic video hero (AuthNode)
 *
 * One tall section, one sticky full-screen video stage. As the visitor scrolls,
 * the chapter text scrolls over the stage and the background video cross-fades
 * to the next chapter. A pill at the bottom shows chapter + scroll progress.
 *
 * The background videos are original, seamless loops rendered for AuthNode
 * (see scripts/render-hero-videos.py) and live in /public/videos.
 */

// Height of the sticky site navbar (see Navbar.css .navbar-inner).
const NAV_H = 68;
const STAGE_H = `calc(100vh - ${NAV_H}px)`;

const chapters = [
  {
    id: "01",
    title: "The trust layer",
    subtitle: "A certificate. With proof.",
    description:
      "Every credential AuthNode issues receives a cryptographic identity - a fingerprint that anyone can check independently, without calling the institution.",
    video: "/videos/trust-layer.mp4",
    poster: "/videos/trust-layer.jpg",
    action: "Explore AuthNode",
    target: "#about",
  },
  {
    id: "02",
    title: "Blockchain ledger",
    subtitle: "Proof that stays connected.",
    description:
      "The fingerprint is anchored to a block in an append-only chain. Every record links to the one before it, so history can be extended - never quietly rewritten.",
    video: "/videos/ledger-chain.mp4",
    poster: "/videos/ledger-chain.jpg",
    action: "See how it works",
    target: "#about",
  },
  {
    id: "03",
    title: "Instant verification",
    subtitle: "Don't just trust it. Verify it.",
    description:
      "Scan the QR code or upload the certificate. AuthNode re-computes its fingerprint and matches it against the on-chain record - altered documents fail instantly.",
    video: "/videos/verification.mp4",
    poster: "/videos/verification.jpg",
    action: "Verify a certificate",
    target: "/verify",
  },
];

/* ---------- animation variants (same feel as the reference) ---------- */
const textContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const textReveal = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.4, ease: "easeOut" },
  },
};

/* ---------- sub-components ---------- */

function FilmGrain() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.07] mix-blend-overlay">
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}

function VideoBackground({ activeIndex, reduceMotion }) {
  const videoRefs = useRef([]);

  // Only the visible chapter's video needs to decode. Others pause once they
  // have faded out (1.2s) and resume as soon as they become active again.
  useEffect(() => {
    const timers = [];
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (reduceMotion) {
        video.pause();
        return;
      }
      if (index === activeIndex) {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } else {
        timers.push(setTimeout(() => video.pause(), 1300));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [activeIndex, reduceMotion]);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-[#030610]">
      {chapters.map((chapter, index) => (
        <motion.div
          key={chapter.id}
          initial={{ opacity: index === 0 ? 1 : 0 }}
          animate={{
            opacity: index === activeIndex ? 1 : 0,
            scale: index === activeIndex ? 1 : 1.04,
            zIndex: index === activeIndex ? 10 : 0,
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full"
        >
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            src={chapter.video}
            poster={chapter.poster}
            className="h-full w-full object-cover"
            autoPlay={!reduceMotion}
            muted
            loop
            playsInline
            preload={index === 0 ? "auto" : "metadata"}
            aria-hidden="true"
          />
        </motion.div>
      ))}

      {/* Legibility: soft darkening, stronger on the text side (left). */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-black/20" />
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-[#030610]/80 via-[#030610]/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-[#030610]/80 to-transparent" />
      <FilmGrain />
    </div>
  );
}

function DynamicNav({ activeIndex, progress }) {
  const smoothProgress = useSpring(progress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/80 p-2 pl-6 pr-2 shadow-2xl backdrop-blur-xl"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex flex-col">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
          Chapter {chapters[activeIndex].id}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="min-w-[120px] text-xs font-bold text-white"
          >
            {chapters[activeIndex].title}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative flex h-12 w-12 items-center justify-center">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="18" className="stroke-white/10" strokeWidth="2" fill="none" />
          <motion.circle
            cx="24"
            cy="24"
            r="18"
            className="stroke-violet-400"
            strokeWidth="2"
            fill="none"
            style={{ pathLength: smoothProgress }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-violet-200">
          <Fingerprint size={17} strokeWidth={1.6} />
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- main component ---------- */

export default function ScrollTriggeredVideoHero() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: [`start ${NAV_H}px`, "end end"],
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const next = Math.min(Math.floor(latest * chapters.length), chapters.length - 1);
      setActiveIndex(Math.max(0, next));
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const go = (target) => {
    if (target.startsWith("/")) navigate(target);
    else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      style={{ height: `calc(${chapters.length} * ${STAGE_H})` }}
      aria-label="How AuthNode works"
    >
      {/* 1. Sticky video stage + progress pill (disappear with the section) */}
      <div className="sticky overflow-hidden" style={{ top: NAV_H, height: STAGE_H }}>
        <VideoBackground activeIndex={activeIndex} reduceMotion={reduceMotion} />
        <DynamicNav activeIndex={activeIndex} progress={scrollYProgress} />
      </div>

      {/* 2. Chapter text - scrolls over the sticky stage */}
      <div className="pointer-events-none absolute inset-0 top-0 z-30">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="flex w-full items-center justify-start px-6 md:px-24"
            style={{ height: STAGE_H }}
          >
            <motion.div
              variants={textContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-20%" }}
              className="pointer-events-auto max-w-4xl pb-16"
            >
              {/* header line */}
              <motion.div variants={fadeIn} className="mb-6 flex items-center gap-4">
                <div className="h-0.5 w-12 bg-violet-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-violet-300">
                  Chapter {chapter.id}
                </span>
              </motion.div>

              {/* masked title reveal */}
              <div className="mb-6 overflow-hidden py-2">
                <motion.h2
                  variants={textReveal}
                  className="text-4xl font-black leading-none tracking-tighter text-white md:text-7xl"
                >
                  {chapter.subtitle}
                </motion.h2>
              </div>

              {/* description */}
              <motion.div
                variants={fadeIn}
                className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md"
              >
                <p className="text-lg font-light leading-relaxed text-white/80">
                  {chapter.description}
                </p>
              </motion.div>

              {/* button */}
              <motion.button
                type="button"
                variants={fadeIn}
                whileHover={{ scale: 1.05, x: 10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => go(chapter.target)}
                className="group mt-10 flex items-center gap-4 font-semibold text-white"
              >
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/30">
                  <div className="absolute inset-0 translate-y-full bg-white transition-transform duration-300 group-hover:translate-y-0" />
                  <ChevronRight
                    size={20}
                    className="relative z-10 transition-colors duration-300 group-hover:text-black"
                  />
                </div>
                <span className="text-xs uppercase tracking-widest">{chapter.action}</span>
              </motion.button>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
