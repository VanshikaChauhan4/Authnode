import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  Fingerprint,
  Globe2,
  GraduationCap,
  History,
  KeyRound,
  Landmark,
  Link2,
  LockKeyhole,
  QrCode,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  WalletCards,
} from "lucide-react";

/* ============================================================
   DATA
============================================================ */

const features = [
  {
    icon: Fingerprint,
    title: "Cryptographic fingerprinting",
    desc: "Every certificate receives a unique cryptographic fingerprint. Change even one character and the fingerprint changes.",
  },
  {
    icon: Link2,
    title: "Blockchain anchored",
    desc: "Certificate fingerprints are anchored to an append-only blockchain ledger, creating a tamper-evident proof of issuance.",
  },
  {
    icon: ScanSearch,
    title: "Instant verification",
    desc: "Scan a QR code and verify whether a credential matches its original blockchain record.",
  },
  {
    icon: ShieldCheck,
    title: "Tamper evident",
    desc: "Unauthorized changes can be detected because the certificate no longer matches its original cryptographic proof.",
  },
  {
    icon: QrCode,
    title: "QR verification",
    desc: "Every credential can carry a verification QR code connected directly to its proof record.",
  },
  {
    icon: History,
    title: "Complete audit trail",
    desc: "Issuance and verification events can be tracked with timestamps for a transparent credential history.",
  },
  {
    icon: KeyRound,
    title: "Role-based access",
    desc: "Students, institutions and employers get access to the information relevant to their role.",
  },
  {
    icon: WalletCards,
    title: "Credential wallet",
    desc: "Students can keep verified academic credentials together and share proof whenever needed.",
  },
];

const steps = [
  {
    number: "01",
    icon: UploadCloud,
    title: "Issue",
    desc: "An authorized institution creates and issues a digital certificate through AuthNode.",
  },
  {
    number: "02",
    icon: Fingerprint,
    title: "Hash",
    desc: "The certificate data is converted into a unique cryptographic fingerprint.",
  },
  {
    number: "03",
    icon: Link2,
    title: "Anchor",
    desc: "The fingerprint is recorded against a blockchain transaction.",
  },
  {
    number: "04",
    icon: ScanSearch,
    title: "Verify",
    desc: "A verifier scans the credential and compares it against the original proof.",
  },
];

const roles = [
  {
    icon: Building2,
    title: "Institutions",
    desc: "Issue trusted certificates without depending on manual verification requests.",
    action: "/auth?role=institution",
  },
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Keep verified academic credentials in one secure and shareable place.",
    action: "/auth?role=student",
  },
  {
    icon: ScanSearch,
    title: "Employers",
    desc: "Verify certificates quickly without waiting for an institution to respond.",
    action: "/verify",
  },
];

const trustItems = [
  {
    icon: GraduationCap,
    label: "Universities",
  },
  {
    icon: Building2,
    label: "Institutions",
  },
  {
    icon: ShieldCheck,
    label: "Certifying Bodies",
  },
  {
    icon: Landmark,
    label: "Registries",
  },
  {
    icon: Award,
    label: "Accreditation",
  },
  {
    icon: Users,
    label: "Employers",
  },
  {
    icon: Globe2,
    label: "Global Verification",
  },
];

/* ============================================================
   ANIMATION
============================================================ */

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 25,
  },

  visible: {
    opacity: 1,
    y: 0,
  },
};

const staggerContainer = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

/* ============================================================
   ANIMATED AETHER BACKGROUND
============================================================ */

function AnimatedAetherBackground() {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = {
      x: null,
      y: null,
      radius: 190,
    };

    class Particle {
      constructor(x, y, vx, vy, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.baseAlpha = 0.45 + Math.random() * 0.4;
        this.pulse = Math.random() * Math.PI * 2;
        this.color =
          Math.random() > 0.72
            ? "191, 128, 255"
            : Math.random() > 0.45
              ? "129, 140, 248"
              : "56, 189, 248";
      }

      draw() {
        const alpha =
          this.baseAlpha +
          Math.sin(this.pulse) * 0.15;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${Math.max(0.15, alpha)})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${this.color}, 0.55)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      update() {
        this.pulse += 0.025;

        if (this.x <= 0 || this.x >= width) this.vx *= -1;
        if (this.y <= 0 || this.y >= height) this.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0 && distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            const forceX = dx / distance;
            const forceY = dy / distance;

            this.x -= forceX * force * 2.2;
            this.y -= forceY * force * 2.2;
          }
        }

        this.x += this.vx;
        this.y += this.vy;

        this.draw();
      }
    }

    const createParticles = () => {
      particles = [];

      const density = width < 768 ? 15000 : 10500;
      const count = Math.min(
        115,
        Math.max(38, Math.floor((width * height) / density))
      );

      for (let i = 0; i < count; i++) {
        particles.push(
          new Particle(
            Math.random() * width,
            Math.random() * height,
            (Math.random() - 0.5) * 0.32,
            (Math.random() - 0.5) * 0.32,
            Math.random() * 1.7 + 0.7
          )
        );
      }
    };

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const drawAtmosphere = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep background matching the AuthNode dark UI.
      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, "#030712");
      background.addColorStop(0.45, "#080617");
      background.addColorStop(1, "#02050c");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      // Purple/indigo/cyan ambient glows.
      const glows = [
        {
          x: width * 0.78,
          y: height * 0.25,
          radius: Math.min(width, height) * 0.42,
          color: "191, 128, 255",
          alpha: 0.09,
        },
        {
          x: width * 0.50,
          y: height * 0.58,
          radius: Math.min(width, height) * 0.35,
          color: "99, 102, 241",
          alpha: 0.065,
        },
        {
          x: width * 0.18,
          y: height * 0.82,
          radius: Math.min(width, height) * 0.30,
          color: "56, 189, 248",
          alpha: 0.045,
        },
      ];

      glows.forEach((glow) => {
        const gradient = ctx.createRadialGradient(
          glow.x,
          glow.y,
          0,
          glow.x,
          glow.y,
          glow.radius
        );

        gradient.addColorStop(
          0,
          `rgba(${glow.color}, ${glow.alpha})`
        );
        gradient.addColorStop(
          1,
          `rgba(${glow.color}, 0)`
        );

        ctx.fillStyle = gradient;
        ctx.fillRect(
          glow.x - glow.radius,
          glow.y - glow.radius,
          glow.radius * 2,
          glow.radius * 2
        );
      });
    };

    const drawGrid = () => {
      const gridSize = width < 768 ? 42 : 64;

      ctx.save();
      ctx.strokeStyle = "rgba(165, 180, 252, 0.035)";
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.restore();
    };

    const connectParticles = () => {
      const maxDistance = width < 768 ? 125 : 155;
      const maxDistanceSq = maxDistance * maxDistance;

      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq > maxDistanceSq) continue;

          const distance = Math.sqrt(distanceSq);
          let alpha = (1 - distance / maxDistance) * 0.24;

          if (mouse.x !== null && mouse.y !== null) {
            const mouseDx = particles[a].x - mouse.x;
            const mouseDy = particles[a].y - mouse.y;
            const mouseDistance = Math.sqrt(
              mouseDx * mouseDx + mouseDy * mouseDy
            );

            if (mouseDistance < mouse.radius) {
              alpha +=
                (1 - mouseDistance / mouse.radius) * 0.18;
            }
          }

          const gradient = ctx.createLinearGradient(
            particles[a].x,
            particles[a].y,
            particles[b].x,
            particles[b].y
          );

          gradient.addColorStop(
            0,
            `rgba(129, 140, 248, ${alpha})`
          );
          gradient.addColorStop(
            0.5,
            `rgba(191, 128, 255, ${alpha * 1.15})`
          );
          gradient.addColorStop(
            1,
            `rgba(56, 189, 248, ${alpha})`
          );

          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.75;
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    };

    const drawMouseGlow = () => {
      if (mouse.x === null || mouse.y === null) return;

      const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        mouse.radius
      );

      gradient.addColorStop(
        0,
        "rgba(191, 128, 255, 0.10)"
      );
      gradient.addColorStop(
        0.45,
        "rgba(129, 140, 248, 0.045)"
      );
      gradient.addColorStop(
        1,
        "rgba(129, 140, 248, 0)"
      );

      ctx.fillStyle = gradient;
      ctx.fillRect(
        mouse.x - mouse.radius,
        mouse.y - mouse.radius,
        mouse.radius * 2,
        mouse.radius * 2
      );
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      drawAtmosphere();
      drawGrid();

      particles.forEach((particle) => particle.update());
      connectParticles();
      drawMouseGlow();
    };

    const handleMouseMove = (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/20 via-transparent to-[#030712]/80" />

      <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/70 via-transparent to-[#080617]/35" />

      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(255,255,255,.45) 0.6px, transparent 0.7px)",
          backgroundSize: "4px 4px",
        }}
      />
    </div>
  );
}

/* ============================================================
   BLOCKCHAIN STATUS
============================================================ */

function BlockchainStatusCard() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.8,
        delay: 0.5,
      }}
      className="relative w-full max-w-[500px]"
    >
      {/* outer glow */}

      <div className="absolute -inset-8 rounded-[40px] bg-purple-500/[0.06] blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-purple-400/10 bg-[#0a0718]/90 shadow-2xl shadow-black/50 backdrop-blur-xl">

        {/* top line */}

        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

        {/* header */}

        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/[0.06]">

              <ShieldCheck
                size={19}
                strokeWidth={1.6}
                className="text-purple-300"
              />

            </div>

            <div>

              <p className="text-xs font-medium text-white">
                Credential Verification
              </p>

              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">
                AUTHNODE / PROOFED
              </p>

            </div>

          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-1.5">

            <span className="relative flex h-1.5 w-1.5">

              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />

            </span>

            <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-300">
              Verified
            </span>

          </div>

        </div>

        {/* content */}

        <div className="space-y-4 p-5">

          <div className="grid grid-cols-2 gap-3">

            {/* HASH */}

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

              <div className="mb-4 flex items-center justify-between">

                <Fingerprint
                  size={16}
                  className="text-purple-300"
                />

                <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">
                  SHA-256
                </span>

              </div>

              <p className="font-mono text-xs text-white/60">
                9F3A...C4B7
              </p>

            </div>

            {/* NETWORK */}

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

              <div className="mb-4 flex items-center justify-between">

                <Link2
                  size={16}
                  className="text-purple-300"
                />

                <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">
                  Network
                </span>

              </div>

              <p className="font-mono text-xs text-white/60">
                POLYGON PoS
              </p>

            </div>

          </div>

          {/* proof */}

          <div className="rounded-xl border border-purple-400/10 bg-purple-400/[0.025] p-4">

            <div className="mb-4 flex items-center justify-between">

              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
                Blockchain proof
              </span>

              <CheckCircle2
                size={15}
                className="text-emerald-400"
              />

            </div>

            <div className="flex items-center gap-3">

              <span className="font-mono text-[10px] text-purple-300/70">
                0x
              </span>

              <span className="truncate font-mono text-[10px] text-white/35">
                7af9d21c8f3a4e1b92d81c4a71f0...
              </span>

              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />

            </div>

          </div>

          {/* status */}

          <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">

            <div className="flex items-center gap-2">

              <Clock3
                size={13}
                className="text-white/25"
              />

              <span className="font-mono text-[9px] uppercase tracking-widest text-white/25">
                Block confirmed
              </span>

            </div>

            <span className="font-mono text-[10px] text-purple-300/70">
              #68,492,104
            </span>

          </div>

        </div>

      </div>

    </motion.div>
  );
}

/* ============================================================
   VERIFICATION TERMINAL
============================================================ */

function VerificationTerminal() {
  return (
    <div className="overflow-hidden rounded-2xl border border-purple-400/10 bg-[#080718] shadow-2xl shadow-black/40">

      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">

        <div className="flex items-center gap-2">

          <span className="h-2 w-2 rounded-full bg-red-400/50" />

          <span className="h-2 w-2 rounded-full bg-yellow-400/50" />

          <span className="h-2 w-2 rounded-full bg-emerald-400/50" />

        </div>

        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
          verification.node
        </span>

      </div>

      <div className="space-y-5 p-6 font-mono text-xs">

        <div className="flex gap-3">

          <span className="text-purple-400">
            $
          </span>

          <span className="text-white/45">
            verify certificate --qr 8AF21C
          </span>

        </div>

        <div className="space-y-3 border-l border-purple-400/10 pl-4 text-white/30">

          <p>
            <span className="text-purple-400/60">
              →
            </span>{" "}
            Reading certificate...
          </p>

          <p>
            <span className="text-purple-400/60">
              →
            </span>{" "}
            Generating SHA-256 fingerprint...
          </p>

          <p>
            <span className="text-purple-400/60">
              →
            </span>{" "}
            Querying blockchain proof...
          </p>

        </div>

        <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.035] p-5">

          <div className="mb-2 flex items-center gap-2">

            <CheckCircle2
              size={16}
              className="text-emerald-400"
            />

            <span className="font-semibold text-emerald-300">
              AUTHENTIC CREDENTIAL
            </span>

          </div>

          <p className="text-[10px] leading-6 text-white/35">
            Certificate fingerprint matches the blockchain
            record issued by the authorized institution.
          </p>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   BLOCKCHAIN NETWORK
============================================================ */

function BlockchainNetworkVisual() {
  const nodes = [
    ["18%", "22%"],
    ["48%", "12%"],
    ["78%", "24%"],
    ["28%", "62%"],
    ["58%", "52%"],
    ["84%", "70%"],
    ["48%", "88%"],
  ];

  return (
    <div className="relative h-[430px] overflow-hidden rounded-3xl border border-purple-400/10 bg-[#070617]">

      {/* grid */}

      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(196,181,253,.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196,181,253,.5) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* blue glow */}

      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.06] blur-[110px]" />

      {/* violet glow */}

      <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-purple-500/[0.05] blur-[100px]" />

      {/* connections */}

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >

        <line
          x1="18"
          y1="22"
          x2="48"
          y2="12"
          stroke="rgba(168,85,247,.20)"
          strokeWidth=".25"
        />

        <line
          x1="48"
          y1="12"
          x2="78"
          y2="24"
          stroke="rgba(168,85,247,.20)"
          strokeWidth=".25"
        />

        <line
          x1="18"
          y1="22"
          x2="28"
          y2="62"
          stroke="rgba(168,85,247,.20)"
          strokeWidth=".25"
        />

        <line
          x1="48"
          y1="12"
          x2="58"
          y2="52"
          stroke="rgba(168,85,247,.25)"
          strokeWidth=".25"
        />

        <line
          x1="78"
          y1="24"
          x2="58"
          y2="52"
          stroke="rgba(168,85,247,.20)"
          strokeWidth=".25"
        />

        <line
          x1="28"
          y1="62"
          x2="58"
          y2="52"
          stroke="rgba(168,85,247,.25)"
          strokeWidth=".25"
        />

        <line
          x1="58"
          y1="52"
          x2="84"
          y2="70"
          stroke="rgba(168,85,247,.20)"
          strokeWidth=".25"
        />

        <line
          x1="28"
          y1="62"
          x2="48"
          y2="88"
          stroke="rgba(168,85,247,.20)"
          strokeWidth=".25"
        />

        <line
          x1="58"
          y1="52"
          x2="48"
          y2="88"
          stroke="rgba(168,85,247,.20)"
          strokeWidth=".25"
        />

      </svg>

      {/* nodes */}

      {nodes.map((node, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            left: node[0],
            top: node[1],
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.55, 1, 0.55],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: index * 0.25,
          }}
        >

          <div className="relative flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-purple-400/20 bg-[#0a081a]">

            <div className="h-2 w-2 rounded-full bg-purple-300 shadow-[0_0_14px_rgba(168,85,247,.9)]" />

          </div>

        </motion.div>
      ))}

      {/* center */}

      <motion.div
        className="absolute left-[58%] top-[52%] -translate-x-1/2 -translate-y-1/2"
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(168,85,247,0)",
            "0 0 0 15px rgba(168,85,247,.035)",
            "0 0 0 0 rgba(168,85,247,0)",
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
        }}
      >

        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-purple-400/25 bg-[#0b091d] shadow-[0_0_50px_rgba(168,85,247,.10)]">

          <ShieldCheck
            size={32}
            strokeWidth={1.3}
            className="text-purple-300"
          />

        </div>

      </motion.div>

      {/* title */}

      <div className="absolute left-5 top-5">

        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-purple-300/60">
          Distributed proof network
        </p>

        <p className="mt-1 text-xs text-white/25">
          Credential verification layer
        </p>

      </div>

      {/* bottom */}

      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between border-t border-white/[0.07] pt-4">

        <div className="flex items-center gap-2">

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

          <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">
            Network operational
          </span>

        </div>

        <span className="font-mono text-[9px] text-white/20">
          7 ACTIVE NODES
        </span>

      </div>

    </div>
  );
}

/* ============================================================
   TRUST STRIP
============================================================ */

function TrustStrip() {
  return (
    <section className="border-y border-white/[0.06] bg-[#070617]">

      <div className="mx-auto flex max-w-7xl items-center gap-8 overflow-x-auto px-6 py-5 lg:px-8">

        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
          Credential ecosystem
        </span>

        <div className="h-5 w-px shrink-0 bg-white/[0.08]" />

        {trustItems.map((item) => {

          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex shrink-0 items-center gap-2 text-white/25"
            >

              <Icon
                size={15}
                strokeWidth={1.5}
              />

              <span className="text-xs">
                {item.label}
              </span>

            </div>
          );
        })}

      </div>

    </section>
  );
}

/* ============================================================
   FULL WIDTH PROOF LAYER COVERFLOW
============================================================ */

function ProofLayerCoverflow() {
  const [active, setActive] = React.useState(0);
  const [viewportWidth, setViewportWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );

  const total = features.length;

  /* Keep the carousel responsive without any automatic rotation. */
  React.useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* Move only when the user clicks a card or a pagination dot. */
  const selectCard = (index) => {
    setActive(index);
  };

  const getOffset = (index) => {
    let offset = index - active;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    return offset;
  };

  /*
   * The spacing is deliberately wide so the cards use the
   * complete viewport instead of collapsing into the center.
   */
  const spacing =
    viewportWidth >= 1700
      ? 350
      : viewportWidth >= 1450
        ? 320
        : viewportWidth >= 1200
          ? 285
          : viewportWidth >= 900
            ? 245
            : viewportWidth >= 640
              ? 205
              : 175;

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 select-none">
      {/* Wide ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.055] blur-[150px]" />

      {/* Full viewport stage */}
      <div
        className="relative h-[640px] w-full overflow-hidden"
        style={{
          perspective: "1800px",
          perspectiveOrigin: "50% 43%",
        }}
      >
        {/* Soft center rings */}
        <div className="pointer-events-none absolute left-1/2 top-[44%] h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-300/[0.035]" />

        <div className="pointer-events-none absolute left-1/2 top-[44%] h-[660px] w-[660px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.018]" />

        {features.map((feature, index) => {
          const Icon = feature.icon;

          const offset = getOffset(index);
          const distance = Math.abs(offset);
          const isCenter = offset === 0;

          const x = offset * spacing;

          const z = isCenter
            ? 150
            : -Math.pow(distance, 1.18) * 105;

          const rotateY = offset * -18;

          const scale =
            distance === 0
              ? 1
              : distance === 1
                ? 0.86
                : distance === 2
                  ? 0.74
                  : distance === 3
                    ? 0.64
                    : 0.56;

          const opacity =
            distance === 0
              ? 1
              : distance === 1
                ? 0.78
                : distance === 2
                  ? 0.52
                  : distance === 3
                    ? 0.30
                    : 0.16;

          return (
            <motion.button
              key={feature.title}
              type="button"
              aria-label={`Show ${feature.title}`}
              onClick={() => selectCard(index)}
              className="
                absolute
                left-1/2
                top-[44%]
                h-[445px]
                w-[330px]
                -translate-x-1/2
                -translate-y-1/2
                cursor-pointer
                text-left
                outline-none
              "
              animate={{
                x,
                z,
                rotateY,
                scale,
                opacity,
              }}
              transition={{
                type: "spring",
                stiffness: 155,
                damping: 24,
                mass: 0.85,
              }}
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
                zIndex: 100 - distance,
              }}
            >
              <div
                className={`
                  relative
                  flex
                  h-full
                  w-full
                  flex-col
                  overflow-hidden
                  rounded-[30px]
                  border
                  p-7
                  backdrop-blur-xl
                  ${
                    isCenter
                      ? "border-purple-300/30 bg-[#0b091d]/[0.98] shadow-[0_35px_110px_rgba(0,0,0,.68),0_0_80px_rgba(168,85,247,.14)]"
                      : "border-white/[0.08] bg-[#090817]/[0.96] shadow-[0_25px_75px_rgba(0,0,0,.58)]"
                  }
                `}
              >
                {/* Card top highlight */}
                <div
                  className={`
                    absolute
                    left-0
                    right-0
                    top-0
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-purple-300
                    to-transparent
                    ${isCenter ? "opacity-100" : "opacity-25"}
                  `}
                />

                {/* Card glow */}
                <div
                  className={`
                    pointer-events-none
                    absolute
                    -right-28
                    -top-28
                    h-64
                    w-64
                    rounded-full
                    bg-purple-500/[0.09]
                    blur-[80px]
                    ${isCenter ? "opacity-100" : "opacity-45"}
                  `}
                />

                {/* Header */}
                <div className="relative flex shrink-0 items-center justify-between">
                  <div
                    className={`
                      flex
                      h-14
                      w-14
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      ${
                        isCenter
                          ? "border-purple-300/30 bg-purple-400/[0.09] shadow-[0_0_35px_rgba(168,85,247,.10)]"
                          : "border-white/[0.08] bg-white/[0.025]"
                      }
                    `}
                  >
                    <Icon
                      size={24}
                      strokeWidth={1.5}
                      className={
                        isCenter
                          ? "text-purple-200"
                          : "text-purple-300/60"
                      }
                    />
                  </div>

                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
                    {String(index + 1).padStart(2, "0")} / 08
                  </span>
                </div>

                {/* Content
                    No mt-auto here. The text now flows naturally
                    and cannot get pushed below the visible card. */}
                <div className="relative mt-8 flex min-h-0 flex-1 flex-col">
                  <div className="mb-4 flex shrink-0 items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.7)]" />

                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300/65">
                      Proof layer
                    </span>
                  </div>

                  <h3
                    className={`
                      shrink-0
                      font-medium
                      leading-[1.12]
                      tracking-[-0.035em]
                      ${
                        isCenter
                          ? "text-[27px] text-white"
                          : "text-[21px] text-white/80"
                      }
                    `}
                  >
                    {feature.title}
                  </h3>

                  <p
                    className={`
                      mt-4
                      max-w-full
                      break-words
                      leading-6
                      ${
                        isCenter
                          ? "text-[13px] text-white/50"
                          : "text-[11px] text-white/30"
                      }
                    `}
                  >
                    {feature.desc}
                  </p>

                  {/* Footer stays inside the card */}
                  <div className="mt-auto flex shrink-0 items-center justify-between border-t border-white/[0.07] pt-4">
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">
                      AUTHNODE
                    </span>

                    <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-emerald-300/40">
                      VERIFIED
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Pagination — manual only */}
      <div className="relative z-[200] mt-[-18px] flex items-center justify-center gap-2">
        {features.map((feature, index) => (
          <button
            key={feature.title}
            type="button"
            aria-label={`Go to ${feature.title}`}
            onClick={() => selectCard(index)}
            className={`
              h-1.5
              rounded-full
              transition-all
              duration-500
              ${
                active === index
                  ? "w-10 bg-purple-300 shadow-[0_0_15px_rgba(216,180,254,.65)]"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              }
            `}
          />
        ))}
      </div>

      <div className="mt-6 text-center">
        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/15">
          Click a card or dot to explore
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN LANDING PAGE
============================================================ */

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative min-h-[760px] overflow-hidden border-b border-white/[0.07] lg:min-h-[820px]">

        {/* ANIMATED PARTICLE / NETWORK BACKGROUND */}
        <AnimatedAetherBackground />

        {/* subtle purple + cyan cinematic glow */}
        <div className="pointer-events-none absolute right-[6%] top-[14%] z-[1] h-80 w-80 rounded-full bg-purple-500/[0.05] blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[8%] left-[24%] z-[1] h-72 w-72 rounded-full bg-indigo-500/[0.04] blur-[120px]" />

        {/* CONTENT */}

        <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-6 py-32 lg:min-h-[820px] lg:px-8">

          <div className="grid w-full items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">

            {/* LEFT */}

            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-3xl"
            >

              {/* badge */}

              <motion.div
                variants={fadeUp}
                transition={{
                  duration: 0.6,
                }}
                className="mb-7 inline-flex items-center gap-2 rounded-full border border-purple-400/15 bg-purple-400/[0.05] px-4 py-2 backdrop-blur-xl"
              >

                <span className="relative flex h-2 w-2">

                  <span className="absolute h-full w-full animate-ping rounded-full bg-purple-400 opacity-50" />

                  <span className="relative h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,.7)]" />

                </span>

                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-purple-200/75">
                  Blockchain verified credentials
                </span>

              </motion.div>

              {/* heading */}

              <motion.h1
                variants={fadeUp}
                transition={{
                  duration: 0.7,
                }}
                className="text-balance text-5xl font-medium leading-[0.97] tracking-[-0.045em] sm:text-6xl lg:text-[76px]"
              >

                Certificates

                <span className="block text-white/40">
                  backed by
                </span>

                <span className="relative inline-block text-purple-300">

                  proof.

                  <span className="absolute -bottom-2 left-0 h-px w-full bg-gradient-to-r from-purple-300 to-transparent" />

                </span>

              </motion.h1>

              {/* description */}

              <motion.p
                variants={fadeUp}
                transition={{
                  duration: 0.7,
                }}
                className="mt-8 max-w-xl text-base leading-7 text-white/45 sm:text-lg"
              >
                AuthNode transforms academic and professional
                certificates into tamper-evident digital credentials
                backed by cryptographic proof and blockchain
                verification.
              </motion.p>

              {/* buttons */}

              <motion.div
                variants={fadeUp}
                transition={{
                  duration: 0.7,
                }}
                className="mt-9 flex flex-wrap gap-3"
              >

                <motion.button
                  onClick={() => navigate("/auth")}
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="group flex items-center gap-3 rounded-xl bg-purple-300 px-5 py-3.5 text-sm font-semibold text-[#031018] shadow-[0_0_35px_rgba(168,85,247,.16)] transition hover:bg-purple-200"
                >

                  Get started

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />

                </motion.button>

                <motion.button
                  onClick={() => navigate("/verify")}
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="flex items-center gap-3 rounded-xl border border-purple-400/15 bg-white/[0.035] px-5 py-3.5 text-sm font-medium text-white backdrop-blur-xl transition hover:border-purple-300/30 hover:bg-purple-400/[0.05]"
                >

                  <ScanSearch size={17} />

                  Verify a certificate

                </motion.button>

              </motion.div>

              {/* proof statement */}

              <motion.div
                variants={fadeUp}
                transition={{
                  duration: 0.7,
                }}
                className="mt-12 flex max-w-xl items-start gap-4 border-l border-purple-400/25 pl-5"
              >

                <LockKeyhole
                  size={17}
                  className="mt-1 shrink-0 text-purple-300/70"
                />

                <p className="text-xs leading-6 text-white/30">

                  <span className="text-white/55">
                    One certificate. One fingerprint. One
                    verifiable proof.
                  </span>{" "}

                  Alter the credential and the cryptographic
                  fingerprint no longer matches.

                </p>

              </motion.div>

            </motion.div>

            {/* RIGHT */}

            <div className="hidden justify-end lg:flex">

              <BlockchainStatusCard />

            </div>

          </div>

        </div>

        {/* scroll */}

        <a
          href="#about"
          className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-white/25 transition hover:text-purple-300/60"
        >

          <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
            Explore
          </span>

          <ChevronDown
            size={15}
            className="animate-bounce"
          />

        </a>

      </section>

      {/* ======================================================
          TRUST
      ====================================================== */}

      <TrustStrip />

      {/* ======================================================
          ABOUT
      ====================================================== */}

      <section
        id="about"
        className="relative border-b border-white/[0.07] py-28 lg:py-36"
      >

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="grid items-center gap-16 lg:grid-cols-[.9fr_1.1fr]">

            <motion.div
              initial={{
                opacity: 0,
                y: 25,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.7,
              }}
            >

              <div className="mb-5 flex items-center gap-3">

                <span className="h-px w-8 bg-purple-300/60" />

                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-300/60">
                  The problem
                </span>

              </div>

              <h2 className="max-w-xl text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-5xl">

                Trust shouldn't depend on

                <span className="text-white/30">
                  {" "}
                  a phone call.
                </span>

              </h2>

              <div className="mt-7 max-w-xl space-y-5 text-sm leading-7 text-white/40">

                <p>
                  A certificate may look official, but verifying
                  whether it was actually issued can still become
                  slow and manual.
                </p>

                <p>
                  AuthNode introduces a cryptographic proof layer
                  between the institution that issues a credential
                  and the person who needs to verify it.
                </p>

                <p>
                  Instead of asking someone to simply trust the
                  document, the document can provide evidence of
                  its own authenticity.
                </p>

              </div>

              {/* metrics */}

              <div className="mt-10 grid max-w-xl grid-cols-3 border-y border-white/[0.07] py-6">

                <div>

                  <p className="text-2xl font-medium text-purple-300">
                    SHA-256
                  </p>

                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/20">
                    Fingerprinting
                  </p>

                </div>

                <div className="border-l border-white/[0.07] pl-5">

                  <p className="text-2xl font-medium text-purple-300">
                    PoS
                  </p>

                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/20">
                    Blockchain
                  </p>

                </div>

                <div className="border-l border-white/[0.07] pl-5">

                  <p className="text-2xl font-medium text-purple-300">
                    QR
                  </p>

                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/20">
                    Verification
                  </p>

                </div>

              </div>

            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                x: 30,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.8,
              }}
            >

              <VerificationTerminal />

            </motion.div>

          </div>

        </div>

      </section>

      {/* ======================================================
          NETWORK
      ====================================================== */}

      <section className="border-b border-white/[0.07] bg-[#060617] py-28 lg:py-36">

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="grid items-center gap-16 lg:grid-cols-[.85fr_1.15fr]">

            <motion.div
              initial={{
                opacity: 0,
                y: 25,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.7,
              }}
            >

              <div className="mb-5 flex items-center gap-3">

                <span className="h-px w-8 bg-purple-300/60" />

                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-300/60">
                  Distributed proof
                </span>

              </div>

              <h2 className="text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-5xl">

                Your credential.

                <span className="block text-white/30">
                  Your cryptographic proof.
                </span>

              </h2>

              <p className="mt-7 max-w-lg text-sm leading-7 text-white/40">
                A certificate can become part of a distributed
                verification layer. Institutions issue the
                credential, blockchain stores the proof, and
                verifiers check the match.
              </p>

              <div className="mt-9 space-y-5">

                {[
                  {
                    icon: Fingerprint,
                    title: "Generate proof",
                    text: "Create a unique fingerprint from the credential.",
                  },
                  {
                    icon: Link2,
                    title: "Anchor the proof",
                    text: "Record the fingerprint against a blockchain transaction.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Verify the match",
                    text: "Compare the presented credential with its original proof.",
                  },
                ].map((item) => {

                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex gap-4"
                    >

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/15 bg-purple-400/[0.035]">

                        <Icon
                          size={18}
                          className="text-purple-300"
                        />

                      </div>

                      <div>

                        <h3 className="text-sm font-medium text-white">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-white/30">
                          {item.text}
                        </p>

                      </div>

                    </div>
                  );
                })}

              </div>

            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.97,
              }}
              whileInView={{
                opacity: 1,
                scale: 1,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.8,
              }}
            >

              <BlockchainNetworkVisual />

            </motion.div>

          </div>

        </div>

      </section>

      {/* ======================================================
          FEATURES
      ====================================================== */}

      <section className="relative overflow-hidden border-b border-white/[0.07] py-28 lg:py-36">
        {/* Ambient section atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-purple-500/[0.025] via-transparent to-cyan-500/[0.012]" />
        <div className="pointer-events-none absolute left-1/2 top-[48%] h-[500px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.035] blur-[140px]" />

        {/* Heading */}
        <div className="relative z-20 mx-auto mb-14 max-w-3xl px-6 text-center lg:mb-16">
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-purple-300/60" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-purple-300/60">
              Verification infrastructure
            </span>
            <span className="h-px w-10 bg-purple-300/60" />
          </div>

          <h2 className="text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Everything needed to
            <span className="text-white/30"> establish trust.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/30">
            A complete credential lifecycle from issuance to verification.
          </p>
        </div>

        {/* Full-width 3D proof cards */}
        <div className="relative z-10">
          <ProofLayerCoverflow />
        </div>
      </section>

      {/* ======================================================
          HOW IT WORKS
      ====================================================== */}

      <section className="border-b border-white/[0.07] bg-[#060617] py-28 lg:py-36">

        <div className="mx-auto max-w-5xl px-6 lg:px-8">

          <div className="mb-16 text-center">

            <div className="mb-5 flex items-center justify-center gap-3">

              <span className="h-px w-8 bg-purple-300/60" />

              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-300/60">
                How it works
              </span>

              <span className="h-px w-8 bg-purple-300/60" />

            </div>

            <h2 className="text-4xl font-medium tracking-[-0.035em] sm:text-5xl">

              From certificate

              <span className="text-white/30">
                {" "}
                to proof.
              </span>

            </h2>

          </div>

          <div className="relative">

            <div className="absolute bottom-0 left-[20px] top-0 w-px bg-gradient-to-b from-purple-300/30 via-white/[0.08] to-transparent sm:left-[28px]" />

            <div>

              {steps.map((step, index) => {

                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.number}
                    initial={{
                      opacity: 0,
                      x: -20,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                    }}
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                    }}
                    className="relative grid grid-cols-[42px_1fr] gap-6 border-b border-white/[0.06] py-8 last:border-b-0 sm:grid-cols-[58px_1fr] sm:gap-8"
                  >

                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/15 bg-[#060617] sm:h-14 sm:w-14">

                      <Icon
                        size={19}
                        className="text-purple-300"
                        strokeWidth={1.6}
                      />

                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-10">

                      <div className="max-w-md">

                        <div className="mb-2 font-mono text-[9px] tracking-[0.2em] text-purple-300/50">
                          STEP {step.number}
                        </div>

                        <h3 className="text-xl font-medium text-white">
                          {step.title}
                        </h3>

                      </div>

                      <p className="max-w-lg text-sm leading-6 text-white/30">
                        {step.desc}
                      </p>

                    </div>

                  </motion.div>
                );
              })}

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          ROLES
      ====================================================== */}

      <section className="border-b border-white/[0.07] py-28 lg:py-36">

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="mb-14 max-w-2xl">

            <div className="mb-5 flex items-center gap-3">

              <span className="h-px w-8 bg-purple-300/60" />

              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-300/60">
                Built for the ecosystem
              </span>

            </div>

            <h2 className="text-4xl font-medium tracking-[-0.035em] sm:text-5xl">

              One verification layer.

              <span className="block text-white/30">
                Three essential roles.
              </span>

            </h2>

          </div>

          <div className="grid gap-4 lg:grid-cols-3">

            {roles.map((role, index) => {

              const Icon = role.icon;

              return (
                <motion.button
                  key={role.title}
                  onClick={() => navigate(role.action)}
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                  }}
                  whileHover={{
                    y: -5,
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070617] p-7 text-left transition hover:border-purple-400/20"
                >

                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-purple-400/[0.035] blur-3xl transition group-hover:bg-purple-400/[0.08]" />

                  <div className="relative">

                    <div className="mb-12 flex items-center justify-between">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025]">

                        <Icon
                          size={22}
                          strokeWidth={1.6}
                          className="text-purple-300"
                        />

                      </div>

                      <ArrowUpRight
                        size={18}
                        className="text-white/15 transition group-hover:text-purple-300"
                      />

                    </div>

                    <h3 className="text-xl font-medium text-white">
                      {role.title}
                    </h3>

                    <p className="mt-3 max-w-sm text-sm leading-6 text-white/30">
                      {role.desc}
                    </p>

                    <div className="mt-8 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/20 transition group-hover:text-purple-300/70">

                      Continue

                      <ArrowRight size={12} />

                    </div>

                  </div>

                </motion.button>
              );
            })}

          </div>

        </div>

      </section>

      {/* ======================================================
          FINAL CTA
      ====================================================== */}

      <section className="relative overflow-hidden py-32 lg:py-44">

        <div className="absolute inset-0 bg-[#04030d]" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-400/[0.045] blur-[140px]" />

        <div className="absolute left-[20%] top-[30%] h-56 w-56 rounded-full bg-purple-500/[0.035] blur-[100px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(196,181,253,.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(196,181,253,.5) 1px, transparent 1px)
            `,
            backgroundSize: "70px 70px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.7,
            }}
          >

            <div className="mb-6 flex items-center justify-center gap-2">

              <Sparkles
                size={15}
                className="text-purple-300"
              />

              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-300/70">
                Make trust provable
              </span>

            </div>

            <h2 className="text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-6xl">

              Stop asking

              <span className="text-white/30">
                {" "}
                “Is this real?”
              </span>

            </h2>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/30 sm:text-base">
              Issue blockchain-backed credentials or verify an
              existing certificate with cryptographic proof.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">

              <motion.button
                onClick={() => navigate("/auth")}
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className="group flex items-center gap-3 rounded-xl bg-purple-300 px-6 py-3.5 text-sm font-semibold text-[#031018] transition hover:bg-purple-200"
              >

                Get started

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />

              </motion.button>

              <motion.button
                onClick={() => navigate("/verify")}
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className="flex items-center gap-3 rounded-xl border border-purple-400/15 bg-white/[0.025] px-6 py-3.5 text-sm font-medium text-white transition hover:border-purple-300/25 hover:bg-purple-400/[0.04]"
              >

                <FileCheck2 size={17} />

                Verify certificate

              </motion.button>

            </div>

          </motion.div>

        </div>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-white/[0.06] bg-[#02030a]">

        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-400/15 bg-purple-400/[0.04]">

              <ShieldCheck
                size={16}
                className="text-purple-300"
              />

            </div>

            <span className="text-sm font-medium">
              AuthNode
            </span>

          </div>

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/15">

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            Blockchain verification infrastructure

          </div>

        </div>

      </footer>

    </main>
  );
}
