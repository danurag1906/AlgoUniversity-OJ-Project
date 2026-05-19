import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";

// ─── Shared animation variants ───────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

// ─── Bento card ──────────────────────────────────────────────────────────────
function BentoCard({
  icon,
  title,
  description,
  className = "",
  large = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  large?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={`group relative rounded-xl border border-zinc-200 bg-white p-6 hover:border-red-200 hover:shadow-sm transition-all duration-200 cursor-default ${className}`}
    >
      <div className="mb-4 w-9 h-9 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-red-500 group-hover:border-red-200 group-hover:bg-red-50 transition-colors">
        {icon}
      </div>
      <h3
        className={`font-semibold text-zinc-900 mb-1.5 ${large ? "text-base" : "text-sm"}`}
      >
        {title}
      </h3>
      <p
        className={`text-zinc-500 leading-relaxed ${large ? "text-sm max-w-sm" : "text-sm"}`}
      >
        {description}
      </p>
    </motion.div>
  );
}

// ─── Section wrapper with scroll trigger ─────────────────────────────────────
function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Code editor illustration ────────────────────────────────────────────────
function EditorIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-md ml-auto select-none"
    >
      {/* Editor window */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-950 overflow-hidden shadow-lg shadow-zinc-200">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-zinc-900/60">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-zinc-700" />
            <span className="w-3 h-3 rounded-full bg-zinc-700" />
            <span className="w-3 h-3 rounded-full bg-zinc-700" />
          </div>
          <span className="text-xs text-zinc-500 font-mono">two_sum.py</span>
          <span className="text-xs text-zinc-600">Python</span>
        </div>

        {/* Code */}
        <div className="px-4 py-4 font-mono text-xs leading-6 overflow-x-auto">
          <div className="flex gap-4">
            {/* Line numbers */}
            <div className="text-right text-zinc-700 shrink-0 select-none">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <div key={n}>{n}</div>
              ))}
            </div>
            {/* Code body */}
            <div className="text-zinc-300 min-w-0">
              <div>
                <span className="text-red-400">def</span>{" "}
                <span className="text-white">two_sum</span>
                <span className="text-zinc-400">(nums, target):</span>
              </div>
              <div>
                <span className="text-zinc-600 pl-4">seen = </span>
                <span className="text-zinc-400">{"{}"}</span>
              </div>
              <div>
                <span className="text-red-400 pl-4">for</span>{" "}
                <span className="text-zinc-300">i, n</span>{" "}
                <span className="text-red-400">in</span>{" "}
                <span className="text-white">enumerate</span>
                <span className="text-zinc-400">(nums):</span>
              </div>
              <div>
                <span className="text-zinc-600 pl-8">diff = target</span>
                <span className="text-zinc-400"> - n</span>
              </div>
              <div>
                <span className="text-red-400 pl-8">if</span>{" "}
                <span className="text-zinc-300">diff</span>{" "}
                <span className="text-red-400">in</span>{" "}
                <span className="text-zinc-300">seen</span>
                <span className="text-zinc-400">:</span>
              </div>
              <div>
                <span className="text-red-400 pl-12">return</span>{" "}
                <span className="text-zinc-400">[seen[diff], i]</span>
              </div>
              <div>
                <span className="text-zinc-300 pl-8">seen[n]</span>
                <span className="text-zinc-400"> = i</span>
              </div>
              <div>&nbsp;</div>
              <div>
                <span className="text-zinc-500"># O(n) time · O(n) space</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict panel */}
        <div className="border-t border-white/[0.07] bg-zinc-900/40 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Submission result</span>
            <span className="text-xs font-semibold text-emerald-400">
              Accepted
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { tc: "Case 1", ok: true },
              { tc: "Case 2", ok: true },
              { tc: "Case 3", ok: true },
            ].map(({ tc, ok }) => (
              <div
                key={tc}
                className={`flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-mono ${ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
              >
                <span>{ok ? "✓" : "✗"}</span>
                <span>{tc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating AI hint card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="absolute -bottom-16 -left-6 bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 shadow-md max-w-[200px]"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] text-zinc-500 font-medium">AI Hint</span>
        </div>
        <p className="text-[11px] text-zinc-700 leading-snug">
          Try using a hash map to look up complements in O(1).
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Landing ─────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="bg-white min-h-screen text-zinc-900 font-sans">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-red-500 font-bold text-lg leading-none">
              //
            </span>
            <span className="text-zinc-900 font-semibold text-sm tracking-wide">
              AlgoJudge
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/problems">
              <button className="text-sm text-zinc-500 hover:text-zinc-900 px-3 py-1.5 transition-colors">
                Problems
              </button>
            </Link>
            <Link to="/signin">
              <button className="text-sm border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900 font-medium px-4 py-1.5 rounded-md transition-colors">
                Sign in
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible">
            {/* Eyebrow */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="flex items-center gap-2 mb-8"
            >
              <span className="inline-block w-6 h-[2px] bg-red-500" />
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Online Judge
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              custom={0.08}
              className="text-5xl sm:text-6xl font-bold leading-[1.08] tracking-tight text-zinc-900 mb-6"
            >
              Write code.
              <br />
              <span className="text-zinc-400">Get better.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={fadeUp}
              custom={0.18}
              className="text-base text-zinc-500 max-w-lg leading-relaxed mb-10"
            >
              A focused competitive programming platform — curated problems,
              Docker-isolated execution, AI hints, and instant feedback. No
              distractions.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              custom={0.26}
              className="flex items-center gap-3"
            >
              <Link to="/problems">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-6 py-2.5 rounded-md transition-colors"
                >
                  Start Solving
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
              </Link>
              <Link to="/signin">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 text-sm font-medium px-6 py-2.5 rounded-md transition-colors"
                >
                  Sign in with Google
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              variants={fadeUp}
              custom={0.36}
              className="flex items-center gap-6 mt-16 pt-8 border-t border-zinc-100"
            >
              {[
                { value: "8+", label: "Problems" },
                { value: "3", label: "Languages" },
                { value: "AI", label: "Hint engine" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-bold text-zinc-900">
                    {s.value}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column — editor illustration */}
          <EditorIllustration />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="border-t border-zinc-100 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <motion.div variants={fadeUp} custom={0} className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-4 h-[2px] bg-red-500" />
                <span className="text-xs text-zinc-400 uppercase tracking-widest">
                  Features
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">
                Built for serious practice
              </h2>
            </motion.div>

            {/* Bento grid */}
            <motion.div
              variants={{
                visible: { transition: { staggerChildren: 0.07 } },
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {/* Row 1: wide card + regular card */}
              <BentoCard
                icon={<IconAI />}
                title="AI Hints, not spoilers"
                description="Stuck? Ask the AI assistant for a nudge. It points you in the right direction without giving away the solution — so the learning stays yours."
                className="sm:col-span-2"
                large
              />
              <BentoCard
                icon={<IconVerdict />}
                title="Per-case Verdicts"
                description="See exactly which test case failed and what your code printed vs. what was expected."
              />
              {/* Row 2: three equal cards */}
              <BentoCard
                icon={<IconEditor />}
                title="Monaco Editor"
                description="VS Code's editor in the browser — syntax highlighting and auto-indent for C++, Java, and Python."
              />
              <BentoCard
                icon={<IconAuth />}
                title="Sign in with Google"
                description="No registration form. One click with your Google account and you're ready to submit."
              />
              <BentoCard
                icon={<IconProblems />}
                title="Curated Problems"
                description="Tagged by topic, split into Easy / Medium / Hard so you always know what to practice next."
              />
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="border-t border-zinc-100 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <motion.div variants={fadeUp} custom={0} className="mb-14">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-4 h-[2px] bg-red-500" />
                <span className="text-xs text-zinc-400 uppercase tracking-widest">
                  Workflow
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">
                How it works
              </h2>
            </motion.div>

            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-100 rounded-xl overflow-hidden border border-zinc-100"
            >
              {[
                {
                  n: "01",
                  title: "Pick a problem",
                  body: "Browse by difficulty or tag. Open the problem and read the statement with sample I/O.",
                },
                {
                  n: "02",
                  title: "Write your solution",
                  body: "Use the Monaco editor in C++, Java, or Python. Run against the sample to verify your logic first.",
                },
                {
                  n: "03",
                  title: "Submit & judge",
                  body: "Hit submit. Your code runs against all hidden test cases in isolated Docker containers and you get a verdict instantly.",
                },
              ].map((step) => (
                <motion.div
                  key={step.n}
                  variants={fadeUp}
                  className="bg-white p-8"
                >
                  <div className="text-red-500 font-bold text-xs tracking-widest mb-5">
                    {step.n}
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {step.body}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-zinc-100 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <motion.div
              variants={fadeUp}
              custom={0}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
                  Ready to grind?
                </h2>
                <p className="text-zinc-500 text-sm">
                  No account needed to browse. Sign in to submit.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link to="/problems">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-6 py-2.5 rounded-md transition-colors"
                  >
                    Browse Problems
                  </motion.button>
                </Link>
                <Link to="/signin">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900 text-sm font-medium px-6 py-2.5 rounded-md transition-colors"
                  >
                    Sign in
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-sm">//</span>
            <span className="text-xs text-zinc-400">AlgoJudge</span>
          </div>
          <a
            href="https://anuragdaliya.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Developed and maintained by Anurag Daliya
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.7",
} as const;

function IconAI() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" />
    </svg>
  );
}
function IconVerdict() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IconEditor() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
function IconAuth() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconProblems() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
