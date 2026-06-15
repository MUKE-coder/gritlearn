package models

import (
	"encoding/json"
	"log"

	"gorm.io/gorm"
)

const heroSplit01TSX = `import { ArrowRight, Terminal, Zap, Shield } from "lucide-react";

export default function HeroSplit01() {
  return (
    <section className="min-h-screen bg-background flex items-center">
      <div className="container mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text + CTAs */}
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-bg-elevated w-fit">
            <Zap size={12} className="text-accent" />
            <span className="text-xs text-text-secondary font-medium tracking-wide">Now in public beta</span>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Ship faster with{" "}
              <span className="text-accent">full-stack</span>{" "}
              confidence
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-md">
              Grit combines Go and Next.js into a single CLI. Generate APIs, admin panels,
              and frontends in seconds — not days.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors duration-150"
            >
              Get started free
              <ArrowRight size={16} />
            </a>
            <a
              href="/docs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-bg-elevated hover:bg-bg-hover text-foreground font-semibold text-sm transition-colors duration-150"
            >
              <Terminal size={16} className="text-text-secondary" />
              View docs
            </a>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-success" />
              <span className="text-xs text-text-secondary">SOC 2 compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-warning" />
              <span className="text-xs text-text-secondary">Deploy in 60 seconds</span>
            </div>
          </div>
        </div>

        {/* Right: Code block */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-accent opacity-10 blur-xl" />
          <div className="relative rounded-2xl border border-border bg-bg-secondary overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg-elevated">
              <div className="w-3 h-3 rounded-full bg-danger opacity-70" />
              <div className="w-3 h-3 rounded-full bg-warning opacity-70" />
              <div className="w-3 h-3 rounded-full bg-success opacity-70" />
              <span className="ml-3 text-xs text-text-muted font-mono">terminal</span>
            </div>

            {/* Code content */}
            <div className="p-6 font-mono text-sm leading-relaxed">
              <div className="flex gap-3">
                <span className="text-text-muted select-none">$</span>
                <span className="text-success">npx create-grit-app</span>
                <span className="text-text-secondary">my-saas</span>
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <div className="text-text-muted">{"  "}✔ Scaffolding Go API...</div>
                <div className="text-text-muted">{"  "}✔ Setting up Next.js admin...</div>
                <div className="text-text-muted">{"  "}✔ Generating TypeScript types...</div>
                <div className="text-text-muted">{"  "}✔ Wiring Docker compose...</div>
                <div className="mt-2 text-success">  Project ready in 1.4s</div>
              </div>
              <div className="mt-4 flex gap-3">
                <span className="text-text-muted select-none">$</span>
                <span className="text-foreground">cd my-saas</span>
              </div>
              <div className="mt-2 flex gap-3">
                <span className="text-text-muted select-none">$</span>
                <span className="text-success">grit dev</span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <div className="text-text-muted">{"  "}▲ API running on :8080</div>
                <div className="text-text-muted">{"  "}▲ Web running on :3000</div>
                <div className="text-text-muted">{"  "}▲ Admin running on :3001</div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-block w-2 h-4 bg-accent animate-pulse rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`

const logoCloud01TSX = `import React from "react";

const logos = [
  "Acme Corp",
  "Veritas",
  "Nexus Labs",
  "Orbit AI",
  "Stackline",
  "Pulsar Co",
  "Zenith",
  "Forge",
  "Altus",
  "Meridian",
  "Apex IO",
  "Crest",
];

export default function LogoCloud01() {
  const doubled = [...logos, ...logos];

  return (
    <section className="bg-background border-y border-border py-12 overflow-hidden">
      <div className="container mx-auto px-6 mb-8 text-center">
        <p className="text-sm text-text-muted font-medium tracking-widest uppercase">
          Trusted by 500+ teams worldwide
        </p>
      </div>

      <div className="relative flex overflow-hidden">
        {/* Fade masks */}
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--color-background, #0a0a0f), transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--color-background, #0a0a0f), transparent)" }}
        />

        {/* Scrolling track */}
        <div
          className="flex gap-16 items-center whitespace-nowrap"
          style={{
            animation: "marquee 28s linear infinite",
          }}
        >
          {doubled.map((name, i) => (
            <span
              key={i}
              className="text-text-muted font-semibold text-lg tracking-tight opacity-50 hover:opacity-80 transition-opacity duration-200 select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }" }} />
    </section>
  );
}
`

const testimonialCard01TSX = `import { Star } from "lucide-react";

interface TestimonialCard01Props {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  stars?: number;
}

export default function TestimonialCard01({
  quote,
  name,
  role,
  company,
  avatar,
  stars = 5,
}: TestimonialCard01Props) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-5 p-6 rounded-2xl border border-border bg-bg-elevated hover:bg-bg-hover transition-colors duration-200">
      {/* Stars */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < stars ? "text-warning fill-warning" : "text-border fill-border"}
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-foreground text-sm leading-relaxed">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-9 h-9 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-foreground text-sm font-semibold truncate">{name}</span>
          <span className="text-text-muted text-xs truncate">
            {role} at {company}
          </span>
        </div>
      </div>
    </div>
  );
}
`

const testimonialGrid01TSX = `import { Star } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  stars: number;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Grit cut our backend setup time from a week to under an hour. The generated types and handlers are exactly what we would have written by hand — just faster.",
    name: "Sofia Ramirez",
    role: "CTO",
    company: "Stackline",
    stars: 5,
  },
  {
    quote:
      "The admin panel generation alone is worth it. We launched a fully featured dashboard to our clients in two days. Previously that was a month of work.",
    name: "James Whitfield",
    role: "Lead Engineer",
    company: "Orbit AI",
    stars: 5,
  },
  {
    quote:
      "Finally a Go framework that doesn't make me choose between productivity and control. The grit generate command is genuinely magical.",
    name: "Priya Nambiar",
    role: "Senior Developer",
    company: "Nexus Labs",
    stars: 5,
  },
];

function TestimonialCard({ t }: { t: Testimonial }) {
  const initials = t.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-5 p-6 rounded-2xl border border-border bg-bg-elevated hover:bg-bg-hover transition-colors duration-200 h-full">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < t.stars ? "text-warning fill-warning" : "text-border fill-border"}
          />
        ))}
      </div>
      <blockquote className="text-foreground text-sm leading-relaxed flex-1">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-foreground text-sm font-semibold truncate">{t.name}</span>
          <span className="text-text-muted text-xs truncate">
            {t.role} at {t.company}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialGrid01() {
  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground tracking-tight">
            Loved by developers
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-xl mx-auto">
            Teams across the world trust Grit to ship production-ready apps faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
`

const statsBanner01TSX = `interface Stat {
  value: string;
  label: string;
}

interface StatsBanner01Props {
  stats: Stat[];
}

export default function StatsBanner01({ stats }: StatsBanner01Props) {
  const displayStats =
    stats && stats.length > 0
      ? stats
      : [
          { value: "10K+", label: "Developers" },
          { value: "$2M+", label: "Saved in dev hours" },
          { value: "500+", label: "Companies" },
          { value: "99.9%", label: "Uptime" },
        ];

  return (
    <section className="bg-bg-secondary border-y border-border py-16 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 50%, rgba(108,92,231,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-border">
          {displayStats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-2 py-4"
            >
              <span className="text-5xl font-bold text-foreground tracking-tight">
                {stat.value}
              </span>
              <span className="text-sm text-text-secondary font-medium text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`

const faqAccordion01TSX = `"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Faq {
  question: string;
  answer: string;
}

interface FaqAccordion01Props {
  faqs: Faq[];
}

const defaultFaqs: Faq[] = [
  {
    question: "What is Grit?",
    answer:
      "Grit is a full-stack meta-framework that combines a Go (Gin + GORM) backend with a Next.js frontend. A single CLI scaffolds your entire project, generates resources, and keeps your TypeScript types in sync with your Go models.",
  },
  {
    question: "Do I need to know both Go and TypeScript?",
    answer:
      "Basic Go knowledge is helpful, but Grit is designed to be beginner-friendly. The scaffolded code follows strict conventions so you can learn as you build. The frontend is pure TypeScript/React, so frontend developers can start there.",
  },
  {
    question: "How is Grit different from other Go frameworks?",
    answer:
      "Most Go frameworks handle only the backend. Grit generates the full stack — Go API, Next.js admin panel, web frontend, shared types, Docker setup, and tests — all wired together and production-ready from day one.",
  },
  {
    question: "Is there a self-hosted option?",
    answer:
      "Yes. Grit is open-source and fully self-hostable. The included Docker Compose file starts PostgreSQL, Redis, MinIO, and Mailhog locally. You can deploy to any cloud provider that runs Docker.",
  },
];

export default function FaqAccordion01({ faqs }: FaqAccordion01Props) {
  const items = faqs && faqs.length > 0 ? faqs : defaultFaqs;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-foreground tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-text-secondary text-lg">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border overflow-hidden">
          {items.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="bg-bg-elevated">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-bg-hover transition-colors duration-150"
                  aria-expanded={isOpen}
                >
                  <span className="text-foreground font-semibold text-sm leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className="text-text-secondary shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: isOpen ? "400px" : "0px" }}
                >
                  <p className="px-6 pb-5 text-text-secondary text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
`

const ctaBanner01TSX = `"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface CtaBanner01Props {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonHref: string;
}

export default function CtaBanner01({
  title = "Start building today",
  subtitle = "Join thousands of developers shipping faster with Grit.",
  buttonText = "Get started free",
  buttonHref = "/get-started",
}: CtaBanner01Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section className="bg-background py-24 relative overflow-hidden">
      {/* Radial purple glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 60%, rgba(108,92,231,0.18) 0%, transparent 65%)",
        }}
      />

      <div className="container mx-auto px-6 relative z-10 max-w-2xl text-center">
        <h2 className="text-5xl font-bold text-foreground tracking-tight leading-tight">
          {title}
        </h2>
        <p className="mt-5 text-lg text-text-secondary leading-relaxed">{subtitle}</p>

        {submitted ? (
          <div className="mt-10 inline-flex items-center gap-3 px-6 py-4 rounded-xl border border-border bg-bg-elevated">
            <span className="text-success font-semibold">You&rsquo;re on the list!</span>
            <span className="text-text-secondary text-sm">We&rsquo;ll be in touch soon.</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="flex-1 max-w-sm px-4 py-3 rounded-lg border border-border bg-bg-elevated text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <a
              href={!email ? undefined : buttonHref}
              onClick={email ? undefined : (e) => e.preventDefault()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors duration-150 whitespace-nowrap cursor-pointer"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {buttonText}
                  <ArrowRight size={16} />
                </>
              )}
            </a>
          </form>
        )}

        <p className="mt-4 text-text-muted text-xs">
          No credit card required. Free forever on the starter plan.
        </p>
      </div>
    </section>
  );
}
`

const newsletterSignup01TSX = `"use client";

import { useState } from "react";
import { Mail, Users, ArrowRight, CheckCircle } from "lucide-react";

export default function NewsletterSignup01() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <Mail size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-foreground font-bold text-lg leading-tight">
            The Grit Newsletter
          </h3>
          <p className="text-text-muted text-xs mt-0.5">Weekly Go + React tips</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-bg-secondary border border-border w-fit">
        <Users size={13} className="text-accent" />
        <span className="text-text-secondary text-xs font-medium">
          Join <span className="text-foreground font-bold">5,000+</span> developers
        </span>
      </div>

      <p className="text-text-secondary text-sm leading-relaxed mb-6">
        Get practical tutorials, framework updates, and behind-the-scenes content — straight
        to your inbox. No spam, unsubscribe anytime.
      </p>

      {submitted ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-bg-secondary">
          <CheckCircle size={18} className="text-success shrink-0" />
          <div>
            <p className="text-foreground text-sm font-semibold">You&rsquo;re subscribed!</p>
            <p className="text-text-muted text-xs mt-0.5">Check your inbox for a confirmation.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-bg-secondary text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors duration-150 disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? "Subscribing..." : (
              <>Subscribe <ArrowRight size={14} /></>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
`

const changelogItem01TSX = `import { Tag, Calendar, CheckCircle2 } from "lucide-react";

interface ChangelogItem01Props {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: string[];
}

export default function ChangelogItem01({
  version = "v1.4.0",
  date = "March 3, 2026",
  title = "Improved resource generation and dark UI polish",
  description = "This release focuses on speed improvements to the code generator and a visual refresh of the admin scaffold with better dark mode contrast.",
  changes = [
    "grit generate now runs 3x faster with parallel file writes",
    "Admin panel sidebar: collapsible groups and animated transitions",
    "New StatsBanner and TestimonialGrid registry components",
    "Fixed race condition in grit sync when multiple models changed",
    "Upgraded to Next.js 15 in all scaffolded frontend templates",
  ],
}: ChangelogItem01Props) {
  return (
    <article className="relative flex gap-8 py-10 border-b border-border last:border-0">
      {/* Timeline dot */}
      <div className="hidden md:flex flex-col items-center pt-1">
        <div className="w-3 h-3 rounded-full bg-accent shrink-0 ring-4 ring-background" />
        <div className="flex-1 w-px bg-border mt-3" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-white text-xs font-bold tracking-wide">
            <Tag size={11} />
            {version}
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-muted text-xs">
            <Calendar size={12} />
            {date}
          </span>
        </div>

        {/* Title + description */}
        <h3 className="text-foreground text-xl font-bold tracking-tight mb-3">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed mb-6">{description}</p>

        {/* Changes list */}
        <div className="rounded-xl border border-border bg-bg-elevated p-5">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-widest mb-4">
            What&rsquo;s new
          </p>
          <ul className="flex flex-col gap-3">
            {changes.map((change, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span className="text-foreground text-sm leading-snug">{change}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
`

const pricingToggle01TSX = `"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";

interface Plan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  enterprise: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For solo developers and side projects.",
    features: [
      "Up to 3 projects",
      "grit generate (all resource types)",
      "Docker Compose setup",
      "Community support",
      "1 team member",
    ],
    cta: "Start for free",
    popular: false,
    enterprise: false,
  },
  {
    name: "Pro",
    monthlyPrice: 29,
    annualPrice: 23,
    description: "For professional developers and small teams.",
    features: [
      "Unlimited projects",
      "Everything in Starter",
      "Grit UI component registry",
      "Priority email support",
      "Up to 10 team members",
      "Audit logs",
    ],
    cta: "Get started",
    popular: true,
    enterprise: false,
  },
  {
    name: "Enterprise",
    monthlyPrice: 99,
    annualPrice: 79,
    description: "For growing teams with advanced needs.",
    features: [
      "Everything in Pro",
      "SSO (SAML / OIDC)",
      "Custom deployment support",
      "SLA + dedicated Slack",
      "Unlimited team members",
      "Custom billing",
    ],
    cta: "Contact sales",
    popular: false,
    enterprise: true,
  },
];

export default function PricingToggle01() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-xl mx-auto">
            Start free, upgrade when you&rsquo;re ready. No hidden fees.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl border border-border bg-bg-elevated">
            <button
              onClick={() => setAnnual(false)}
              className={"px-5 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 " +
                (!annual
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-foreground")}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={"px-5 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 flex items-center gap-2 " +
                (annual
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-foreground")}
            >
              Annual
              <span className="text-xs px-2 py-0.5 rounded-full bg-success text-background font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={"relative flex flex-col rounded-2xl border p-7 transition-all duration-200 " +
                (plan.popular
                  ? "border-accent bg-bg-elevated ring-2 ring-accent ring-offset-2 ring-offset-background scale-105"
                  : "border-border bg-bg-elevated hover:bg-bg-hover")}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-white text-xs font-bold tracking-wide shadow-lg">
                    <Zap size={11} />
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-foreground font-bold text-lg">{plan.name}</h3>
                <p className="text-text-muted text-sm mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold text-foreground tracking-tight">
                    {plan.enterprise
                      ? "Custom"
                      : (annual ? "$" + plan.annualPrice : "$" + plan.monthlyPrice)}
                  </span>
                  {!plan.enterprise && (
                    <span className="text-text-muted text-sm mb-2">/mo</span>
                  )}
                </div>
                {annual && !plan.enterprise && plan.annualPrice > 0 && (
                  <p className="text-text-muted text-xs mt-1">
                    Billed annually (${plan.annualPrice * 12}/yr)
                  </p>
                )}
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Check size={15} className="text-success shrink-0" />
                    <span className="text-text-secondary text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.enterprise ? "/contact" : "/signup"}
                className={"w-full inline-flex items-center justify-center py-3 rounded-lg font-semibold text-sm transition-colors duration-150 " +
                  (plan.popular
                    ? "bg-accent hover:bg-accent-hover text-white"
                    : "border border-border bg-bg-secondary hover:bg-bg-hover text-foreground")}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`

const loginCard01TSX = `"use client";

import { useState } from "react";
import { Eye, EyeOff, Github, Loader2 } from "lucide-react";

export default function LoginCard01() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <span className="text-white font-black text-xl tracking-tight">G</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Don&rsquo;t have an account?{" "}
            <a href="/signup" className="text-accent hover:underline font-medium">
              Sign up
            </a>
          </p>
        </div>

        {/* Social buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-bg-elevated hover:bg-bg-hover text-foreground text-sm font-medium transition-colors duration-150">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-bg-elevated hover:bg-bg-hover text-foreground text-sm font-medium transition-colors duration-150">
            <Github size={18} />
            Continue with GitHub
          </button>
        </div>

        {/* OR divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-text-muted">or continue with email</span>
          </div>
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="px-3 py-2.5 rounded-lg border border-border bg-bg-elevated text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Password</label>
              <a href="/forgot-password" className="text-xs text-accent hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-bg-elevated text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-accent"
            />
            <label htmlFor="remember" className="text-sm text-text-secondary cursor-pointer">
              Remember me for 30 days
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
`

const signupCard01TSX = `"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";

const features = [
  "Generate full-stack apps in seconds",
  "Go API + Next.js admin panel",
  "Type-safe from database to UI",
  "Built-in auth, jobs, and storage",
  "Deploy anywhere with Docker",
];

export default function SignupCard01() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl rounded-2xl border border-border overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: Feature list */}
        <div className="bg-bg-secondary p-10 flex flex-col justify-center">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-8">
            <span className="text-white font-black text-xl">G</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
            Build your next project with Grit
          </h2>
          <p className="text-text-secondary text-sm mb-8 leading-relaxed">
            The full-stack framework for developers who value both speed and control.
          </p>
          <ul className="flex flex-col gap-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                <span className="text-text-secondary text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Form */}
        <div className="bg-bg-elevated p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Already have an account?{" "}
              <a href="/login" className="text-accent hover:underline font-medium">
                Sign in
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Full name</label>
              <input
                type="text"
                placeholder="Alex Johnson"
                required
                className="px-3 py-2.5 rounded-lg border border-border bg-bg-secondary text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                required
                className="px-3 py-2.5 rounded-lg border border-border bg-bg-secondary text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-bg-secondary text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-text-muted text-xs">Minimum 8 characters</p>
            </div>

            <div className="flex items-start gap-2 mt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-0.5 w-4 h-4 rounded border-border accent-accent"
              />
              <label htmlFor="terms" className="text-xs text-text-secondary cursor-pointer leading-relaxed">
                I agree to the{" "}
                <a href="/terms" className="text-accent hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
`

const forgotPasswordCard01TSX = `"use client";

import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordCard01() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <span className="text-white font-black text-xl tracking-tight">G</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-elevated p-8">
          {sent ? (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
                <CheckCircle size={28} className="text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  Check your email
                </h2>
                <p className="mt-2 text-text-secondary text-sm leading-relaxed">
                  We sent a password reset link to{" "}
                  <span className="text-foreground font-medium">{email}</span>.
                  It expires in 15 minutes.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full mt-2">
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="w-full py-2.5 rounded-lg border border-border bg-bg-secondary hover:bg-bg-hover text-foreground font-semibold text-sm transition-colors"
                >
                  Send again
                </button>
                <a
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors"
                >
                  <ArrowLeft size={15} />
                  Back to login
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Forgot your password?
                </h1>
                <p className="mt-2 text-text-secondary text-sm leading-relaxed">
                  No worries. Enter your email address and we&rsquo;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Email address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-bg-secondary text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Send reset link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
`

const otpInput01TSX = `"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { RefreshCw } from "lucide-react";

interface OtpInput01Props {
  email: string;
  onComplete: (code: string) => void;
}

export default function OtpInput01({ email = "you@company.com", onComplete }: OtpInput01Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = () => {
    setCountdown(60);
    setCanResend(false);
    setDigits(Array(6).fill(""));
    inputRefs.current[0]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      onComplete(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((char, i) => { next[i] = char; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
    if (pasted.length === 6) onComplete(pasted);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <span className="text-white font-black text-xl tracking-tight">G</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
          Check your email
        </h1>
        <p className="text-text-secondary text-sm mb-1">
          We sent a 6-digit code to
        </p>
        <p className="text-foreground text-sm font-semibold mb-8">{email}</p>

        {/* OTP boxes */}
        <div className="flex justify-center gap-3 mb-8">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={"w-12 h-14 text-center text-xl font-bold rounded-xl border transition-colors duration-150 bg-bg-elevated text-foreground focus:outline-none " +
                (digit
                  ? "border-accent text-accent"
                  : "border-border focus:border-accent")}
            />
          ))}
        </div>

        {/* Resend */}
        <div className="flex items-center justify-center gap-2 text-sm">
          {canResend ? (
            <button
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium"
            >
              <RefreshCw size={14} />
              Resend code
            </button>
          ) : (
            <p className="text-text-muted">
              Resend code in{" "}
              <span className="text-text-secondary font-semibold">{countdown}s</span>
            </p>
          )}
        </div>

        <p className="mt-6 text-xs text-text-muted">
          Didn&rsquo;t get the email? Check your spam folder.
        </p>
      </div>
    </div>
  );
}
`

const socialLoginButtons01TSX = `import { Github } from "lucide-react";

interface SocialLoginButtons01Props {
  googleHref?: string;
  githubHref?: string;
}

export default function SocialLoginButtons01({
  googleHref = "/auth/google",
  githubHref = "/auth/github",
}: SocialLoginButtons01Props) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Divider */}
      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-text-muted text-xs font-medium whitespace-nowrap">
          or continue with
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Buttons */}
      <a
        href={googleHref}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-bg-elevated hover:bg-bg-hover text-foreground text-sm font-medium transition-colors duration-150"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </a>

      <a
        href={githubHref}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-bg-elevated hover:bg-bg-hover text-foreground text-sm font-medium transition-colors duration-150"
      >
        <Github size={18} />
        Continue with GitHub
      </a>
    </div>
  );
}
`

const onboardingWizard01TSX = `"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, User, Building2, Zap } from "lucide-react";

interface OnboardingWizard01Props {
  onComplete?: () => void;
}

const roles = ["Developer", "Designer", "Product Manager", "Founder", "Other"];
const teamSizes = ["Just me", "2–5", "6–15", "16–50", "50+"];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect to explore Grit",
    features: ["3 projects", "Community support"],
  },
  {
    name: "Pro",
    price: "$29/mo",
    description: "For professionals",
    features: ["Unlimited projects", "Priority support", "Grit UI registry"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For larger teams",
    features: ["SSO", "SLA", "Dedicated support"],
  },
];

export default function OnboardingWizard01({ onComplete }: OnboardingWizard01Props) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Pro");

  const totalSteps = 3;

  const stepMeta = [
    { icon: User, title: "Tell us about you", subtitle: "Help us personalize your experience." },
    { icon: Building2, title: "Set up your workspace", subtitle: "A few details about where you work." },
    { icon: Zap, title: "Choose your plan", subtitle: "Start free, upgrade anytime." },
  ];

  const canAdvance = () => {
    if (step === 0) return fullName.trim() && role;
    if (step === 1) return company.trim() && teamSize;
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete?.();
    }
  };

  const Icon = stepMeta[step].icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={"transition-all duration-300 rounded-full " +
                (i === step
                  ? "w-6 h-2 bg-accent"
                  : i < step
                  ? "w-2 h-2 bg-accent opacity-60"
                  : "w-2 h-2 bg-border")}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-bg-elevated p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {stepMeta[step].title}
              </h2>
              <p className="text-text-secondary text-sm mt-0.5">{stepMeta[step].subtitle}</p>
            </div>
          </div>

          {/* Step content */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="px-3 py-2.5 rounded-lg border border-border bg-bg-secondary text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Your role</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={"px-3 py-2 rounded-lg border text-sm font-medium transition-colors duration-150 " +
                        (role === r
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-bg-secondary text-text-secondary hover:bg-bg-hover hover:text-foreground")}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Company name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="px-3 py-2.5 rounded-lg border border-border bg-bg-secondary text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Team size</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {teamSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTeamSize(size)}
                      className={"px-3 py-2 rounded-lg border text-sm font-medium transition-colors duration-150 " +
                        (teamSize === size
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-bg-secondary text-text-secondary hover:bg-bg-hover hover:text-foreground")}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.name}
                  type="button"
                  onClick={() => setSelectedPlan(plan.name)}
                  className={"relative w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-150 " +
                    (selectedPlan === plan.name
                      ? "border-accent bg-bg-secondary ring-1 ring-accent"
                      : "border-border bg-bg-secondary hover:bg-bg-hover")}
                >
                  <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors " +
                    (selectedPlan === plan.name ? "border-accent bg-accent" : "border-border")}
                  >
                    {selectedPlan === plan.name && <Check size={11} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-foreground font-semibold text-sm">{plan.name}</span>
                      {(plan as { popular?: boolean }).popular && (
                        <span className="px-2 py-0.5 rounded-full bg-accent text-white text-xs font-bold">
                          Popular
                        </span>
                      )}
                      <span className="ml-auto text-foreground font-bold text-sm">{plan.price}</span>
                    </div>
                    <p className="text-text-muted text-xs mt-0.5">{plan.description}</p>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-text-secondary text-xs">
                          <Check size={11} className="text-success" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-bg-secondary hover:bg-bg-hover text-foreground text-sm font-medium transition-colors duration-150 disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft size={15} />
              Back
            </button>

            <div className="text-text-muted text-xs">
              Step {step + 1} of {totalSteps}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors duration-150 disabled:opacity-50"
            >
              {step < totalSteps - 1 ? (
                <>Next <ArrowRight size={15} /></>
              ) : (
                <>Get started <Zap size={15} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
`

const twoFactorSetup01TSX = `// two-factor-setup-01 — 2FA setup card with QR + backup codes (GitHub / Clerk-inspired)
"use client";
import { useState } from "react";
export function TwoFactorSetup({
  qrCodeUrl = "",
  secret = "JBSWY3DPEHPK3PXP",
  backupCodes = ["a1b2-c3d4", "e5f6-g7h8", "i9j0-k1l2", "m3n4-o5p6", "q7r8-s9t0", "u1v2-w3x4"],
  onComplete,
}: {
  qrCodeUrl?: string; secret?: string; backupCodes?: string[];
  onComplete?: (code: string) => void;
}) {
  const [step, setStep] = useState<"qr" | "verify" | "backup">("qr");
  const [code, setCode] = useState("");
  return (
    <div className="bg-bg-elevated border border-border rounded-2xl p-6 w-full max-w-md flex flex-col gap-5">
      <div className="flex items-center gap-3">
        {["qr", "verify", "backup"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold " + (s === step ? "bg-accent text-white" : ["qr","verify","backup"].indexOf(step) > i ? "bg-success text-white" : "bg-bg-hover text-text-muted border border-border")}>{i + 1}</div>
            {i < 2 && <div className={"h-0.5 w-8 " + (["qr","verify","backup"].indexOf(step) > i ? "bg-success" : "bg-border")} />}
          </div>
        ))}
      </div>
      {step === "qr" && (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-foreground">Scan QR Code</h3>
          <p className="text-sm text-text-secondary">Scan this code with your authenticator app (Google Authenticator, Authy, etc.)</p>
          <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center self-center">
            {qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" /> : <span className="text-xs text-gray-400">QR Code</span>}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-text-muted">Can't scan? Enter this code manually:</p>
            <code className="text-sm font-mono text-foreground bg-background border border-border rounded-lg px-3 py-2 select-all">{secret}</code>
          </div>
          <button onClick={() => setStep("verify")} className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold transition-colors">Continue</button>
        </div>
      )}
      {step === "verify" && (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-foreground">Verify Setup</h3>
          <p className="text-sm text-text-secondary">Enter the 6-digit code from your authenticator app to confirm setup.</p>
          <input
            value={code} onChange={(e) => setCode(e.target.value.slice(0, 6))}
            placeholder="000000" maxLength={6}
            className="text-center text-2xl font-mono tracking-widest bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-accent transition-colors"
          />
          <button onClick={() => { if (code.length === 6) { onComplete?.(code); setStep("backup"); } }} disabled={code.length < 6} className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold transition-colors disabled:opacity-50">Verify</button>
        </div>
      )}
      {step === "backup" && (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-foreground">Save backup codes</h3>
          <p className="text-sm text-text-secondary">Store these codes somewhere safe. Each can be used once if you lose access to your device.</p>
          <div className="grid grid-cols-2 gap-2 bg-background border border-border rounded-xl p-4">
            {backupCodes.map((c) => <code key={c} className="text-xs font-mono text-text-secondary">{c}</code>)}
          </div>
          <button onClick={() => navigator.clipboard.writeText(backupCodes.join("\n")).catch(() => {})} className="w-full py-2 rounded-lg border border-border text-text-secondary hover:text-foreground hover:bg-bg-hover text-sm transition-colors">Copy all codes</button>
        </div>
      )}
    </div>
  );
}
`

const profileAvatar01TSX = `// profile-avatar-01 — User profile avatar with upload (Clerk / GitHub-inspired)
"use client";
import { useRef, useState } from "react";
export function ProfileAvatar({
  name = "Sarah Chen",
  email = "sarah@example.com",
  avatarUrl,
  onUpload,
}: {
  name?: string; email?: string; avatarUrl?: string;
  onUpload?: (file: File) => void;
}) {
  const [preview, setPreview] = useState(avatarUrl ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload?.(file);
  };
  return (
    <div className="flex items-center gap-4">
      <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
        <div className="w-20 h-20 rounded-full overflow-hidden bg-accent/20 flex items-center justify-center border-2 border-border">
          {preview ? (
            <img src={preview} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-accent">{initials}</span>
          )}
        </div>
        <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-text-muted">{email}</p>
        <button onClick={() => inputRef.current?.click()} className="text-xs text-accent hover:underline mt-1.5">Upload photo</button>
        {preview && <button onClick={() => { setPreview(""); }} className="text-xs text-text-muted hover:text-danger ml-2">Remove</button>}
      </div>
    </div>
  );
}
`

const accountDeletion01TSX = `// account-deletion-01 — Account deletion confirmation (GitHub / Linear-inspired)
"use client";
import { useState } from "react";
export function AccountDeletion({
  workspaceName = "Acme Corp",
  onDelete,
}: {
  workspaceName?: string; onDelete?: () => void;
}) {
  const [input, setInput] = useState("");
  const confirmed = input === workspaceName;
  return (
    <div className="border border-danger/40 bg-danger/5 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h3 className="text-sm font-semibold text-danger">Delete workspace</h3>
          <p className="text-xs text-text-secondary mt-0.5">This action cannot be undone. All projects, data, and team members will be permanently removed.</p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary">
          Type <strong className="text-foreground font-mono">{workspaceName}</strong> to confirm
        </label>
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={workspaceName}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-danger transition-colors"
        />
      </div>
      <button
        onClick={onDelete} disabled={!confirmed}
        className="w-full py-2.5 rounded-lg bg-danger hover:bg-danger/90 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Delete {workspaceName}
      </button>
    </div>
  );
}
`

const oauthButton01TSX = `// oauth-button-01 — OAuth provider sign-in buttons (Clerk-inspired)
export function OAuthButton({
  provider = "github",
  label,
  onClick,
}: {
  provider?: "github" | "google" | "discord" | "twitter";
  label?: string; onClick?: () => void;
}) {
  const config: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    github: {
      label: "Continue with GitHub",
      color: "hover:bg-[#24292e] hover:text-white hover:border-[#24292e]",
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>,
    },
    google: {
      label: "Continue with Google",
      color: "hover:bg-[#4285f4] hover:text-white hover:border-[#4285f4]",
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
    },
    discord: {
      label: "Continue with Discord",
      color: "hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2]",
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>,
    },
    twitter: {
      label: "Continue with X",
      color: "hover:bg-black hover:text-white hover:border-black",
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.245 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    },
  };
  const c = config[provider] ?? config["github"];
  return (
    <button onClick={onClick} className={"w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-border bg-bg-elevated text-text-secondary text-sm font-medium transition-all " + c.color}>
      {c.icon}
      {label ?? c.label}
    </button>
  );
}
`

const billingCard01TSX = `// billing-card-01 — Current plan card (Stripe-inspired)
"use client";
export function BillingCard({
  name = "Pro",
  price = "29",
  period = "month",
  usagePercent = 68,
  features = ["Unlimited projects", "10 team members", "Analytics", "Priority support"],
  isCurrentPlan = true,
  onManage,
  onUpgrade,
}: {
  name?: string; price?: string; period?: string; usagePercent?: number;
  features?: string[]; isCurrentPlan?: boolean;
  onManage?: () => void; onUpgrade?: () => void;
}) {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-6 flex flex-col gap-5 w-full max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground font-semibold text-lg">{name}</h3>
          {isCurrentPlan && (
            <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-medium">Current</span>
          )}
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">${price}</span>
          <span className="text-text-muted text-sm">/{period}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Usage this month</span>
          <span className="text-foreground font-medium">{usagePercent}%</span>
        </div>
        <div className="h-1.5 bg-background rounded-full overflow-hidden">
          <div
            className={"h-full rounded-full transition-all " + (usagePercent > 90 ? "bg-danger" : usagePercent > 70 ? "bg-yellow-500" : "bg-accent")}
            style={{ width: usagePercent + "%" }}
          />
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
            <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <div className="border-t border-border pt-4">
        {isCurrentPlan ? (
          <button onClick={onManage} className="w-full py-2 px-4 rounded-lg border border-border text-text-secondary hover:text-foreground hover:bg-bg-hover transition-colors text-sm font-medium">
            Manage plan
          </button>
        ) : (
          <button onClick={onUpgrade} className="w-full py-2 px-4 rounded-lg bg-accent hover:bg-accent/90 text-white transition-colors text-sm font-semibold">
            Upgrade to {name}
          </button>
        )}
      </div>
    </div>
  );
}
`

const usageMeter01TSX = `// usage-meter-01 — Resource usage bar (Vercel/Linear-inspired)
export function UsageMeter({
  label = "API Requests",
  used = 42_000,
  limit = 100_000,
  unit = "requests",
  period = "this month",
  onUpgrade,
}: {
  label?: string; used?: number; limit?: number;
  unit?: string; period?: string; onUpgrade?: () => void;
}) {
  const pct = Math.min(Math.round((used / limit) * 100), 100);
  const fmt = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? (n / 1_000).toFixed(0) + "K" : String(n);
  const color = pct > 90 ? "bg-danger" : pct > 70 ? "bg-yellow-500" : "bg-accent";
  return (
    <div className="bg-bg-elevated border border-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {pct > 80 && (
          <button onClick={onUpgrade} className="text-xs text-accent hover:underline">Upgrade</button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <div className={"h-full rounded-full transition-all duration-500 " + color} style={{ width: pct + "%" }} />
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>{fmt(used)} {unit} used</span>
          <span>{fmt(limit)} limit / {period}</span>
        </div>
      </div>
    </div>
  );
}
`

const teamMemberRow01TSX = `// team-member-row-01 — Team roster row (Linear-inspired)
export function TeamMemberRow({
  name = "Sarah Chen",
  email = "sarah@example.com",
  role = "Member",
  lastActive = "2 hours ago",
  avatarUrl,
  onRoleChange,
  onRemove,
}: {
  name?: string; email?: string; role?: string; lastActive?: string;
  avatarUrl?: string; onRoleChange?: () => void; onRemove?: () => void;
}) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const roleColors: Record<string, string> = {
    Admin: "bg-accent/10 text-accent border-accent/20",
    Member: "bg-bg-hover text-text-secondary border-border",
    Viewer: "bg-success/10 text-success border-success/20",
  };
  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-bg-hover transition-colors group">
      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-accent">{initials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-text-muted truncate">{email}</p>
      </div>
      <span className={"text-xs border px-2 py-0.5 rounded-full " + (roleColors[role] ?? roleColors["Member"])}>{role}</span>
      <span className="text-xs text-text-muted hidden sm:block">{lastActive}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onRoleChange} className="p-1.5 rounded text-text-muted hover:text-foreground hover:bg-bg-hover transition-colors" title="Change role">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button onClick={onRemove} className="p-1.5 rounded text-text-muted hover:text-danger transition-colors" title="Remove">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
`

const apiKeyRow01TSX = `// api-key-row-01 — API key management row (Vercel-inspired)
"use client";
import { useState } from "react";
export function APIKeyRow({
  name = "Production",
  prefix = "grit_live",
  suffix = "xK9m",
  created = "Mar 1, 2025",
  lastUsed = "2 hours ago",
  onCopy,
  onRevoke,
}: {
  name?: string; prefix?: string; suffix?: string;
  created?: string; lastUsed?: string;
  onCopy?: () => void; onRevoke?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const maskedKey = prefix + "_" + "•".repeat(20) + suffix;
  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-bg-elevated border border-border rounded-lg group hover:border-accent/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="text-xs text-text-muted">Created {created}</span>
        </div>
        <code className="text-xs text-text-secondary font-mono">{maskedKey}</code>
      </div>
      <span className="text-xs text-text-muted hidden sm:block">Used {lastUsed}</span>
      <div className="flex items-center gap-2">
        <button onClick={handleCopy} className={"flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors " + (copied ? "border-success/30 text-success bg-success/10" : "border-border text-text-secondary hover:text-foreground hover:bg-bg-hover")}>
          {copied ? (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Copy</>
          )}
        </button>
        <button onClick={onRevoke} className="text-xs px-2.5 py-1.5 rounded border border-danger/30 text-danger hover:bg-danger/10 transition-colors">
          Revoke
        </button>
      </div>
    </div>
  );
}
`

const kanbanCard01TSX = `// kanban-card-01 — Task card (Linear-inspired)
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-danger",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-text-muted",
};
export function KanbanCard({
  id = "GRT-42",
  title = "Implement OAuth 2.0 sign-in flow",
  priority = "high",
  labels = ["Auth", "Backend"],
  assigneeInitials = "SC",
  dueDate,
  commentCount = 3,
  onClick,
}: {
  id?: string; title?: string; priority?: "urgent" | "high" | "medium" | "low";
  labels?: string[]; assigneeInitials?: string; dueDate?: string;
  commentCount?: number; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className="bg-bg-elevated border border-border rounded-lg p-3 cursor-pointer hover:border-accent/40 hover:bg-bg-hover transition-all group flex flex-col gap-2.5">
      <div className="flex items-start gap-2">
        <svg className={"w-4 h-4 flex-shrink-0 mt-0.5 " + (PRIORITY_COLORS[priority] ?? "text-text-muted")} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span className="text-sm text-foreground leading-snug group-hover:text-white transition-colors">{title}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-text-muted font-mono">{id}</span>
        {labels.map((l) => (
          <span key={l} className="text-xs bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded">{l}</span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dueDate && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {dueDate}
            </span>
          )}
          {commentCount > 0 && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {commentCount}
            </span>
          )}
        </div>
        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-xs font-semibold text-accent">{assigneeInitials}</span>
        </div>
      </div>
    </div>
  );
}
`

const metricCard01TSX = `// metric-card-01 — KPI metric card (Vercel Analytics / Stripe Dashboard-inspired)
export function MetricCard({
  label = "Monthly Revenue",
  value = "$12,430",
  change = "+18.2%",
  trend = "up",
  period = "vs last month",
  sparkData,
}: {
  label?: string; value?: string; change?: string;
  trend?: "up" | "down" | "neutral"; period?: string;
  sparkData?: number[];
}) {
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-text-muted";
  const sparkPoints = sparkData ?? [40, 55, 35, 70, 50, 80, 65, 90];
  const max = Math.max(...sparkPoints);
  const min = Math.min(...sparkPoints);
  const pts = sparkPoints.map((v, i) => {
    const x = (i / (sparkPoints.length - 1)) * 80;
    const y = 30 - ((v - min) / (max - min || 1)) * 25;
    return x + "," + y;
  }).join(" ");
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          <p className={"text-sm font-medium mt-1 " + trendColor}>
            {trend === "up" ? "↑ " : trend === "down" ? "↓ " : ""}
            {change} <span className="text-text-muted font-normal">{period}</span>
          </p>
        </div>
        <svg viewBox="0 0 80 30" className="w-24 h-10 flex-shrink-0">
          <polyline
            points={pts}
            fill="none"
            stroke={trend === "down" ? "#ff6b6b" : "#6c5ce7"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
`

const activityItem01TSX = `// activity-item-01 — Activity feed item (GitHub-inspired)
export function ActivityItem({
  actor = "sarah",
  actorInitials = "SC",
  action = "merged pull request",
  target = "#142 — Add OAuth login",
  repo = "grit-app/web",
  timestamp = "2h ago",
  avatarUrl,
}: {
  actor?: string; actorInitials?: string; action?: string;
  target?: string; repo?: string; timestamp?: string; avatarUrl?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 group">
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5">
        {avatarUrl ? (
          <img src={avatarUrl} alt={actor} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-accent">{actorInitials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-secondary leading-relaxed">
          <span className="text-foreground font-medium">{actor}</span>{" "}
          {action}{" "}
          <span className="text-accent">{target}</span>
          {repo && <span className="text-text-muted"> in {repo}</span>}
        </p>
        <span className="text-xs text-text-muted mt-0.5 block">{timestamp}</span>
      </div>
    </div>
  );
}
`

const notificationItem01TSX = `// notification-item-01 — Notification row (Linear-inspired)
export function NotificationItem({
  title = "Sarah Chen commented on GRT-42",
  body = "Can you check the auth middleware? There might be a race condition.",
  timestamp = "5m ago",
  isUnread = true,
  icon = "comment",
  onMarkRead,
  onClick,
}: {
  title?: string; body?: string; timestamp?: string;
  isUnread?: boolean; icon?: "comment" | "mention" | "assign" | "merge";
  onMarkRead?: () => void; onClick?: () => void;
}) {
  const icons: Record<string, JSX.Element> = {
    comment: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    mention: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>,
    assign: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    merge: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  };
  return (
    <div onClick={onClick} className={"flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors group " + (isUnread ? "bg-accent/5 hover:bg-accent/10" : "hover:bg-bg-hover")}>
      <div className={"w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 " + (isUnread ? "bg-accent/20 text-accent" : "bg-bg-hover text-text-muted")}>
        {icons[icon] ?? icons["comment"]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium leading-snug">{title}</p>
        {body && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{body}</p>}
        <span className="text-xs text-text-muted mt-1 block">{timestamp}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {isUnread && (
          <button onClick={(e) => { e.stopPropagation(); onMarkRead?.(); }} className="p-1 rounded text-text-muted hover:text-foreground transition-colors" title="Mark as read">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </button>
        )}
      </div>
      {isUnread && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
    </div>
  );
}
`

const projectCard01TSX = `// project-card-01 — Project/deployment card (Vercel-inspired)
export function ProjectCard({
  name = "grit-app",
  domain = "grit-app.vercel.app",
  framework = "Next.js",
  status = "ready",
  lastDeployedAt = "3 min ago",
  branch = "main",
  commitMsg = "feat: add OAuth login flow",
  commitHash = "a3f9c12",
  onClick,
}: {
  name?: string; domain?: string; framework?: string;
  status?: "ready" | "building" | "error" | "canceled";
  lastDeployedAt?: string; branch?: string;
  commitMsg?: string; commitHash?: string; onClick?: () => void;
}) {
  const statusConfig = {
    ready: { color: "text-success", dot: "bg-success", label: "Ready" },
    building: { color: "text-yellow-400", dot: "bg-yellow-400", label: "Building" },
    error: { color: "text-danger", dot: "bg-danger", label: "Failed" },
    canceled: { color: "text-text-muted", dot: "bg-text-muted", label: "Canceled" },
  };
  const s = statusConfig[status] ?? statusConfig["ready"];
  return (
    <div onClick={onClick} className="bg-bg-elevated border border-border rounded-xl p-5 hover:border-accent/30 transition-colors cursor-pointer group flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-foreground font-semibold group-hover:text-accent transition-colors">{name}</h3>
          <a href={"https://" + domain} onClick={(e) => e.stopPropagation()} className="text-xs text-text-muted hover:text-accent transition-colors mt-0.5 block">{domain}</a>
        </div>
        <div className={"flex items-center gap-1.5 text-xs font-medium " + s.color}>
          <div className={"w-2 h-2 rounded-full " + s.dot + (status === "building" ? " animate-pulse" : "")} />
          {s.label}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="px-1.5 py-0.5 bg-background border border-border rounded text-text-secondary">{framework}</span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          {branch}
        </span>
        <span className="truncate max-w-[140px]">{commitMsg}</span>
        <span className="font-mono">{commitHash}</span>
        <span className="ml-auto">{lastDeployedAt}</span>
      </div>
    </div>
  );
}
`

const featureFlagRow01TSX = `// feature-flag-row-01 — Feature flag toggle (LaunchDarkly / Vercel Edge Config-inspired)
"use client";
import { useState } from "react";
export function FeatureFlagRow({
  name = "new-dashboard",
  displayName = "New Dashboard",
  description = "Enables the redesigned analytics dashboard for opted-in users",
  defaultEnabled = false,
  rolloutPercent = 0,
  onChange,
}: {
  name?: string; displayName?: string; description?: string;
  defaultEnabled?: boolean; rolloutPercent?: number;
  onChange?: (enabled: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const toggle = () => { const next = !enabled; setEnabled(next); onChange?.(next); };
  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-bg-hover transition-colors group border border-transparent hover:border-border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{displayName}</span>
          <code className="text-xs text-text-muted font-mono bg-background px-1.5 py-0.5 rounded">{name}</code>
          {rolloutPercent > 0 && rolloutPercent < 100 && (
            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded">{rolloutPercent}% rollout</span>
          )}
        </div>
        {description && <p className="text-xs text-text-muted mt-0.5 truncate">{description}</p>}
      </div>
      <button
        onClick={toggle}
        className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none " + (enabled ? "bg-accent" : "bg-bg-hover border border-border")}
        role="switch" aria-checked={enabled}
      >
        <span className={"inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform " + (enabled ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </div>
  );
}
`

const webhookRow01TSX = `// webhook-row-01 — Webhook endpoint row (Stripe-inspired)
export function WebhookRow({
  url = "https://api.example.com/webhooks/grit",
  events = ["payment.success", "user.created"],
  successRate = 98.5,
  lastTriggered = "12m ago",
  onTest,
  onEdit,
  onDelete,
}: {
  url?: string; events?: string[]; successRate?: number;
  lastTriggered?: string;
  onTest?: () => void; onEdit?: () => void; onDelete?: () => void;
}) {
  const rateColor = successRate >= 95 ? "text-success" : successRate >= 80 ? "text-yellow-400" : "text-danger";
  const displayUrl = url.length > 45 ? url.slice(0, 42) + "..." : url;
  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-bg-elevated border border-border rounded-lg group hover:border-accent/30 transition-colors">
      <div className="flex-1 min-w-0">
        <code className="text-sm text-foreground font-mono block truncate">{displayUrl}</code>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {events.slice(0, 3).map((e) => (
            <span key={e} className="text-xs bg-background border border-border text-text-muted px-1.5 py-0.5 rounded font-mono">{e}</span>
          ))}
          {events.length > 3 && <span className="text-xs text-text-muted">+{events.length - 3} more</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={"text-sm font-semibold " + rateColor}>{successRate}%</span>
        <span className="text-xs text-text-muted">{lastTriggered}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onTest} className="text-xs px-2.5 py-1.5 rounded border border-border text-text-secondary hover:text-foreground hover:bg-bg-hover transition-colors">Test</button>
        <button onClick={onEdit} className="p-1.5 rounded text-text-muted hover:text-foreground hover:bg-bg-hover transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button onClick={onDelete} className="p-1.5 rounded text-text-muted hover:text-danger transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
}
`

const planUpgradeBanner01TSX = `// plan-upgrade-banner-01 — Upgrade prompt banner (Intercom/Linear-inspired)
export function PlanUpgradeBanner({
  title = "You've used 90% of your API quota",
  description = "Upgrade to Pro to get unlimited API calls, priority support, and team collaboration.",
  ctaLabel = "Upgrade to Pro",
  dismissLabel = "Remind me later",
  variant = "warning",
  onUpgrade,
  onDismiss,
}: {
  title?: string; description?: string; ctaLabel?: string;
  dismissLabel?: string; variant?: "warning" | "info" | "error";
  onUpgrade?: () => void; onDismiss?: () => void;
}) {
  const colors = {
    warning: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "text-yellow-400" },
    info: { bg: "bg-accent/10", border: "border-accent/30", icon: "text-accent" },
    error: { bg: "bg-danger/10", border: "border-danger/30", icon: "text-danger" },
  };
  const c = colors[variant];
  return (
    <div className={"flex items-start gap-4 p-4 rounded-xl border " + c.bg + " " + c.border}>
      <svg className={"w-5 h-5 flex-shrink-0 mt-0.5 " + c.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-text-secondary mt-0.5">{description}</p>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={onUpgrade} className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white transition-colors">
            {ctaLabel}
          </button>
          {onDismiss && (
            <button onClick={onDismiss} className="text-sm text-text-muted hover:text-text-secondary transition-colors">
              {dismissLabel}
            </button>
          )}
        </div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 rounded text-text-muted hover:text-foreground transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}
`

const trialCountdown01TSX = `// trial-countdown-01 — Trial expiry countdown (common SaaS pattern)
export function TrialCountdown({
  daysLeft = 7,
  totalDays = 14,
  planName = "Pro",
  onUpgrade,
}: {
  daysLeft?: number; totalDays?: number; planName?: string; onUpgrade?: () => void;
}) {
  const pct = Math.round(((totalDays - daysLeft) / totalDays) * 100);
  const urgent = daysLeft <= 3;
  return (
    <div className={"flex items-center gap-4 px-4 py-3 rounded-xl border " + (urgent ? "bg-danger/10 border-danger/30" : "bg-bg-elevated border-border")}>
      <div className="flex flex-col items-center flex-shrink-0">
        <span className={"text-2xl font-bold " + (urgent ? "text-danger" : "text-foreground")}>{daysLeft}</span>
        <span className="text-xs text-text-muted">days left</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Your {planName} trial {daysLeft === 0 ? "has expired" : "ends soon"}
        </p>
        <div className="h-1.5 bg-background rounded-full overflow-hidden mt-2">
          <div
            className={"h-full rounded-full " + (urgent ? "bg-danger" : "bg-accent")}
            style={{ width: pct + "%" }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1">{totalDays - daysLeft} of {totalDays} days used</p>
      </div>
      <button onClick={onUpgrade} className={"text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0 " + (urgent ? "bg-danger hover:bg-danger/90 text-white" : "bg-accent hover:bg-accent/90 text-white")}>
        Upgrade now
      </button>
    </div>
  );
}
`

const integrationCard01TSX = `// integration-card-01 — Integration connect card (Linear / Notion-inspired)
export function IntegrationCard({
  name = "GitHub",
  description = "Sync issues, link commits, and track pull requests directly from your workspace.",
  category = "Developer Tools",
  isConnected = false,
  logoChar = "G",
  logoColor = "bg-gray-800",
  onConnect,
  onDisconnect,
  onSettings,
}: {
  name?: string; description?: string; category?: string;
  isConnected?: boolean; logoChar?: string; logoColor?: string;
  onConnect?: () => void; onDisconnect?: () => void; onSettings?: () => void;
}) {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-accent/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className={"w-10 h-10 rounded-lg " + logoColor + " flex items-center justify-center flex-shrink-0"}>
          <span className="text-white font-bold text-lg">{logoChar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground font-semibold text-sm">{name}</h3>
            {isConnected && (
              <span className="text-xs bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded-full">Connected</span>
            )}
          </div>
          <span className="text-xs text-text-muted">{category}</span>
        </div>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <button onClick={onSettings} className="flex-1 text-sm py-2 px-3 rounded-lg border border-border text-text-secondary hover:text-foreground hover:bg-bg-hover transition-colors text-center">
              Settings
            </button>
            <button onClick={onDisconnect} className="text-sm py-2 px-3 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors">
              Disconnect
            </button>
          </>
        ) : (
          <button onClick={onConnect} className="flex-1 text-sm py-2 px-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold transition-colors text-center">
            Connect {name}
          </button>
        )}
      </div>
    </div>
  );
}
`

const emptyState01TSX = `// empty-state-01 — Empty state placeholder (Linear-inspired)
export function EmptyState({
  icon = "inbox",
  title = "No issues yet",
  description = "Issues created in this project will appear here. Create your first issue to get started.",
  ctaLabel = "Create issue",
  onCta,
  secondaryLabel,
  onSecondary,
}: {
  icon?: "inbox" | "search" | "folder" | "chart" | "users";
  title?: string; description?: string;
  ctaLabel?: string; onCta?: () => void;
  secondaryLabel?: string; onSecondary?: () => void;
}) {
  const icons: Record<string, JSX.Element> = {
    inbox: <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>,
    search: <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    folder: <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    chart: <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    users: <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center text-text-muted mb-4">
        {icons[icon] ?? icons["inbox"]}
      </div>
      <h3 className="text-foreground font-semibold text-base mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-sm leading-relaxed mb-6">{description}</p>
      <div className="flex items-center gap-3">
        {onCta && (
          <button onClick={onCta} className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-semibold transition-colors">
            {ctaLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button onClick={onSecondary} className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-foreground hover:bg-bg-hover text-sm transition-colors">
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
`

const commandItem01TSX = `// command-item-01 — Command palette item (Linear Cmd+K-inspired)
export function CommandItem({
  label = "Create new issue",
  icon = "plus",
  shortcut,
  group,
  description,
  onSelect,
  isActive = false,
}: {
  label?: string; icon?: string; shortcut?: string[];
  group?: string; description?: string;
  onSelect?: () => void; isActive?: boolean;
}) {
  const iconPaths: Record<string, string> = {
    plus: "M12 4v16m8-8H4",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  };
  return (
    <button
      onClick={onSelect}
      className={"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors " + (isActive ? "bg-accent/10 text-foreground" : "hover:bg-bg-hover text-text-secondary hover:text-foreground")}
    >
      <div className={"w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 " + (isActive ? "bg-accent/20 text-accent" : "bg-bg-hover text-text-muted")}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[icon] ?? iconPaths["plus"]} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block truncate">{label}</span>
        {description && <span className="text-xs text-text-muted truncate block">{description}</span>}
      </div>
      {shortcut && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {shortcut.map((k) => (
            <kbd key={k} className="text-xs bg-background border border-border text-text-muted px-1.5 py-0.5 rounded font-mono">{k}</kbd>
          ))}
        </div>
      )}
    </button>
  );
}
`

const onboardingStep01TSX = `// onboarding-step-01 — Onboarding checklist item (Stripe / Linear-inspired)
export function OnboardingStep({
  number = 1,
  title = "Set up your workspace",
  description = "Add your team name, logo, and timezone to personalize your workspace.",
  status = "pending",
  ctaLabel = "Get started",
  onCta,
}: {
  number?: number; title?: string; description?: string;
  status?: "pending" | "in_progress" | "done";
  ctaLabel?: string; onCta?: () => void;
}) {
  const isDone = status === "done";
  const isActive = status === "in_progress";
  return (
    <div className={"flex items-start gap-4 p-4 rounded-xl border transition-all " + (isActive ? "bg-accent/5 border-accent/30" : isDone ? "opacity-60 border-border" : "bg-bg-elevated border-border hover:border-accent/20")}>
      <div className={"w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold " + (isDone ? "bg-success/20 text-success" : isActive ? "bg-accent text-white" : "bg-bg-hover text-text-muted border border-border")}>
        {isDone ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        ) : number}
      </div>
      <div className="flex-1 min-w-0">
        <p className={"text-sm font-semibold " + (isDone ? "line-through text-text-muted" : "text-foreground")}>{title}</p>
        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{description}</p>
        {!isDone && (
          <button onClick={onCta} className={"mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors " + (isActive ? "bg-accent hover:bg-accent/90 text-white" : "border border-border text-text-secondary hover:text-foreground hover:bg-bg-hover")}>
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
`

const quotaAlert01TSX = `// quota-alert-01 — Usage quota warning (Vercel / Netlify-inspired)
export function QuotaAlert({
  resource = "Build minutes",
  used = 450,
  limit = 500,
  unit = "min",
  onUpgrade,
}: {
  resource?: string; used?: number; limit?: number;
  unit?: string; onUpgrade?: () => void;
}) {
  const pct = Math.min(Math.round((used / limit) * 100), 100);
  const remaining = limit - used;
  const isOver = pct >= 100;
  const isWarning = pct >= 80;
  return (
    <div className={"flex items-start gap-3 p-4 rounded-xl border " + (isOver ? "bg-danger/10 border-danger/40" : isWarning ? "bg-yellow-500/10 border-yellow-500/30" : "bg-bg-elevated border-border")}>
      <svg className={"w-5 h-5 flex-shrink-0 mt-0.5 " + (isOver ? "text-danger" : isWarning ? "text-yellow-400" : "text-text-muted")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {isOver ? resource + " limit reached" : resource + " running low"}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">
          {isOver ? "You have used all " + limit + " " + unit + " for this billing period." : "Only " + remaining + " " + unit + " remaining of your " + limit + " " + unit + " limit."}
        </p>
        <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
          <div className={"h-full rounded-full " + (isOver ? "bg-danger" : "bg-yellow-500")} style={{ width: pct + "%" }} />
        </div>
      </div>
      <button onClick={onUpgrade} className={"text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors " + (isOver ? "bg-danger hover:bg-danger/90 text-white" : "bg-accent hover:bg-accent/90 text-white")}>
        Upgrade
      </button>
    </div>
  );
}
`

const auditLogRow01TSX = `// audit-log-row-01 — Audit trail entry (Stripe-inspired)
export function AuditLogRow({
  actor = "sarah@example.com",
  actorInitials = "SC",
  action = "Updated",
  resource = "API key",
  resourceId = "key_prod_xK9m",
  ip = "203.0.113.42",
  location = "San Francisco, US",
  timestamp = "Mar 1, 2025 at 14:32:11 UTC",
}: {
  actor?: string; actorInitials?: string; action?: string;
  resource?: string; resourceId?: string; ip?: string;
  location?: string; timestamp?: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 hover:bg-bg-hover transition-colors rounded-lg">
      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-accent">{actorInitials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-medium">{actor}</span>
          <span className="text-text-secondary"> {action} </span>
          <span className="font-medium">{resource}</span>
          {resourceId && <code className="text-xs text-text-muted font-mono ml-1 bg-background px-1 rounded">{resourceId}</code>}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
          <span>{timestamp}</span>
          <span>·</span>
          <span className="font-mono">{ip}</span>
          <span>·</span>
          <span>{location}</span>
        </div>
      </div>
    </div>
  );
}
`

const settingsSection01TSX = `// settings-section-01 — Settings card section (Vercel / Linear-inspired)
export function SettingsSection({
  title = "Workspace Name",
  description = "This is the name that will be displayed across your workspace and in emails.",
  children,
  footer,
  danger = false,
}: {
  title?: string; description?: string;
  children?: React.ReactNode; footer?: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className={"rounded-xl border overflow-hidden " + (danger ? "border-danger/40" : "border-border")}>
      <div className="p-6">
        <h3 className={"text-base font-semibold mb-1 " + (danger ? "text-danger" : "text-foreground")}>{title}</h3>
        <p className="text-sm text-text-secondary mb-4">{description}</p>
        {children}
      </div>
      {footer && (
        <div className={"px-6 py-4 border-t flex items-center justify-between " + (danger ? "border-danger/20 bg-danger/5" : "border-border bg-background")}>
          {footer}
        </div>
      )}
    </div>
  );
}
`

const invitationLink01TSX = `// invitation-link-01 — Workspace invite link (Notion-inspired)
"use client";
import { useState } from "react";
export function InvitationLink({
  inviteUrl = "https://app.example.com/invite/abc123xyz",
  expiresIn = "7 days",
  onReset,
  onDisable,
}: {
  inviteUrl?: string; expiresIn?: string;
  onReset?: () => void; onDisable?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 min-w-0">
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          <code className="text-sm text-text-secondary font-mono truncate">{inviteUrl}</code>
        </div>
        <button onClick={copy} className={"flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors flex-shrink-0 " + (copied ? "border-success/30 text-success bg-success/10" : "border-border text-text-secondary hover:text-foreground hover:bg-bg-hover")}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Expires in {expiresIn}</span>
        <div className="flex items-center gap-3">
          <button onClick={onReset} className="hover:text-foreground transition-colors">Reset link</button>
          <button onClick={onDisable} className="hover:text-danger transition-colors">Disable</button>
        </div>
      </div>
    </div>
  );
}
`

const fileUploadZone01TSX = `// file-upload-zone-01 — Drag and drop upload (Linear attachments-inspired)
"use client";
import { useState, useRef } from "react";
export function FileUploadZone({
  accept = ".png,.jpg,.pdf,.zip",
  maxSizeMB = 10,
  onFiles,
}: {
  accept?: string; maxSizeMB?: number;
  onFiles?: (files: File[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handle = (files: FileList | null) => {
    if (!files) return;
    onFiles?.(Array.from(files));
  };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handle(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={"flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all " + (isDragging ? "border-accent bg-accent/5 scale-[1.01]" : "border-border hover:border-accent/50 hover:bg-bg-hover")}
    >
      <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border flex items-center justify-center">
        <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Drop files here or <span className="text-accent">browse</span></p>
        <p className="text-xs text-text-muted mt-1">{accept} · Max {maxSizeMB}MB</p>
      </div>
      <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => handle(e.target.files)} />
    </div>
  );
}
`

const progressTracker01TSX = `// progress-tracker-01 — Multi-step progress tracker (Stripe-inspired)
export function ProgressTracker({
  steps = [
    { label: "Account", status: "done" },
    { label: "Team", status: "done" },
    { label: "Integrate", status: "current" },
    { label: "Go live", status: "upcoming" },
  ],
}: {
  steps?: Array<{ label: string; status: "done" | "current" | "upcoming" }>;
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all " + (step.status === "done" ? "bg-success border-success text-white" : step.status === "current" ? "bg-accent border-accent text-white" : "bg-background border-border text-text-muted")}>
              {step.status === "done" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              ) : i + 1}
            </div>
            <span className={"text-xs font-medium " + (step.status === "current" ? "text-foreground" : step.status === "done" ? "text-success" : "text-text-muted")}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={"h-0.5 w-16 mb-4 mx-1 " + (steps[i + 1]?.status !== "upcoming" ? "bg-success" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}
`

const searchFilterBar01TSX = `// search-filter-bar-01 — Search + filter bar (GitHub Issues-inspired)
"use client";
import { useState } from "react";
export function SearchFilterBar({
  placeholder = "Search issues...",
  filters = [
    { key: "status", label: "Open", active: true },
    { key: "assignee", label: "Assigned to me", active: false },
    { key: "label", label: "Bug", active: false },
  ],
  onSearch,
  onFilterChange,
}: {
  placeholder?: string;
  filters?: Array<{ key: string; label: string; active: boolean }>;
  onSearch?: (q: string) => void;
  onFilterChange?: (key: string) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 bg-bg-elevated border border-border rounded-lg px-3 py-2">
        <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          type="text" value={query} placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); }}
          className="flex-1 bg-transparent text-sm text-foreground placeholder-text-muted outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(""); onSearch?.(""); }} className="text-text-muted hover:text-foreground transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange?.(f.key)}
            className={"text-xs px-2.5 py-1 rounded-full border transition-colors font-medium " + (f.active ? "bg-accent/10 border-accent/30 text-accent" : "border-border text-text-muted hover:text-foreground hover:border-accent/30")}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
`

const dataTableRow01TSX = `// data-table-row-01 — Data table row with actions (GitHub / Linear-inspired)
export function DataTableRow({
  cells = ["sarah@example.com", "Admin", "Mar 1, 2025", "Active"],
  statusIndex = 3,
  statusMap = { Active: "text-success", Pending: "text-yellow-400", Inactive: "text-text-muted", Suspended: "text-danger" },
  onEdit,
  onDelete,
  selected = false,
  onSelect,
}: {
  cells?: string[]; statusIndex?: number;
  statusMap?: Record<string, string>;
  onEdit?: () => void; onDelete?: () => void;
  selected?: boolean; onSelect?: () => void;
}) {
  return (
    <tr className={"border-b border-border transition-colors hover:bg-bg-hover " + (selected ? "bg-accent/5" : "")}>
      <td className="py-3 pl-4 pr-2">
        <input type="checkbox" checked={selected} onChange={onSelect} className="rounded border-border accent-accent" />
      </td>
      {cells.map((cell, i) => (
        <td key={i} className="py-3 px-3">
          {i === statusIndex ? (
            <span className={"text-sm font-medium " + (statusMap[cell] ?? "text-text-secondary")}>{cell}</span>
          ) : (
            <span className="text-sm text-text-secondary">{cell}</span>
          )}
        </td>
      ))}
      <td className="py-3 pr-4 pl-2">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100">
          <button onClick={onEdit} className="p-1.5 rounded text-text-muted hover:text-foreground hover:bg-bg-hover transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={onDelete} className="p-1.5 rounded text-text-muted hover:text-danger transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
`

const sessionRow01TSX = `// session-row-01 — Active session / authorized device row (GitHub Security-inspired)
export function SessionRow({
  deviceName = "MacBook Pro",
  deviceType = "desktop",
  browser = "Chrome 122",
  location = "San Francisco, CA",
  ip = "203.0.113.42",
  lastActive = "Active now",
  isCurrent = true,
  onRevoke,
}: {
  deviceName?: string; deviceType?: "desktop" | "mobile" | "tablet";
  browser?: string; location?: string; ip?: string;
  lastActive?: string; isCurrent?: boolean; onRevoke?: () => void;
}) {
  const icons: Record<string, JSX.Element> = {
    desktop: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    mobile: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    tablet: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  };
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className="w-10 h-10 rounded-xl bg-bg-hover flex items-center justify-center text-text-muted flex-shrink-0">
        {icons[deviceType] ?? icons["desktop"]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{deviceName}</span>
          {isCurrent && <span className="text-xs bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded-full">Current session</span>}
        </div>
        <p className="text-xs text-text-muted mt-0.5">{browser} · {location} · {ip}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={"text-xs font-medium " + (lastActive === "Active now" ? "text-success" : "text-text-muted")}>{lastActive}</span>
        {!isCurrent && (
          <button onClick={onRevoke} className="text-xs text-danger hover:underline transition-colors">Revoke</button>
        )}
      </div>
    </div>
  );
}
`

const billingHistoryRow01TSX = `// billing-history-row-01 — Invoice/payment history row (Stripe-inspired)
export function BillingHistoryRow({
  invoiceId = "INV-2025-003",
  date = "Mar 1, 2025",
  amount = "$29.00",
  status = "paid",
  plan = "Pro Monthly",
  onDownload,
}: {
  invoiceId?: string; date?: string; amount?: string;
  status?: "paid" | "pending" | "failed" | "refunded";
  plan?: string; onDownload?: () => void;
}) {
  const statusConfig = {
    paid: "text-success bg-success/10 border-success/20",
    pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    failed: "text-danger bg-danger/10 border-danger/20",
    refunded: "text-text-muted bg-bg-hover border-border",
  };
  return (
    <div className="flex items-center gap-4 py-3 px-4 hover:bg-bg-hover transition-colors rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{plan}</span>
          <code className="text-xs text-text-muted font-mono">{invoiceId}</code>
        </div>
        <span className="text-xs text-text-muted">{date}</span>
      </div>
      <span className={"text-xs border px-2 py-0.5 rounded-full capitalize font-medium " + (statusConfig[status] ?? statusConfig["paid"])}>{status}</span>
      <span className="text-sm font-semibold text-foreground">{amount}</span>
      <button onClick={onDownload} className="p-1.5 rounded text-text-muted hover:text-foreground hover:bg-bg-hover transition-colors opacity-0 group-hover:opacity-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      </button>
    </div>
  );
}
`

const workspaceSwitcher01TSX = `// workspace-switcher-01 — Workspace/org switcher dropdown trigger (Linear / Notion-inspired)
"use client";
import { useState } from "react";
export function WorkspaceSwitcher({
  workspaces = [
    { id: "1", name: "Acme Corp", plan: "Pro", initials: "AC" },
    { id: "2", name: "Side Project", plan: "Free", initials: "SP" },
  ],
  currentId = "1",
  onSwitch,
  onCreate,
}: {
  workspaces?: Array<{ id: string; name: string; plan: string; initials: string }>;
  currentId?: string; onSwitch?: (id: string) => void; onCreate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const current = workspaces.find((w) => w.id === currentId) ?? workspaces[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-bg-hover transition-colors w-full"
      >
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">{current?.initials}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{current?.name}</p>
          <p className="text-xs text-text-muted">{current?.plan}</p>
        </div>
        <svg className={"w-4 h-4 text-text-muted transition-transform " + (open ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-elevated border border-border rounded-xl shadow-xl overflow-hidden z-50">
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => { onSwitch?.(w.id); setOpen(false); }}
              className={"flex items-center gap-2.5 px-3 py-2.5 w-full hover:bg-bg-hover transition-colors " + (w.id === currentId ? "bg-accent/5" : "")}
            >
              <div className="w-7 h-7 rounded-md bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-accent">{w.initials}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{w.name}</p>
                <p className="text-xs text-text-muted">{w.plan}</p>
              </div>
              {w.id === currentId && <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            </button>
          ))}
          <div className="border-t border-border p-2">
            <button onClick={onCreate} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm text-text-secondary hover:text-foreground hover:bg-bg-hover transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`

const permissionRow01TSX = `// permission-row-01 — Permission scope toggle row (Linear workspace-inspired)
export function PermissionRow({
  scope = "Members",
  description = "Can view and comment on all issues and projects",
  roles = ["Viewer", "Member", "Admin"],
  currentRole = "Member",
  onChange,
}: {
  scope?: string; description?: string;
  roles?: string[]; currentRole?: string;
  onChange?: (role: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-bg-hover transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{scope}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => onChange?.(r)}
            className={"text-xs px-2.5 py-1 rounded-md font-medium transition-colors " + (r === currentRole ? "bg-accent text-white" : "text-text-muted hover:text-foreground")}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
`

const ssoButton01TSX = `// sso-button-01 — SSO provider sign-in button (Okta / Google Workspace-inspired)
export function SSOButton({
  provider = "Google Workspace",
  orgName = "Acme Corp",
  orgDomain = "acme.com",
  logoChar = "G",
  logoColor = "bg-red-500",
  onClick,
}: {
  provider?: string; orgName?: string; orgDomain?: string;
  logoChar?: string; logoColor?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-bg-elevated border border-border rounded-xl hover:border-accent/40 hover:bg-bg-hover transition-all group"
    >
      <div className={"w-10 h-10 rounded-lg " + logoColor + " flex items-center justify-center flex-shrink-0"}>
        <span className="text-white font-bold">{logoChar}</span>
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-foreground">Sign in with {provider}</p>
        <p className="text-xs text-text-muted">{orgName} · {orgDomain}</p>
      </div>
      <svg className="w-4 h-4 text-text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </button>
  );
}
`

const productCardList01TSX = `// product-card-list-01 — Product list row (Shopify admin-inspired)
export function ProductCardList({
  name = "Wireless Noise-Cancelling Headphones",
  sku = "WNC-BLK-001",
  price = "$129.99",
  originalPrice,
  category = "Electronics",
  stock = 42,
  imageUrl,
  rating = 4.5,
  reviewCount = 128,
  onClick,
}: {
  name?: string; sku?: string; price?: string; originalPrice?: string;
  category?: string; stock?: number; imageUrl?: string;
  rating?: number; reviewCount?: number; onClick?: () => void;
}) {
  const stars = Math.round(rating);
  const stockStatus = stock === 0 ? "out" : stock <= 5 ? "low" : "in";
  const stockConfig = { in: "text-success", low: "text-yellow-400", out: "text-danger" };
  const stockLabel = { in: stock + " in stock", low: "Only " + stock + " left", out: "Out of stock" };
  return (
    <div onClick={onClick} className="flex items-center gap-4 py-4 px-4 border-b border-border hover:bg-bg-hover transition-colors cursor-pointer group">
      <div className="w-16 h-16 rounded-xl bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-7 h-7 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <code className="text-xs text-text-muted font-mono">{sku}</code>
          <span className="text-text-muted">·</span>
          <span className="text-xs text-text-muted">{category}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={"w-3 h-3 " + (i < stars ? "text-yellow-400" : "text-bg-hover")} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          ))}
          <span className="text-xs text-text-muted ml-1">({reviewCount})</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div>
          <span className="text-sm font-bold text-foreground">{price}</span>
          {originalPrice && <span className="text-xs text-text-muted line-through ml-1">{originalPrice}</span>}
        </div>
        <span className={"text-xs font-medium " + stockConfig[stockStatus]}>{stockLabel[stockStatus]}</span>
      </div>
    </div>
  );
}
`

const productGallery01TSX = `// product-gallery-01 — Product image gallery with thumbnails (Shopify-inspired)
"use client";
import { useState } from "react";
export function ProductGallery({
  images = [
    { src: "", alt: "Front view" },
    { src: "", alt: "Side view" },
    { src: "", alt: "Back view" },
    { src: "", alt: "Detail view" },
  ],
  productName = "Wireless Headphones",
}: {
  images?: Array<{ src: string; alt: string }>;
  productName?: string;
}) {
  const [selected, setSelected] = useState(0);
  return (
    <div className="flex gap-3">
      <div className="flex flex-col gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={"w-16 h-16 rounded-lg border-2 overflow-hidden transition-all " + (i === selected ? "border-accent" : "border-border hover:border-accent/40")}
          >
            {img.src ? (
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                <span className="text-xs text-text-muted">{i + 1}</span>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 aspect-square rounded-2xl border border-border bg-bg-elevated overflow-hidden flex items-center justify-center">
        {images[selected]?.src ? (
          <img src={images[selected].src} alt={images[selected].alt} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-sm">{productName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
`

const productVariant01TSX = `// product-variant-01 — Color + size variant selectors (Shopify PDP-inspired)
"use client";
import { useState } from "react";
export function ProductVariantSelector({
  colors = [
    { label: "Midnight Black", value: "black", hex: "#1a1a2e" },
    { label: "Pearl White", value: "white", hex: "#f0f0f0" },
    { label: "Ocean Blue", value: "blue", hex: "#2563eb" },
  ],
  sizes = ["XS", "S", "M", "L", "XL", "2XL"],
  unavailableSizes = ["XS"],
  onColorChange,
  onSizeChange,
}: {
  colors?: Array<{ label: string; value: string; hex: string }>;
  sizes?: string[]; unavailableSizes?: string[];
  onColorChange?: (v: string) => void; onSizeChange?: (v: string) => void;
}) {
  const [color, setColor] = useState(colors[0]?.value ?? "");
  const [size, setSize] = useState("");
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-medium text-foreground">Color</span>
          <span className="text-sm text-text-muted">{colors.find((c) => c.value === color)?.label}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => { setColor(c.value); onColorChange?.(c.value); }}
              title={c.label}
              className={"w-8 h-8 rounded-full border-2 transition-all " + (color === c.value ? "border-accent scale-110" : "border-border hover:border-accent/40")}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-medium text-foreground">Size</span>
          <button className="text-xs text-accent hover:underline">Size guide</button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sizes.map((s) => {
            const unavailable = unavailableSizes.includes(s);
            return (
              <button
                key={s}
                disabled={unavailable}
                onClick={() => { setSize(s); onSizeChange?.(s); }}
                className={"w-12 h-10 rounded-lg border text-sm font-medium transition-all " + (s === size ? "border-accent bg-accent/10 text-accent" : unavailable ? "border-border text-text-muted opacity-40 cursor-not-allowed line-through" : "border-border text-text-secondary hover:border-accent/50 hover:text-foreground")}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
`

const cartItem01TSX = `// cart-item-01 — Cart line item (Shopify cart drawer-inspired)
"use client";
import { useState } from "react";
export function CartItem({
  name = "Wireless Headphones",
  variant = "Midnight Black / M",
  price = 129.99,
  quantity = 1,
  imageUrl,
  onQuantityChange,
  onRemove,
}: {
  name?: string; variant?: string; price?: number;
  quantity?: number; imageUrl?: string;
  onQuantityChange?: (q: number) => void; onRemove?: () => void;
}) {
  const [qty, setQty] = useState(quantity);
  const changeQty = (delta: number) => {
    const next = Math.max(1, qty + delta);
    setQty(next);
    onQuantityChange?.(next);
  };
  return (
    <div className="flex items-start gap-3 py-4 border-b border-border">
      <div className="w-20 h-20 rounded-xl bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-text-muted mt-0.5">{variant}</p>
          </div>
          <p className="text-sm font-bold text-foreground flex-shrink-0">${(price * qty).toFixed(2)}</p>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            <button onClick={() => changeQty(-1)} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-foreground hover:bg-bg-hover transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="w-8 text-center text-sm text-foreground">{qty}</span>
            <button onClick={() => changeQty(1)} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-foreground hover:bg-bg-hover transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <button onClick={onRemove} className="text-xs text-text-muted hover:text-danger transition-colors">Remove</button>
        </div>
      </div>
    </div>
  );
}
`

const cartSummary01TSX = `// cart-summary-01 — Order summary card (Shopify checkout-inspired)
export function CartSummary({
  subtotal = 259.98,
  discount,
  discountCode,
  shipping,
  tax = 23.40,
  onCheckout,
  onApplyCoupon,
}: {
  subtotal?: number; discount?: number; discountCode?: string;
  shipping?: number; tax?: number;
  onCheckout?: () => void; onApplyCoupon?: (code: string) => void;
}) {
  const total = subtotal - (discount ?? 0) + (shipping ?? 0) + tax;
  return (
    <div className="bg-bg-elevated border border-border rounded-2xl p-6 flex flex-col gap-4">
      <h3 className="text-base font-semibold text-foreground">Order Summary</h3>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal</span><span className="text-foreground">${subtotal.toFixed(2)}</span>
        </div>
        {discount != null && (
          <div className="flex justify-between text-success">
            <span>Discount {discountCode && <code className="text-xs bg-success/10 px-1 rounded">{discountCode}</code>}</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-text-secondary">
          <span>Shipping</span>
          <span className="text-foreground">{shipping == null ? "Calculated at checkout" : shipping === 0 ? "Free" : "$" + shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Tax</span><span className="text-foreground">${tax.toFixed(2)}</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground text-base">${total.toFixed(2)}</span>
        </div>
      </div>
      {onApplyCoupon && (
        <div className="flex gap-2">
          <input
            placeholder="Discount code"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-text-muted outline-none focus:border-accent transition-colors"
          />
          <button className="px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:text-foreground hover:bg-bg-hover transition-colors">Apply</button>
        </div>
      )}
      <button onClick={onCheckout} className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition-colors">
        Proceed to Checkout
      </button>
      <div className="flex items-center justify-center gap-3 text-xs text-text-muted">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        Secure checkout · SSL encrypted
      </div>
    </div>
  );
}
`

const orderStatus01TSX = `// order-status-01 — Order status tracker (Shopify/Amazon order page-inspired)
export function OrderStatus({
  orderId = "#1042",
  steps = [
    { label: "Order placed", date: "Mar 1", status: "done" },
    { label: "Processing", date: "Mar 1", status: "done" },
    { label: "Shipped", date: "Mar 2", status: "current" },
    { label: "Out for delivery", date: "Mar 4", status: "upcoming" },
    { label: "Delivered", date: "Est. Mar 4", status: "upcoming" },
  ],
}: {
  orderId?: string;
  steps?: Array<{ label: string; date: string; status: "done" | "current" | "upcoming" }>;
}) {
  return (
    <div className="bg-bg-elevated border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-foreground">Order {orderId}</h3>
        <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-full font-medium">In Transit</span>
      </div>
      <div className="flex items-start gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              <div className={"flex-1 h-0.5 " + (i === 0 ? "opacity-0" : step.status !== "upcoming" ? "bg-accent" : "bg-border")} />
              <div className={"w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 " + (step.status === "done" ? "border-accent bg-accent" : step.status === "current" ? "border-accent bg-accent/20" : "border-border bg-background")}>
                {step.status === "done" ? (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : step.status === "current" ? (
                  <div className="w-2 h-2 rounded-full bg-accent" />
                ) : null}
              </div>
              <div className={"flex-1 h-0.5 " + (i === steps.length - 1 ? "opacity-0" : step.status === "done" ? "bg-accent" : "bg-border")} />
            </div>
            <p className={"text-xs font-medium mt-2 text-center " + (step.status === "upcoming" ? "text-text-muted" : "text-foreground")}>{step.label}</p>
            <p className="text-xs text-text-muted mt-0.5">{step.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
`

const orderCard01TSX = `// order-card-01 — Order history card (Shopify My Orders-inspired)
export function OrderCard({
  orderId = "#1042",
  date = "Mar 1, 2025",
  status = "shipped",
  items = [
    { name: "Wireless Headphones", qty: 1, price: "$129.99" },
    { name: "USB-C Cable", qty: 2, price: "$19.99" },
  ],
  total = "$169.97",
  onTrack,
  onReturn,
}: {
  orderId?: string; date?: string;
  status?: "processing" | "shipped" | "delivered" | "canceled" | "returned";
  items?: Array<{ name: string; qty: number; price: string }>;
  total?: string; onTrack?: () => void; onReturn?: () => void;
}) {
  const statusConfig = {
    processing: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    shipped: "text-accent bg-accent/10 border-accent/20",
    delivered: "text-success bg-success/10 border-success/20",
    canceled: "text-danger bg-danger/10 border-danger/20",
    returned: "text-text-muted bg-bg-hover border-border",
  };
  return (
    <div className="bg-bg-elevated border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <span className="text-sm font-semibold text-foreground">Order {orderId}</span>
          <span className="text-xs text-text-muted ml-2">{date}</span>
        </div>
        <span className={"text-xs border px-2.5 py-1 rounded-full font-medium capitalize " + (statusConfig[status] ?? statusConfig["processing"])}>{status}</span>
      </div>
      <div className="px-5 py-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{item.name} <span className="text-text-muted">×{item.qty}</span></span>
            <span className="text-foreground font-medium">{item.price}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-5 py-4 border-t border-border">
        <span className="text-sm font-semibold text-foreground">Total: {total}</span>
        <div className="flex items-center gap-2">
          {onReturn && status === "delivered" && (
            <button onClick={onReturn} className="text-xs text-text-secondary hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors">Return</button>
          )}
          {onTrack && (status === "processing" || status === "shipped") && (
            <button onClick={onTrack} className="text-xs bg-accent hover:bg-accent/90 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">Track order</button>
          )}
        </div>
      </div>
    </div>
  );
}
`

const reviewCard01TSX = `// review-card-01 — Product review card (Amazon/Shopify-inspired)
export function ReviewCard({
  author = "Alex M.",
  rating = 5,
  title = "Best headphones I've ever owned",
  body = "The sound quality is incredible, battery life exceeds expectations, and the noise cancellation is top-notch. Build quality feels premium.",
  date = "Feb 28, 2025",
  verified = true,
  helpful = 42,
  avatarInitials = "AM",
}: {
  author?: string; rating?: number; title?: string; body?: string;
  date?: string; verified?: boolean; helpful?: number; avatarInitials?: string;
}) {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-accent">{avatarInitials}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{author}</span>
            {verified && (
              <span className="text-xs bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Verified purchase
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={"w-3.5 h-3.5 " + (i < rating ? "text-yellow-400" : "text-bg-hover")} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            ))}
          </div>
        </div>
        <span className="text-xs text-text-muted">{date}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
      <div className="flex items-center gap-2 text-xs text-text-muted pt-1 border-t border-border">
        <span>Helpful?</span>
        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
          Yes ({helpful})
        </button>
      </div>
    </div>
  );
}
`

const discountBadge01TSX = `// discount-badge-01 — Sale / discount badge variants (common ecommerce pattern)
export function DiscountBadge({
  type = "percent",
  value = "20",
  label,
}: {
  type?: "percent" | "amount" | "text";
  value?: string; label?: string;
}) {
  const display = type === "percent" ? "-" + value + "%" : type === "amount" ? "-$" + value : (label ?? value);
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-danger text-white text-xs font-bold tracking-wide uppercase">
      {display}
    </span>
  );
}

// Compound usage example export
export function SaleBadge({ text = "Flash Sale" }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-danger/10 border border-danger/30 text-danger text-xs font-semibold">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      {text}
    </span>
  );
}
`

const stockIndicator01TSX = `// stock-indicator-01 — Stock level indicator (Shopify PDP-inspired)
export function StockIndicator({
  stock = 8,
  lowThreshold = 10,
  showCount = true,
}: {
  stock?: number; lowThreshold?: number; showCount?: boolean;
}) {
  const isOut = stock === 0;
  const isLow = stock > 0 && stock <= lowThreshold;
  return (
    <div className="flex items-center gap-2">
      <div className={"w-2 h-2 rounded-full " + (isOut ? "bg-danger" : isLow ? "bg-yellow-400" : "bg-success")} />
      <span className={"text-sm font-medium " + (isOut ? "text-danger" : isLow ? "text-yellow-400" : "text-success")}>
        {isOut ? "Out of stock" : isLow ? (showCount ? "Only " + stock + " left" : "Low stock") : "In stock"}
      </span>
      {!isOut && !isLow && showCount && (
        <span className="text-xs text-text-muted">({stock} available)</span>
      )}
    </div>
  );
}
`

const flashSaleTimer01TSX = `// flash-sale-timer-01 — Flash sale countdown timer (ecommerce urgency pattern)
"use client";
import { useEffect, useState } from "react";
export function FlashSaleTimer({
  endsAt = new Date(Date.now() + 4 * 60 * 60 * 1000),
  label = "Flash Sale ends in",
}: {
  endsAt?: Date; label?: string;
}) {
  const calc = () => {
    const diff = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
    return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 };
  };
  const [time, setTime] = useState(calc());
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/30 rounded-xl">
      <svg className="w-5 h-5 text-danger flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1 ml-auto">
        {[{ v: time.h, l: "h" }, { v: time.m, l: "m" }, { v: time.s, l: "s" }].map(({ v, l }, i) => (
          <div key={l} className="flex items-center gap-1">
            <div className="bg-danger text-white font-bold font-mono text-sm px-2.5 py-1 rounded-lg min-w-[2.5rem] text-center">
              {pad(v)}
            </div>
            <span className="text-text-muted text-xs">{l}</span>
            {i < 2 && <span className="text-danger font-bold">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
`

const bundleOffer01TSX = `// bundle-offer-01 — Frequently bought together bundle (Amazon-inspired)
export function BundleOffer({
  items = [
    { name: "Wireless Headphones", price: 129.99, imageUrl: "" },
    { name: "USB-C Cable 2-Pack", price: 19.99, imageUrl: "" },
    { name: "Carrying Case", price: 29.99, imageUrl: "" },
  ],
  discountPercent = 15,
  onAddBundle,
}: {
  items?: Array<{ name: string; price: number; imageUrl?: string }>;
  discountPercent?: number; onAddBundle?: () => void;
}) {
  const total = items.reduce((s, i) => s + i.price, 0);
  const discounted = total * (1 - discountPercent / 100);
  return (
    <div className="bg-bg-elevated border border-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Frequently Bought Together</h4>
        <span className="text-xs bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full">{discountPercent}% off bundle</span>
      </div>
      <div className="flex items-center gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              )}
            </div>
            {i < items.length - 1 && <span className="text-text-muted text-lg">+</span>}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-xs text-text-secondary">
            <span className="truncate">{item.name}</span>
            <span className="font-medium ml-2">${item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-foreground">${discounted.toFixed(2)}</span>
          <span className="text-xs text-text-muted line-through ml-1.5">${total.toFixed(2)}</span>
        </div>
        <button onClick={onAddBundle} className="text-sm font-semibold px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white transition-colors">
          Add all 3 to cart
        </button>
      </div>
    </div>
  );
}
`

const categoryFilter01TSX = `// category-filter-01 — Filter sidebar (Shopify collection page-inspired)
"use client";
import { useState } from "react";
export function CategoryFilter({
  categories = ["Electronics", "Audio", "Accessories", "Cables"],
  priceRange = { min: 0, max: 500 },
  ratings = [5, 4, 3],
  onFilter,
}: {
  categories?: string[]; priceRange?: { min: number; max: number };
  ratings?: number[]; onFilter?: (filters: Record<string, unknown>) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(priceRange.max);
  const [minRating, setMinRating] = useState(0);
  const toggle = (cat: string) => {
    const next = selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat];
    setSelected(next);
    onFilter?.({ categories: next, maxPrice, minRating });
  };
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Categories</h4>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={"w-4 h-4 rounded border flex items-center justify-center transition-colors " + (selected.includes(cat) ? "bg-accent border-accent" : "border-border group-hover:border-accent/50")}>
                {selected.includes(cat) && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <input type="checkbox" className="hidden" checked={selected.includes(cat)} onChange={() => toggle(cat)} />
              <span className="text-sm text-text-secondary group-hover:text-foreground transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Max Price</h4>
        <input
          type="range" min={priceRange.min} max={priceRange.max} value={maxPrice}
          onChange={(e) => { const v = Number(e.target.value); setMaxPrice(v); onFilter?.({ categories: selected, maxPrice: v, minRating }); }}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>${priceRange.min}</span><span className="text-foreground font-medium">${maxPrice}</span><span>${priceRange.max}</span>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Min Rating</h4>
        <div className="flex flex-col gap-2">
          {ratings.map((r) => (
            <button key={r} onClick={() => { setMinRating(r); onFilter?.({ categories: selected, maxPrice, minRating: r }); }} className={"flex items-center gap-1.5 text-sm transition-colors " + (minRating === r ? "text-foreground" : "text-text-muted hover:text-foreground")}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={"w-3.5 h-3.5 " + (i < r ? "text-yellow-400" : "text-bg-hover")} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              ))}
              <span>& up</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
`

const checkoutStepIndicator01TSX = `// checkout-step-indicator-01 — Checkout progress bar (Shopify checkout-inspired)
export function CheckoutStepIndicator({
  steps = ["Cart", "Information", "Shipping", "Payment"],
  currentStep = 1,
}: {
  steps?: string[]; currentStep?: number;
}) {
  return (
    <nav className="flex items-center gap-1 flex-wrap">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div className={"flex items-center gap-1.5 text-sm " + (i < currentStep ? "text-text-muted" : i === currentStep ? "font-semibold text-foreground" : "text-text-muted opacity-50")}>
            {i < currentStep ? (
              <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <span className={"w-5 h-5 rounded-full border flex items-center justify-center text-xs " + (i === currentStep ? "border-accent bg-accent text-white" : "border-border text-text-muted")}>{i + 1}</span>
            )}
            <span>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <svg className="w-4 h-4 text-text-muted mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          )}
        </div>
      ))}
    </nav>
  );
}
`

const paymentMethod01TSX = `// payment-method-01 — Payment method selector (Stripe/Shopify checkout-inspired)
"use client";
import { useState } from "react";
export function PaymentMethodSelector({
  methods = [
    { id: "card", label: "Credit / Debit Card", icon: "💳" },
    { id: "paypal", label: "PayPal", icon: "🅿️" },
    { id: "apple", label: "Apple Pay", icon: "🍎" },
  ],
  onSelect,
}: {
  methods?: Array<{ id: string; label: string; icon: string }>;
  onSelect?: (id: string) => void;
}) {
  const [selected, setSelected] = useState(methods[0]?.id ?? "");
  return (
    <div className="flex flex-col gap-2">
      {methods.map((m) => (
        <button
          key={m.id}
          onClick={() => { setSelected(m.id); onSelect?.(m.id); }}
          className={"flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left " + (selected === m.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/40")}
        >
          <span className="text-xl">{m.icon}</span>
          <span className="text-sm font-medium text-foreground flex-1">{m.label}</span>
          <div className={"w-4 h-4 rounded-full border-2 flex items-center justify-center " + (selected === m.id ? "border-accent" : "border-border")}>
            {selected === m.id && <div className="w-2 h-2 rounded-full bg-accent" />}
          </div>
        </button>
      ))}
      {selected === "card" && (
        <div className="p-4 bg-background border border-border rounded-xl flex flex-col gap-3 mt-1">
          <input placeholder="Card number" className="bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-text-muted outline-none focus:border-accent transition-colors w-full" />
          <div className="flex gap-3">
            <input placeholder="MM / YY" className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-text-muted outline-none focus:border-accent transition-colors" />
            <input placeholder="CVC" className="w-24 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-text-muted outline-none focus:border-accent transition-colors" />
          </div>
        </div>
      )}
    </div>
  );
}
`

const addressCard01TSX = `// address-card-01 — Saved address card (Shopify My Account-inspired)
export function AddressCard({
  name = "Sarah Chen",
  line1 = "123 Market Street",
  line2 = "Apt 4B",
  city = "San Francisco",
  state = "CA",
  zip = "94105",
  country = "United States",
  phone = "+1 (415) 555-0142",
  isDefault = false,
  onEdit,
  onDelete,
  onSetDefault,
  onSelect,
  selected = false,
}: {
  name?: string; line1?: string; line2?: string; city?: string;
  state?: string; zip?: string; country?: string; phone?: string;
  isDefault?: boolean; selected?: boolean;
  onEdit?: () => void; onDelete?: () => void;
  onSetDefault?: () => void; onSelect?: () => void;
}) {
  return (
    <div onClick={onSelect} className={"p-4 rounded-xl border-2 transition-all cursor-pointer " + (selected ? "border-accent bg-accent/5" : "border-border hover:border-accent/30")}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{name}</span>
          {isDefault && <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded-full">Default</span>}
        </div>
        {selected && <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      </div>
      <address className="not-italic text-sm text-text-secondary flex flex-col gap-0.5">
        <span>{line1}{line2 && ", " + line2}</span>
        <span>{city}, {state} {zip}</span>
        <span>{country}</span>
        {phone && <span className="mt-1 text-text-muted">{phone}</span>}
      </address>
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
        <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="text-xs text-text-secondary hover:text-foreground transition-colors">Edit</button>
        {!isDefault && <button onClick={(e) => { e.stopPropagation(); onSetDefault?.(); }} className="text-xs text-text-secondary hover:text-foreground transition-colors">Set as default</button>}
        <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="text-xs text-danger hover:underline ml-auto">Delete</button>
      </div>
    </div>
  );
}
`

const wishlistButton01TSX = `// wishlist-button-01 — Wishlist / save for later button (Shopify / Amazon-inspired)
"use client";
import { useState } from "react";
export function WishlistButton({
  defaultSaved = false,
  productName = "Product",
  onChange,
}: {
  defaultSaved?: boolean; productName?: string; onChange?: (saved: boolean) => void;
}) {
  const [saved, setSaved] = useState(defaultSaved);
  const toggle = () => { const next = !saved; setSaved(next); onChange?.(next); };
  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      title={saved ? "Remove from wishlist" : "Save " + productName}
      className={"w-10 h-10 rounded-full flex items-center justify-center border transition-all " + (saved ? "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20" : "border-border bg-bg-elevated text-text-muted hover:text-danger hover:border-danger/30")}
    >
      <svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
`

const shippingEstimate01TSX = `// shipping-estimate-01 — Shipping options with estimate (Shopify checkout-inspired)
export function ShippingEstimate({
  options = [
    { id: "standard", label: "Standard Shipping", estimate: "Mar 5–8", price: 0 },
    { id: "express", label: "Express Shipping", estimate: "Mar 3–4", price: 9.99 },
    { id: "overnight", label: "Overnight", estimate: "Mar 2", price: 24.99 },
  ],
  selected = "standard",
  onSelect,
}: {
  options?: Array<{ id: string; label: string; estimate: string; price: number }>;
  selected?: string; onSelect?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect?.(opt.id)}
          className={"flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left " + (selected === opt.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/40")}
        >
          <div className={"w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 " + (selected === opt.id ? "border-accent" : "border-border")}>
            {selected === opt.id && <div className="w-2 h-2 rounded-full bg-accent" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{opt.label}</p>
            <p className="text-xs text-text-muted mt-0.5">Arrives {opt.estimate}</p>
          </div>
          <span className={"text-sm font-semibold " + (opt.price === 0 ? "text-success" : "text-foreground")}>
            {opt.price === 0 ? "Free" : "$" + opt.price.toFixed(2)}
          </span>
        </button>
      ))}
    </div>
  );
}
`

const reviewSummary01TSX = `// review-summary-01 — Rating summary with star bars (Amazon-inspired)
export function ReviewSummary({
  average = 4.3,
  total = 247,
  distribution = [120, 80, 30, 12, 5],
}: {
  average?: number; total?: number;
  distribution?: [number, number, number, number, number];
}) {
  const max = Math.max(...distribution);
  return (
    <div className="flex items-start gap-6 p-5 bg-bg-elevated border border-border rounded-2xl">
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <span className="text-5xl font-bold text-foreground">{average.toFixed(1)}</span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={"w-4 h-4 " + (i < Math.round(average) ? "text-yellow-400" : "text-bg-hover")} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          ))}
        </div>
        <span className="text-xs text-text-muted">{total} reviews</span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        {distribution.map((count, i) => {
          const star = 5 - i;
          const pct = max > 0 ? Math.round((count / max) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-text-muted w-4 text-right">{star}</span>
              <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: pct + "%" }} />
              </div>
              <span className="text-xs text-text-muted w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`

const appNavbar01TSX = `// app-navbar-01 — App top navbar (Vercel / Linear-inspired)
"use client";
import { useState } from "react";
export function AppNavbar({
  logo = "G",
  appName = "Grit",
  navItems = [
    { label: "Dashboard", href: "/dashboard", active: true },
    { label: "Projects", href: "/projects" },
    { label: "Team", href: "/team" },
    { label: "Settings", href: "/settings" },
  ],
  user = { name: "Sarah Chen", email: "sarah@example.com", initials: "SC" },
  onSignOut,
}: {
  logo?: string; appName?: string;
  navItems?: Array<{ label: string; href: string; active?: boolean }>;
  user?: { name: string; email: string; initials: string };
  onSignOut?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-40">
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <span className="text-white text-xs font-bold">{logo}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{appName}</span>
      </div>
      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {navItems.map((item) => (
          <a
            key={item.href} href={item.href}
            className={"px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap " + (item.active ? "bg-bg-elevated text-foreground" : "text-text-secondary hover:text-foreground hover:bg-bg-hover")}
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="relative flex-shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors">
          <span className="text-xs font-bold text-accent">{user.initials}</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-bg-elevated border border-border rounded-xl shadow-xl overflow-hidden z-50">
            <div className="px-3 py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
            <div className="p-1">
              <a href="/profile" className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-text-secondary hover:text-foreground hover:bg-bg-hover transition-colors">Profile</a>
              <a href="/settings" className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-text-secondary hover:text-foreground hover:bg-bg-hover transition-colors">Settings</a>
              <button onClick={onSignOut} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors">Sign out</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
`

const marketingNavbar01TSX = `// marketing-navbar-01 — Marketing site navbar (Vercel.com / Linear.app-inspired)
"use client";
import { useState } from "react";
export function MarketingNavbar({
  logo = "G",
  brand = "Grit",
  links = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Blog", href: "/blog" },
  ],
  ctaLabel = "Get started",
  ctaHref = "/signup",
  loginHref = "/login",
}: {
  logo?: string; brand?: string;
  links?: Array<{ label: string; href: string }>;
  ctaLabel?: string; ctaHref?: string; loginHref?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-8">
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white text-sm font-bold">{logo}</span>
          </div>
          <span className="text-base font-bold text-foreground">{brand}</span>
        </a>
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="px-3 py-1.5 text-sm text-text-secondary hover:text-foreground transition-colors rounded-lg hover:bg-bg-hover">{link.label}</a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <a href={loginHref} className="text-sm text-text-secondary hover:text-foreground transition-colors">Sign in</a>
          <a href={ctaHref} className="text-sm font-semibold px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white transition-colors">{ctaLabel}</a>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden ml-auto p-2 rounded-lg hover:bg-bg-hover transition-colors text-text-secondary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg-elevated px-4 py-4 flex flex-col gap-2">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="px-3 py-2.5 text-sm text-text-secondary hover:text-foreground rounded-lg hover:bg-bg-hover transition-colors">{link.label}</a>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
            <a href={loginHref} className="flex-1 text-center text-sm py-2 rounded-lg border border-border text-text-secondary hover:text-foreground transition-colors">Sign in</a>
            <a href={ctaHref} className="flex-1 text-center text-sm py-2 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold transition-colors">{ctaLabel}</a>
          </div>
        </div>
      )}
    </header>
  );
}
`

const sidebarNav01TSX = `// sidebar-nav-01 — App sidebar with icon+label nav (Linear / Notion-inspired)
export function SidebarNav({
  items = [
    { label: "Dashboard", href: "/dashboard", icon: "home", active: true },
    { label: "Projects", href: "/projects", icon: "folder" },
    { label: "Issues", href: "/issues", icon: "circle", badge: 4 },
    { label: "Team", href: "/team", icon: "users" },
    { label: "Analytics", href: "/analytics", icon: "chart" },
    { label: "Settings", href: "/settings", icon: "settings" },
  ],
}: {
  items?: Array<{ label: string; href: string; icon: string; active?: boolean; badge?: number }>;
}) {
  const iconPaths: Record<string, string> = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    circle: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  };
  return (
    <aside className="w-56 h-full bg-background border-r border-border flex flex-col py-4 px-2 gap-1">
      {items.map((item) => (
        <a
          key={item.href} href={item.href}
          className={"flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors " + (item.active ? "bg-bg-elevated text-foreground" : "text-text-secondary hover:text-foreground hover:bg-bg-hover")}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPaths[item.icon] ?? iconPaths["circle"]} />
          </svg>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="text-xs bg-accent text-white rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 font-medium">{item.badge > 99 ? "99+" : item.badge}</span>
          )}
        </a>
      ))}
    </aside>
  );
}
`

const breadcrumb01TSX = `// breadcrumb-01 — Breadcrumb navigation (Vercel dashboard-inspired)
export function Breadcrumb({
  items = [
    { label: "Projects", href: "/projects" },
    { label: "grit-app", href: "/projects/grit-app" },
    { label: "Settings" },
  ],
}: {
  items?: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && (
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          )}
          {item.href ? (
            <a href={item.href} className="text-text-muted hover:text-foreground transition-colors">{item.label}</a>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
`

const pageHeader01TSX = `// page-header-01 — Page header with title + description + action (Vercel / Linear-inspired)
export function PageHeader({
  title = "Team Settings",
  description = "Manage your team members, roles, and workspace preferences.",
  action,
  badge,
  breadcrumb,
}: {
  title?: string; description?: string;
  action?: React.ReactNode; badge?: string; breadcrumb?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-border">
      {breadcrumb && <div>{breadcrumb}</div>}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {badge && <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
          </div>
          {description && <p className="text-sm text-text-secondary mt-1 max-w-2xl">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
`

const marketingFooter01TSX = `// marketing-footer-01 — Marketing site footer with columns (Vercel-inspired)
export function MarketingFooter({
  brand = "Grit",
  tagline = "The full-stack Go framework.",
  columns = [
    { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Changelog", href: "/changelog" }] },
    { title: "Resources", links: [{ label: "Documentation", href: "/docs" }, { label: "Blog", href: "/blog" }, { label: "Community", href: "/community" }] },
    { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Contact", href: "/contact" }] },
    { title: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
  ],
}: {
  brand?: string; tagline?: string;
  columns?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
}) {
  return (
    <footer className="border-t border-border bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold">{brand[0]}</span>
              </div>
              <span className="font-bold text-foreground">{brand}</span>
            </div>
            <p className="text-sm text-text-muted">{tagline}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-text-muted hover:text-foreground transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} {brand}. All rights reserved.</p>
          <p className="text-xs text-text-muted">Built with{" "}<a href="https://gritframework.dev" className="text-accent hover:underline">{brand}</a></p>
        </div>
      </div>
    </footer>
  );
}
`

const alertBanner01TSX = `// alert-banner-01 — Alert/warning/success/error banner (common UI pattern)
export function AlertBanner({
  variant = "info",
  title,
  message = "Something needs your attention.",
  dismissible = true,
  onDismiss,
  action,
}: {
  variant?: "info" | "success" | "warning" | "error";
  title?: string; message?: string; dismissible?: boolean;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
}) {
  const config = {
    info: { bg: "bg-accent/10", border: "border-accent/30", icon: "text-accent", path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    success: { bg: "bg-success/10", border: "border-success/30", icon: "text-success", path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    warning: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "text-yellow-400", path: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
    error: { bg: "bg-danger/10", border: "border-danger/30", icon: "text-danger", path: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
  };
  const c = config[variant];
  return (
    <div className={"flex items-start gap-3 p-4 rounded-xl border " + c.bg + " " + c.border}>
      <svg className={"w-5 h-5 flex-shrink-0 mt-0.5 " + c.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.path} />
      </svg>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-foreground mb-0.5">{title}</p>}
        <p className="text-sm text-text-secondary">{message}</p>
        {action && (
          <button onClick={action.onClick} className={"mt-2 text-sm font-semibold hover:underline " + c.icon}>{action.label}</button>
        )}
      </div>
      {dismissible && (
        <button onClick={onDismiss} className="p-1 rounded text-text-muted hover:text-foreground transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}
`

const modalShell01TSX = `// modal-shell-01 — Modal dialog shell (Headless UI / Radix-inspired pattern)
"use client";
import { useEffect } from "react";
export function ModalShell({
  title = "Confirm action",
  description,
  children,
  footer,
  onClose,
  size = "md",
}: {
  title?: string; description?: string;
  children?: React.ReactNode; footer?: React.ReactNode;
  onClose?: () => void; size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className={"relative w-full " + sizeClasses[size] + " bg-bg-elevated border border-border rounded-2xl shadow-2xl overflow-hidden"}>
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-text-muted hover:text-foreground hover:bg-bg-hover transition-colors -mr-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children && <div className="p-6">{children}</div>}
        {footer && <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
`

const codeBlock01TSX = `// code-block-01 — Code display block (Vercel docs / GitHub-inspired)
"use client";
import { useState } from "react";
export function CodeBlock({
  code = "grit new my-app --template=saas",
  language = "bash",
  filename,
  showLineNumbers = false,
}: {
  code?: string; language?: string; filename?: string; showLineNumbers?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const lines = code.split("\n");
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg-elevated">
        <div className="flex items-center gap-2">
          {filename ? (
            <span className="text-xs text-text-secondary font-mono">{filename}</span>
          ) : (
            <span className="text-xs text-text-muted uppercase tracking-wider">{language}</span>
          )}
        </div>
        <button onClick={copy} className={"flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors " + (copied ? "text-success" : "text-text-muted hover:text-foreground")}>
          {copied ? (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Copy</>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono">
        {showLineNumbers ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i}>
                  <td className="pr-4 text-right text-text-muted select-none w-8">{i + 1}</td>
                  <td className="text-text-secondary">{line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <code className="text-text-secondary">{code}</code>
        )}
      </pre>
    </div>
  );
}
`

const statCard01TSX = `// stat-card-01 — Simple stat card (Stripe / Vercel dashboard-inspired)
export function StatCard({
  label = "Total Revenue",
  value = "$48,352",
  subtext = "+12% from last month",
  icon = "dollar",
  trend = "up",
}: {
  label?: string; value?: string; subtext?: string;
  icon?: "dollar" | "users" | "chart" | "rocket";
  trend?: "up" | "down" | "neutral";
}) {
  const iconPaths: Record<string, string> = {
    dollar: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    rocket: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.96 2.91m0 0a6 6 0 01-7.38-5.84m7.38 5.84A14.928 14.928 0 003.67 9.63",
  };
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-text-muted";
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPaths[icon] ?? iconPaths["chart"]} />
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      {subtext && <p className={"text-xs font-medium " + trendColor}>{trend === "up" ? "↑ " : trend === "down" ? "↓ " : ""}{subtext}</p>}
    </div>
  );
}
`

const sectionHeader01TSX = `// section-header-01 — Marketing section header (centered, Vercel landing-inspired)
export function SectionHeader({
  badge,
  title = "Everything you need to ship",
  subtitle = "Grit gives you the batteries-included stack so you can focus on building your product, not infrastructure.",
  align = "center",
}: {
  badge?: string; title?: string; subtitle?: string;
  align?: "left" | "center";
}) {
  const isCenter = align === "center";
  return (
    <div className={"flex flex-col gap-4 " + (isCenter ? "items-center text-center" : "items-start")}>
      {badge && (
        <span className="text-xs font-semibold border border-accent/30 bg-accent/10 text-accent px-3 py-1 rounded-full">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight max-w-2xl">
        {title}
      </h2>
      {subtitle && (
        <p className={"text-text-secondary leading-relaxed " + (isCenter ? "max-w-xl" : "max-w-2xl")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
`

const tabNav01TSX = `// tab-nav-01 — Tab navigation bar (GitHub repo tabs-inspired)
"use client";
import { useState } from "react";
export function TabNav({
  tabs = [
    { id: "overview", label: "Overview" },
    { id: "code", label: "Code", badge: 0 },
    { id: "issues", label: "Issues", badge: 4 },
    { id: "pulls", label: "Pull Requests", badge: 2 },
    { id: "settings", label: "Settings" },
  ],
  defaultTab = "overview",
  onChange,
}: {
  tabs?: Array<{ id: string; label: string; badge?: number }>;
  defaultTab?: string; onChange?: (id: string) => void;
}) {
  const [active, setActive] = useState(defaultTab);
  return (
    <div className="border-b border-border flex items-end gap-0 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => { setActive(tab.id); onChange?.(tab.id); }}
          className={"flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap " + (active === tab.id ? "border-accent text-foreground" : "border-transparent text-text-muted hover:text-foreground hover:border-border")}
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 && (
            <span className={"text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center " + (active === tab.id ? "bg-accent/20 text-accent" : "bg-bg-hover text-text-muted")}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
`

const loadingSkeleton01TSX = `// loading-skeleton-01 — Skeleton loading placeholder (common pattern)
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={"animate-pulse bg-bg-hover rounded-lg " + className} />;
}

// Pre-built skeleton layouts
export function CardSkeleton() {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      <Skeleton className="w-4 h-4 rounded" />
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={"h-4 " + (i === 0 ? "flex-1" : "w-24")} />
      ))}
    </div>
  );
}
`

const toastNotification01TSX = `// toast-notification-01 — Toast notification (Sonner / React Hot Toast-inspired)
export function Toast({
  message = "Changes saved successfully",
  variant = "success",
  action,
  onDismiss,
}: {
  message?: string; variant?: "success" | "error" | "info" | "warning";
  action?: { label: string; onClick: () => void }; onDismiss?: () => void;
}) {
  const config = {
    success: { icon: "text-success bg-success/20", path: "M5 13l4 4L19 7" },
    error: { icon: "text-danger bg-danger/20", path: "M6 18L18 6M6 6l12 12" },
    info: { icon: "text-accent bg-accent/20", path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    warning: { icon: "text-yellow-400 bg-yellow-500/20", path: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  };
  const c = config[variant];
  return (
    <div className="flex items-center gap-3 bg-bg-elevated border border-border rounded-xl px-4 py-3 shadow-lg min-w-64 max-w-sm">
      <div className={"w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 " + c.icon}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.path} />
        </svg>
      </div>
      <span className="text-sm text-foreground flex-1">{message}</span>
      {action && (
        <button onClick={action.onClick} className="text-xs text-accent hover:underline font-medium flex-shrink-0">{action.label}</button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="p-0.5 rounded text-text-muted hover:text-foreground transition-colors flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}
`

const dataList01TSX = `// data-list-01 — Key-value data list (Stripe details panel-inspired)
export function DataList({
  items = [
    { label: "Status", value: "Active", valueClass: "text-success" },
    { label: "Plan", value: "Pro Monthly" },
    { label: "Next billing", value: "Apr 1, 2025" },
    { label: "Amount", value: "$29.00" },
  ],
}: {
  items?: Array<{ label: string; value: string; valueClass?: string }>;
}) {
  return (
    <dl className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-3 gap-4">
          <dt className="text-sm text-text-secondary">{item.label}</dt>
          <dd className={"text-sm font-medium " + (item.valueClass ?? "text-foreground")}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
`

const errorPage01TSX = `// error-page-01 — Error page (404 / 500) (Vercel / Linear-inspired)
export function ErrorPage({
  code = "404",
  title = "Page not found",
  description = "The page you're looking for doesn't exist or has been moved.",
  homeHref = "/",
  backLabel = "Go back",
}: {
  code?: string; title?: string; description?: string;
  homeHref?: string; backLabel?: string;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-black text-bg-hover mb-4 select-none">{code}</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-text-secondary mb-8 max-w-md">{description}</p>
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-foreground hover:bg-bg-hover transition-colors text-sm">
          {backLabel}
        </button>
        <a href={homeHref} className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-semibold transition-colors">
          Back to home
        </a>
      </div>
    </div>
  );
}
`

const cardGrid01TSX = `// card-grid-01 — Responsive card grid wrapper with header
export function CardGrid({
  title,
  description,
  action,
  columns = 3,
  children,
}: {
  title?: string; description?: string; action?: React.ReactNode;
  columns?: 2 | 3 | 4; children?: React.ReactNode;
}) {
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };
  return (
    <section className="flex flex-col gap-6">
      {(title || action) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-sm text-text-secondary mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={"grid grid-cols-1 gap-4 " + colClass[columns]}>{children}</div>
    </section>
  );
}
`

const floatingAction01TSX = `// floating-action-01 — Floating action button (Notion "New page"-inspired)
export function FloatingActionButton({
  label = "New",
  icon = "plus",
  onClick,
  position = "bottom-right",
}: {
  label?: string; icon?: "plus" | "edit" | "message";
  onClick?: () => void; position?: "bottom-right" | "bottom-left";
}) {
  const iconPaths: Record<string, string> = {
    plus: "M12 4v16m8-8H4",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    message: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  };
  const posClass = position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6";
  return (
    <button
      onClick={onClick}
      className={"fixed " + posClass + " flex items-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 text-white rounded-full shadow-lg hover:shadow-accent/30 transition-all font-semibold text-sm hover:scale-105 active:scale-95 z-40"}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[icon] ?? iconPaths["plus"]} />
      </svg>
      {label}
    </button>
  );
}
`

const socialProofBar01TSX = `// social-proof-bar-01 — Avatar stack + trust bar (common SaaS landing pattern)
export function SocialProofBar({
  count = "50,000+",
  label = "developers ship with Grit",
  rating = "4.9",
  reviewSource = "Product Hunt",
  avatars = ["SC", "JW", "PM", "AR", "TK"],
}: {
  count?: string; label?: string; rating?: string;
  reviewSource?: string; avatars?: string[];
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {avatars.slice(0, 5).map((initials, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-background bg-accent/20 flex items-center justify-center flex-shrink-0"
              style={{ zIndex: avatars.length - i }}
            >
              <span className="text-xs font-semibold text-accent">{initials}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-foreground">{count}</span> {label}
        </p>
      </div>
      <div className="hidden sm:block w-px h-6 bg-border" />
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <span className="text-sm font-semibold text-foreground">{rating}</span>
        <span className="text-sm text-text-muted">on {reviewSource}</span>
      </div>
    </div>
  );
}
`

const featureComparison01TSX = `// feature-comparison-01 — Feature comparison table (Linear pricing page-inspired)
export function FeatureComparison({
  plans = ["Starter", "Pro", "Enterprise"],
  categories = [
    {
      name: "Core",
      features: [
        { label: "Projects", values: ["5", "Unlimited", "Unlimited"] },
        { label: "Team members", values: ["3", "15", "Unlimited"] },
        { label: "Storage", values: ["5 GB", "100 GB", "1 TB"] },
      ],
    },
    {
      name: "Features",
      features: [
        { label: "Analytics", values: [false, true, true] },
        { label: "Custom domain", values: [false, true, true] },
        { label: "Priority support", values: [false, false, true] },
        { label: "SSO / SAML", values: [false, false, true] },
        { label: "Audit log", values: [false, false, true] },
      ],
    },
  ],
}: {
  plans?: string[];
  categories?: Array<{
    name: string;
    features: Array<{ label: string; values: (string | boolean)[] }>;
  }>;
}) {
  const Cell = ({ v }: { v: string | boolean }) => {
    if (typeof v === "boolean") {
      return v ? (
        <svg className="w-5 h-5 text-success mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-text-muted mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      );
    }
    return <span className="text-sm text-foreground font-medium">{v}</span>;
  };
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 pr-4 text-sm font-medium text-text-muted w-48">Features</th>
            {plans.map((plan) => (
              <th key={plan} className="text-center py-4 px-4 text-sm font-semibold text-foreground">{plan}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <>
              <tr key={cat.name}>
                <td colSpan={plans.length + 1} className="pt-6 pb-2">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{cat.name}</span>
                </td>
              </tr>
              {cat.features.map((feat) => (
                <tr key={feat.label} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="py-3 pr-4 text-sm text-text-secondary">{feat.label}</td>
                  {feat.values.map((v, i) => (
                    <td key={i} className="py-3 px-4 text-center"><Cell v={v} /></td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`

const announcementBar01TSX = `// announcement-bar-01 — Dismissible top-of-page announcement banner (Vercel-style)
"use client";
import { useState } from "react";
export function AnnouncementBar({
  message = "Grit v1.0 is here",
  linkLabel = "Read the announcement",
  linkHref = "/blog/v1",
  badge,
}: {
  message?: string; linkLabel?: string; linkHref?: string; badge?: string;
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="bg-accent/10 border-b border-accent/20 px-4 py-2.5 flex items-center justify-center gap-3 relative">
      {badge && (
        <span className="text-xs font-bold bg-accent text-white px-2 py-0.5 rounded-full">{badge}</span>
      )}
      <p className="text-sm text-text-secondary text-center">
        {message}{" "}
        <a href={linkHref} className="text-accent font-semibold hover:underline ml-1">
          {linkLabel} &rarr;
        </a>
      </p>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 p-1 rounded text-text-muted hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
`

const waitlistForm01TSX = `// waitlist-form-01 — Waitlist signup with position counter (common pre-launch pattern)
"use client";
import { useState } from "react";
export function WaitlistForm({
  title = "Join the waitlist",
  description = "Be the first to know when we launch. We'll send you an invite.",
  currentCount = 2_847,
  onJoin,
}: {
  title?: string; description?: string; currentCount?: number;
  onJoin?: (email: string) => Promise<{ position: number }>;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [position, setPosition] = useState(0);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state !== "idle") return;
    setState("loading");
    try {
      const result = await onJoin?.(email);
      setPosition(result?.position ?? currentCount + 1);
      setState("done");
    } catch {
      setState("idle");
    }
  };
  return (
    <div className="bg-bg-elevated border border-border rounded-2xl p-6 flex flex-col gap-5 w-full max-w-md">
      {state === "done" ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground">You're #{position} on the list!</h3>
          <p className="text-sm text-text-secondary">We'll email you at <strong>{email}</strong> when your spot is ready.</p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted bg-background border border-border rounded-lg px-3 py-2">
            <div className="flex -space-x-1">
              {["SC", "JW", "PM"].map((i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-accent/30 border border-border flex items-center justify-center">
                  <span className="text-xs font-bold text-accent" style={{ fontSize: 8 }}>{i[0]}</span>
                </div>
              ))}
            </div>
            <span><strong className="text-foreground">{currentCount.toLocaleString()}</strong> people already waiting</span>
          </div>
          <form onSubmit={submit} className="flex gap-2">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-text-muted outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit" disabled={state === "loading"}
              className="px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex-shrink-0"
            >
              {state === "loading" ? "..." : "Join"}
            </button>
          </form>
          <p className="text-xs text-text-muted text-center">No spam. Unsubscribe anytime.</p>
        </>
      )}
    </div>
  );
}
`

const caseStudyCard01TSX = `// case-study-card-01 — Customer case study card with metric callout (Stripe/Vercel-style)
export function CaseStudyCard({
  companyName = "Acme Corp",
  companyLogo = "A",
  logoColor = "bg-blue-600",
  industry = "E-commerce",
  metric = "3x",
  metricLabel = "faster deployment",
  quote = "Grit cut our time-to-market in half. We shipped our MVP in 2 weeks instead of 2 months.",
  authorName = "Sarah Chen",
  authorRole = "CTO",
  href = "#",
}: {
  companyName?: string; companyLogo?: string; logoColor?: string;
  industry?: string; metric?: string; metricLabel?: string;
  quote?: string; authorName?: string; authorRole?: string; href?: string;
}) {
  return (
    <a
      href={href}
      className="group block bg-bg-elevated border border-border rounded-2xl p-6 hover:border-accent/40 transition-all flex flex-col gap-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={"w-10 h-10 rounded-xl " + logoColor + " flex items-center justify-center flex-shrink-0"}>
            <span className="text-white font-bold text-lg">{companyLogo}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{companyName}</p>
            <p className="text-xs text-text-muted">{industry}</p>
          </div>
        </div>
        <svg className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-accent">{metric}</span>
        <span className="text-sm text-text-secondary">{metricLabel}</span>
      </div>
      <blockquote className="text-sm text-text-secondary leading-relaxed italic border-l-2 border-accent/40 pl-3">
        "{quote}"
      </blockquote>
      <p className="text-xs text-text-muted mt-auto">
        — <span className="text-text-secondary font-medium">{authorName}</span>, {authorRole}
      </p>
    </a>
  );
}
`

const roadmapItem01TSX = `// roadmap-item-01 — Public roadmap item card with status and upvote (Canny/Linear-style)
"use client";
import { useState } from "react";
export function RoadmapItem({
  title = "AI-powered code review",
  description = "Automatically review pull requests using Claude to catch bugs, suggest improvements, and enforce coding standards.",
  status = "planned",
  votes = 142,
  tags = ["AI", "Developer Tools"],
  eta,
}: {
  title?: string; description?: string;
  status?: "planned" | "in-progress" | "done" | "considering";
  votes?: number; tags?: string[]; eta?: string;
}) {
  const [upvoted, setUpvoted] = useState(false);
  const [count, setCount] = useState(votes);
  const toggle = () => {
    setUpvoted(!upvoted);
    setCount(upvoted ? count - 1 : count + 1);
  };
  const statusConfig = {
    "planned": { label: "Planned", classes: "text-accent bg-accent/10 border-accent/20" },
    "in-progress": { label: "In Progress", classes: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
    "done": { label: "Shipped", classes: "text-success bg-success/10 border-success/20" },
    "considering": { label: "Considering", classes: "text-text-muted bg-bg-hover border-border" },
  };
  const s = statusConfig[status] ?? statusConfig["planned"];
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 flex items-start gap-4 hover:border-accent/30 transition-colors">
      <button
        onClick={toggle}
        className={"flex flex-col items-center gap-1 p-2 rounded-lg border transition-all min-w-[3rem] " + (upvoted ? "border-accent/30 bg-accent/10 text-accent" : "border-border text-text-muted hover:text-foreground hover:border-accent/30")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        <span className="text-xs font-bold">{count}</span>
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {eta && <span className="text-xs text-text-muted">ETA: {eta}</span>}
            <span className={"text-xs border px-2 py-0.5 rounded-full font-medium " + s.classes}>{s.label}</span>
          </div>
        </div>
        <p className="text-sm text-text-secondary mt-1 leading-relaxed">{description}</p>
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {tags.map((tag) => (
              <span key={tag} className="text-xs bg-background border border-border text-text-muted px-2 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`

const partnerCard01TSX = `// partner-card-01 — Technology partner / integration showcase card
export function PartnerCard({
  name = "Vercel",
  description = "Deploy your Grit web and admin apps to Vercel with zero configuration.",
  logoChar = "V",
  logoColor = "bg-black",
  category = "Deployment",
  href = "#",
  isOfficial = false,
}: {
  name?: string; description?: string; logoChar?: string;
  logoColor?: string; category?: string; href?: string; isOfficial?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-bg-elevated border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-accent/40 hover:bg-bg-hover transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={"w-10 h-10 rounded-xl " + logoColor + " flex items-center justify-center border border-white/10 flex-shrink-0"}>
            <span className="text-white font-bold text-base">{logoChar}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">{name}</span>
              {isOfficial && (
                <svg className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span className="text-xs text-text-muted">{category}</span>
          </div>
        </div>
        <svg className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      <span className="text-xs text-accent font-medium group-hover:underline">Learn more &rarr;</span>
    </a>
  );
}
`

const settingsNav01TSX = `// settings-nav-01 — Settings sidebar with grouped navigation items (Vercel/GitHub-style)
export function SettingsNav({
  groups = [
    {
      label: "Account",
      items: [
        { label: "Profile", href: "/settings/profile", active: true },
        { label: "Security", href: "/settings/security" },
        { label: "Notifications", href: "/settings/notifications" },
      ],
    },
    {
      label: "Workspace",
      items: [
        { label: "General", href: "/settings/workspace" },
        { label: "Members", href: "/settings/members" },
        { label: "Billing", href: "/settings/billing" },
        { label: "Integrations", href: "/settings/integrations" },
        { label: "API Keys", href: "/settings/api-keys" },
      ],
    },
    {
      label: "Danger Zone",
      items: [
        { label: "Delete Workspace", href: "/settings/delete", danger: true },
      ],
    },
  ],
}: {
  groups?: Array<{
    label: string;
    items: Array<{ label: string; href: string; active?: boolean; danger?: boolean }>;
  }>;
}) {
  return (
    <nav className="flex flex-col gap-6 w-48">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">{group.label}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={"flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors " + (item.active ? "bg-bg-elevated text-foreground" : item.danger ? "text-danger hover:bg-danger/10" : "text-text-secondary hover:text-foreground hover:bg-bg-hover")}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
`

const commandPaletteShell01TSX = `// command-palette-shell-01 — Full command palette modal with search + groups (Linear-style)
"use client";
import { useEffect, useState, useRef } from "react";
export function CommandPaletteShell({
  groups = [
    {
      label: "Recent",
      items: [
        { id: "1", label: "GRT-42 — Implement OAuth login flow", meta: "Issue" },
        { id: "2", label: "main branch", meta: "Branch" },
      ],
    },
    {
      label: "Actions",
      items: [
        { id: "3", label: "Create new issue", shortcut: ["C"], meta: "Action" },
        { id: "4", label: "Go to settings", shortcut: ["G", "S"], meta: "Navigate" },
        { id: "5", label: "Switch workspace", shortcut: ["O"], meta: "Navigate" },
      ],
    },
  ],
  placeholder = "Search or type a command...",
  onClose,
  onSelect,
}: {
  groups?: Array<{ label: string; items: Array<{ id: string; label: string; shortcut?: string[]; meta?: string }> }>;
  placeholder?: string; onClose?: () => void;
  onSelect?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(groups[0]?.items[0]?.id ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const allItems = groups.flatMap((g) => g.items);
  const filtered = query
    ? allItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-elevated border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-foreground placeholder-text-muted outline-none"
          />
          <kbd className="text-xs bg-background border border-border text-text-muted px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>
        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {query ? (
            filtered.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">No results for "{query}"</p>
            ) : (
              <div className="px-2">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onSelect?.(item.id); onClose?.(); }}
                    className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors " + (item.id === activeId ? "bg-accent/10" : "hover:bg-bg-hover")}
                  >
                    <span className="text-sm text-foreground flex-1 truncate">{item.label}</span>
                    {item.meta && <span className="text-xs text-text-muted">{item.meta}</span>}
                    {item.shortcut && (
                      <div className="flex gap-1">
                        {item.shortcut.map((k) => (
                          <kbd key={k} className="text-xs bg-background border border-border text-text-muted px-1.5 py-0.5 rounded font-mono">{k}</kbd>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-1.5">{group.label}</p>
                <div className="px-2">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { onSelect?.(item.id); onClose?.(); }}
                      className={"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors " + (item.id === activeId ? "bg-accent/10" : "hover:bg-bg-hover")}
                    >
                      <span className="text-sm text-foreground flex-1 truncate">{item.label}</span>
                      {item.meta && <span className="text-xs text-text-muted">{item.meta}</span>}
                      {item.shortcut && (
                        <div className="flex gap-1">
                          {item.shortcut.map((k) => (
                            <kbd key={k} className="text-xs bg-background border border-border text-text-muted px-1.5 py-0.5 rounded font-mono">{k}</kbd>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2.5 flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1 py-0.5 rounded">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1 py-0.5 rounded">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="bg-background border border-border px-1 py-0.5 rounded">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
`


// SeedUIComponentsExtended inserts the 96 extended Grit UI components.
// Safe to call on every startup — skips silently if components already exist.
// Must be called AFTER SeedUIComponents().
func SeedUIComponentsExtended(db *gorm.DB) {
	var count int64
	db.Model(&UIComponent{}).Count(&count)
	if count >= 100 {
		return
	}

	filesJSON := func(name, tsx string) string {
		data, _ := json.Marshal([]map[string]string{{
			"path":    "components/grit-ui/" + name + ".tsx",
			"type":    "registry:component",
			"target":  "components/grit-ui/" + name + ".tsx",
			"content": tsx,
		}})
		return string(data)
	}

	components := []UIComponent{
		{
			Name:         "hero-split-01",
			DisplayName:  "Split Hero",
			Description:  "Side-by-side hero with left copy and right terminal code block",
			Category:     "marketing",
			Tags:         "[\"hero\",\"landing\",\"split\"]",
			Files:        filesJSON("hero-split-01", heroSplit01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<HeroSplit01 />",
			IsPublic:     true,
		},
		{
			Name:         "logo-cloud-01",
			DisplayName:  "Logo Cloud",
			Description:  "Infinite-scroll marquee of customer and partner logos",
			Category:     "marketing",
			Tags:         "[\"logos\",\"trust\",\"marquee\"]",
			Files:        filesJSON("logo-cloud-01", logoCloud01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<LogoCloud01 />",
			IsPublic:     true,
		},
		{
			Name:         "testimonial-card-01",
			DisplayName:  "Testimonial Card",
			Description:  "Single customer testimonial with avatar, stars, and quote",
			Category:     "marketing",
			Tags:         "[\"testimonial\",\"review\",\"trust\"]",
			Files:        filesJSON("testimonial-card-01", testimonialCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<TestimonialCard01 quote=\"...\" name=\"...\" role=\"...\" company=\"...\" />",
			IsPublic:     true,
		},
		{
			Name:         "testimonial-grid-01",
			DisplayName:  "Testimonial Grid",
			Description:  "3-column masonry grid of customer testimonials",
			Category:     "marketing",
			Tags:         "[\"testimonials\",\"grid\",\"social-proof\"]",
			Files:        filesJSON("testimonial-grid-01", testimonialGrid01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<TestimonialGrid01 />",
			IsPublic:     true,
		},
		{
			Name:         "stats-banner-01",
			DisplayName:  "Stats Banner",
			Description:  "Dark stats strip with large numbers and radial glow",
			Category:     "marketing",
			Tags:         "[\"stats\",\"numbers\",\"marketing\"]",
			Files:        filesJSON("stats-banner-01", statsBanner01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<StatsBanner01 />",
			IsPublic:     true,
		},
		{
			Name:         "faq-accordion-01",
			DisplayName:  "FAQ Accordion",
			Description:  "Click-to-expand FAQ accordion with animated chevron",
			Category:     "marketing",
			Tags:         "[\"faq\",\"accordion\",\"marketing\"]",
			Files:        filesJSON("faq-accordion-01", faqAccordion01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<FaqAccordion01 />",
			IsPublic:     true,
		},
		{
			Name:         "cta-banner-01",
			DisplayName:  "CTA Banner",
			Description:  "Full-width CTA section with email capture and success state",
			Category:     "marketing",
			Tags:         "[\"cta\",\"email\",\"conversion\"]",
			Files:        filesJSON("cta-banner-01", ctaBanner01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CtaBanner01 title=\"Get started free\" />",
			IsPublic:     true,
		},
		{
			Name:         "newsletter-signup-01",
			DisplayName:  "Newsletter Signup",
			Description:  "Newsletter card with subscriber count badge and success state",
			Category:     "marketing",
			Tags:         "[\"newsletter\",\"email\",\"signup\"]",
			Files:        filesJSON("newsletter-signup-01", newsletterSignup01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<NewsletterSignup01 />",
			IsPublic:     true,
		},
		{
			Name:         "changelog-item-01",
			DisplayName:  "Changelog Item",
			Description:  "Version changelog entry with timeline dot, tags, and change list",
			Category:     "marketing",
			Tags:         "[\"changelog\",\"version\",\"release\"]",
			Files:        filesJSON("changelog-item-01", changelogItem01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ChangelogItem01 version=\"v1.0\" date=\"Mar 2025\" title=\"Initial Release\" />",
			IsPublic:     true,
		},
		{
			Name:         "pricing-toggle-01",
			DisplayName:  "Pricing Toggle",
			Description:  "Full pricing section with monthly/annual toggle and 3 tier cards",
			Category:     "marketing",
			Tags:         "[\"pricing\",\"plans\",\"toggle\",\"billing\"]",
			Files:        filesJSON("pricing-toggle-01", pricingToggle01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<PricingToggle01 />",
			IsPublic:     true,
		},
		{
			Name:         "login-card-01",
			DisplayName:  "Login Card",
			Description:  "Premium login card with social OAuth buttons, remember me, forgot password",
			Category:     "auth",
			Tags:         "[\"login\",\"auth\",\"oauth\"]",
			Files:        filesJSON("login-card-01", loginCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<LoginCard01 />",
			IsPublic:     true,
		},
		{
			Name:         "signup-card-01",
			DisplayName:  "Signup Card",
			Description:  "Split signup form with feature list and password strength indicator",
			Category:     "auth",
			Tags:         "[\"signup\",\"register\",\"auth\"]",
			Files:        filesJSON("signup-card-01", signupCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SignupCard01 />",
			IsPublic:     true,
		},
		{
			Name:         "forgot-password-card-01",
			DisplayName:  "Forgot Password",
			Description:  "Email recovery card with clean success state",
			Category:     "auth",
			Tags:         "[\"forgot\",\"password\",\"recovery\"]",
			Files:        filesJSON("forgot-password-card-01", forgotPasswordCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ForgotPasswordCard01 />",
			IsPublic:     true,
		},
		{
			Name:         "otp-input-01",
			DisplayName:  "OTP Input",
			Description:  "6-digit OTP input with auto-advance, paste support, and resend timer",
			Category:     "auth",
			Tags:         "[\"otp\",\"2fa\",\"verification\"]",
			Files:        filesJSON("otp-input-01", otpInput01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<OtpInput01 email=\"user@example.com\" onComplete={(code) => {}} />",
			IsPublic:     true,
		},
		{
			Name:         "social-login-buttons-01",
			DisplayName:  "Social Login Buttons",
			Description:  "Google and GitHub OAuth sign-in buttons with divider",
			Category:     "auth",
			Tags:         "[\"oauth\",\"google\",\"github\",\"social\"]",
			Files:        filesJSON("social-login-buttons-01", socialLoginButtons01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SocialLoginButtons01 />",
			IsPublic:     true,
		},
		{
			Name:         "onboarding-wizard-01",
			DisplayName:  "Onboarding Wizard",
			Description:  "3-step setup wizard with role, workspace, and plan selection",
			Category:     "auth",
			Tags:         "[\"onboarding\",\"wizard\",\"setup\"]",
			Files:        filesJSON("onboarding-wizard-01", onboardingWizard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<OnboardingWizard01 onComplete={() => {}} />",
			IsPublic:     true,
		},
		{
			Name:         "two-factor-setup-01",
			DisplayName:  "Two-Factor Setup",
			Description:  "2FA setup card with QR scan, verify code, and backup codes steps",
			Category:     "auth",
			Tags:         "[\"2fa\",\"security\",\"totp\"]",
			Files:        filesJSON("two-factor-setup-01", twoFactorSetup01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<TwoFactorSetup />",
			IsPublic:     true,
		},
		{
			Name:         "profile-avatar-01",
			DisplayName:  "Profile Avatar",
			Description:  "User avatar component with image upload and initials fallback",
			Category:     "auth",
			Tags:         "[\"avatar\",\"profile\",\"upload\"]",
			Files:        filesJSON("profile-avatar-01", profileAvatar01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ProfileAvatar name=\"Sarah Chen\" email=\"sarah@example.com\" />",
			IsPublic:     true,
		},
		{
			Name:         "account-deletion-01",
			DisplayName:  "Account Deletion",
			Description:  "Confirmation dialog for irreversible account/workspace deletion",
			Category:     "auth",
			Tags:         "[\"delete\",\"danger\",\"confirmation\"]",
			Files:        filesJSON("account-deletion-01", accountDeletion01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<AccountDeletion workspaceName=\"Acme Corp\" />",
			IsPublic:     true,
		},
		{
			Name:         "oauth-button-01",
			DisplayName:  "OAuth Button",
			Description:  "OAuth provider sign-in button supporting GitHub, Google, Discord, X",
			Category:     "auth",
			Tags:         "[\"oauth\",\"social\",\"login\"]",
			Files:        filesJSON("oauth-button-01", oauthButton01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<OAuthButton provider=\"github\" />",
			IsPublic:     true,
		},
		{
			Name:         "billing-card-01",
			DisplayName:  "Billing Card",
			Description:  "Current plan overview card with usage bar and upgrade button (Stripe-style)",
			Category:     "saas",
			Tags:         "[\"billing\",\"plan\",\"subscription\"]",
			Files:        filesJSON("billing-card-01", billingCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<BillingCard name=\"Pro\" price=\"29\" period=\"month\" />",
			IsPublic:     true,
		},
		{
			Name:         "usage-meter-01",
			DisplayName:  "Usage Meter",
			Description:  "Resource usage bar with limit indicator and upgrade link (Vercel-style)",
			Category:     "saas",
			Tags:         "[\"usage\",\"quota\",\"limits\"]",
			Files:        filesJSON("usage-meter-01", usageMeter01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<UsageMeter label=\"API Requests\" used={42000} limit={100000} />",
			IsPublic:     true,
		},
		{
			Name:         "team-member-row-01",
			DisplayName:  "Team Member Row",
			Description:  "Team roster row with avatar, role badge, last active, and actions",
			Category:     "saas",
			Tags:         "[\"team\",\"members\",\"roles\"]",
			Files:        filesJSON("team-member-row-01", teamMemberRow01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<TeamMemberRow name=\"Sarah Chen\" email=\"sarah@example.com\" role=\"Admin\" />",
			IsPublic:     true,
		},
		{
			Name:         "api-key-row-01",
			DisplayName:  "API Key Row",
			Description:  "API key row with masked key, copy button, and revoke (Vercel-style)",
			Category:     "saas",
			Tags:         "[\"api\",\"keys\",\"security\"]",
			Files:        filesJSON("api-key-row-01", apiKeyRow01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<APIKeyRow name=\"Production\" prefix=\"grit_live\" suffix=\"xK9m\" />",
			IsPublic:     true,
		},
		{
			Name:         "kanban-card-01",
			DisplayName:  "Kanban Card",
			Description:  "Issue/task card with priority dot, labels, and assignee (Linear-style)",
			Category:     "saas",
			Tags:         "[\"kanban\",\"tasks\",\"issues\",\"linear\"]",
			Files:        filesJSON("kanban-card-01", kanbanCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<KanbanCard id=\"GRT-42\" title=\"Implement OAuth\" priority=\"high\" />",
			IsPublic:     true,
		},
		{
			Name:         "metric-card-01",
			DisplayName:  "Metric Card",
			Description:  "KPI metric card with trend indicator and sparkline (Vercel Analytics)",
			Category:     "saas",
			Tags:         "[\"metrics\",\"kpi\",\"dashboard\",\"analytics\"]",
			Files:        filesJSON("metric-card-01", metricCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<MetricCard label=\"Monthly Revenue\" value=\"$12,430\" change=\"+18.2%\" trend=\"up\" />",
			IsPublic:     true,
		},
		{
			Name:         "activity-item-01",
			DisplayName:  "Activity Feed Item",
			Description:  "Activity log item with actor avatar, action, and timestamp (GitHub-style)",
			Category:     "saas",
			Tags:         "[\"activity\",\"feed\",\"log\",\"github\"]",
			Files:        filesJSON("activity-item-01", activityItem01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ActivityItem actor=\"sarah\" action=\"merged pull request\" target=\"#142\" />",
			IsPublic:     true,
		},
		{
			Name:         "notification-item-01",
			DisplayName:  "Notification Item",
			Description:  "Notification row with unread indicator and mark-read button (Linear-style)",
			Category:     "saas",
			Tags:         "[\"notifications\",\"inbox\",\"alerts\"]",
			Files:        filesJSON("notification-item-01", notificationItem01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<NotificationItem title=\"Sarah commented\" timestamp=\"5m ago\" />",
			IsPublic:     true,
		},
		{
			Name:         "project-card-01",
			DisplayName:  "Project Card",
			Description:  "Project/deployment card with framework, status, and commit info (Vercel)",
			Category:     "saas",
			Tags:         "[\"project\",\"deployment\",\"vercel\"]",
			Files:        filesJSON("project-card-01", projectCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ProjectCard name=\"grit-app\" domain=\"grit-app.vercel.app\" status=\"ready\" />",
			IsPublic:     true,
		},
		{
			Name:         "feature-flag-row-01",
			DisplayName:  "Feature Flag Row",
			Description:  "Feature flag toggle row with key and rollout percentage (LaunchDarkly)",
			Category:     "saas",
			Tags:         "[\"feature-flags\",\"toggles\",\"rollout\"]",
			Files:        filesJSON("feature-flag-row-01", featureFlagRow01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<FeatureFlagRow name=\"new-dashboard\" displayName=\"New Dashboard\" />",
			IsPublic:     true,
		},
		{
			Name:         "webhook-row-01",
			DisplayName:  "Webhook Row",
			Description:  "Webhook endpoint row with success rate and test/edit/delete (Stripe-style)",
			Category:     "saas",
			Tags:         "[\"webhooks\",\"integrations\",\"stripe\"]",
			Files:        filesJSON("webhook-row-01", webhookRow01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<WebhookRow url=\"https://api.example.com/webhooks\" events={[\"payment.success\"]} />",
			IsPublic:     true,
		},
		{
			Name:         "plan-upgrade-banner-01",
			DisplayName:  "Plan Upgrade Banner",
			Description:  "Upgrade prompt banner with feature callout and dismiss (Intercom-style)",
			Category:     "saas",
			Tags:         "[\"upgrade\",\"upsell\",\"conversion\"]",
			Files:        filesJSON("plan-upgrade-banner-01", planUpgradeBanner01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<PlanUpgradeBanner title=\"You've used 90% of your quota\" />",
			IsPublic:     true,
		},
		{
			Name:         "trial-countdown-01",
			DisplayName:  "Trial Countdown",
			Description:  "Trial expiry countdown with days remaining and upgrade CTA",
			Category:     "saas",
			Tags:         "[\"trial\",\"countdown\",\"conversion\"]",
			Files:        filesJSON("trial-countdown-01", trialCountdown01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<TrialCountdown daysLeft={7} planName=\"Pro\" />",
			IsPublic:     true,
		},
		{
			Name:         "integration-card-01",
			DisplayName:  "Integration Card",
			Description:  "Integration card with logo, description, and connect button (Linear/Notion)",
			Category:     "saas",
			Tags:         "[\"integrations\",\"apps\",\"marketplace\"]",
			Files:        filesJSON("integration-card-01", integrationCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<IntegrationCard name=\"GitHub\" isConnected={false} />",
			IsPublic:     true,
		},
		{
			Name:         "empty-state-01",
			DisplayName:  "Empty State",
			Description:  "Empty state placeholder with icon, title, description, and CTA (Linear)",
			Category:     "saas",
			Tags:         "[\"empty\",\"placeholder\",\"zero-state\"]",
			Files:        filesJSON("empty-state-01", emptyState01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<EmptyState title=\"No issues yet\" icon=\"inbox\" ctaLabel=\"Create issue\" />",
			IsPublic:     true,
		},
		{
			Name:         "command-item-01",
			DisplayName:  "Command Item",
			Description:  "Command palette item with icon, label, and keyboard shortcut (Linear Cmd+K)",
			Category:     "saas",
			Tags:         "[\"command\",\"palette\",\"search\",\"keyboard\"]",
			Files:        filesJSON("command-item-01", commandItem01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CommandItem label=\"Create new issue\" shortcut={[\"⌘\", \"N\"]} />",
			IsPublic:     true,
		},
		{
			Name:         "onboarding-step-01",
			DisplayName:  "Onboarding Step",
			Description:  "Onboarding checklist step with done/active/pending states (Stripe)",
			Category:     "saas",
			Tags:         "[\"onboarding\",\"checklist\",\"setup\"]",
			Files:        filesJSON("onboarding-step-01", onboardingStep01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<OnboardingStep number={1} title=\"Set up your workspace\" status=\"current\" />",
			IsPublic:     true,
		},
		{
			Name:         "quota-alert-01",
			DisplayName:  "Quota Alert",
			Description:  "Usage quota warning with progress bar and upgrade link (Vercel/Netlify)",
			Category:     "saas",
			Tags:         "[\"quota\",\"limits\",\"warning\",\"alert\"]",
			Files:        filesJSON("quota-alert-01", quotaAlert01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<QuotaAlert resource=\"Build minutes\" used={450} limit={500} />",
			IsPublic:     true,
		},
		{
			Name:         "audit-log-row-01",
			DisplayName:  "Audit Log Row",
			Description:  "Audit trail entry with user, action, IP, and timestamp (Stripe-style)",
			Category:     "saas",
			Tags:         "[\"audit\",\"log\",\"security\",\"compliance\"]",
			Files:        filesJSON("audit-log-row-01", auditLogRow01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<AuditLogRow actor=\"sarah@example.com\" action=\"Updated\" resource=\"API key\" />",
			IsPublic:     true,
		},
		{
			Name:         "settings-section-01",
			DisplayName:  "Settings Section",
			Description:  "Settings card section with title, description, and action area",
			Category:     "saas",
			Tags:         "[\"settings\",\"form\",\"configuration\"]",
			Files:        filesJSON("settings-section-01", settingsSection01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SettingsSection title=\"Workspace Name\" description=\"Edit your workspace name.\"><input /></SettingsSection>",
			IsPublic:     true,
		},
		{
			Name:         "invitation-link-01",
			DisplayName:  "Invitation Link",
			Description:  "Workspace invite link with copy button, expiry, and disable option",
			Category:     "saas",
			Tags:         "[\"invite\",\"link\",\"sharing\"]",
			Files:        filesJSON("invitation-link-01", invitationLink01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<InvitationLink inviteUrl=\"https://app.example.com/invite/abc123\" />",
			IsPublic:     true,
		},
		{
			Name:         "file-upload-zone-01",
			DisplayName:  "File Upload Zone",
			Description:  "Drag-and-drop file upload zone with type hints (Linear attachments)",
			Category:     "saas",
			Tags:         "[\"upload\",\"file\",\"drag-drop\"]",
			Files:        filesJSON("file-upload-zone-01", fileUploadZone01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<FileUploadZone accept=\".png,.jpg,.pdf\" maxSizeMB={10} />",
			IsPublic:     true,
		},
		{
			Name:         "progress-tracker-01",
			DisplayName:  "Progress Tracker",
			Description:  "Multi-step completion tracker with step names and states (Stripe)",
			Category:     "saas",
			Tags:         "[\"progress\",\"steps\",\"setup\",\"onboarding\"]",
			Files:        filesJSON("progress-tracker-01", progressTracker01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ProgressTracker steps={[{label:\"Account\",status:\"done\"},{label:\"Team\",status:\"current\"}]} />",
			IsPublic:     true,
		},
		{
			Name:         "search-filter-bar-01",
			DisplayName:  "Search Filter Bar",
			Description:  "Search input with active filter pills (GitHub issues-style)",
			Category:     "saas",
			Tags:         "[\"search\",\"filter\",\"issues\"]",
			Files:        filesJSON("search-filter-bar-01", searchFilterBar01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SearchFilterBar placeholder=\"Search issues...\" />",
			IsPublic:     true,
		},
		{
			Name:         "data-table-row-01",
			DisplayName:  "Data Table Row",
			Description:  "Data table row with checkbox, status badge, and hover actions",
			Category:     "saas",
			Tags:         "[\"table\",\"row\",\"list\",\"data\"]",
			Files:        filesJSON("data-table-row-01", dataTableRow01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<DataTableRow cells={[\"user@example.com\",\"Admin\",\"Mar 1\",\"Active\"]} />",
			IsPublic:     true,
		},
		{
			Name:         "session-row-01",
			DisplayName:  "Session Row",
			Description:  "Active session/device row with location, last active, and revoke (GitHub)",
			Category:     "saas",
			Tags:         "[\"session\",\"security\",\"devices\"]",
			Files:        filesJSON("session-row-01", sessionRow01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SessionRow deviceName=\"MacBook Pro\" browser=\"Chrome 122\" isCurrent={true} />",
			IsPublic:     true,
		},
		{
			Name:         "billing-history-row-01",
			DisplayName:  "Billing History Row",
			Description:  "Invoice row with amount, status badge, and PDF download (Stripe)",
			Category:     "saas",
			Tags:         "[\"billing\",\"invoices\",\"payment\",\"history\"]",
			Files:        filesJSON("billing-history-row-01", billingHistoryRow01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<BillingHistoryRow invoiceId=\"INV-2025-003\" amount=\"$29.00\" status=\"paid\" />",
			IsPublic:     true,
		},
		{
			Name:         "workspace-switcher-01",
			DisplayName:  "Workspace Switcher",
			Description:  "Workspace/org switcher dropdown trigger (Linear/Notion-style)",
			Category:     "saas",
			Tags:         "[\"workspace\",\"org\",\"switcher\",\"navigation\"]",
			Files:        filesJSON("workspace-switcher-01", workspaceSwitcher01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<WorkspaceSwitcher currentId=\"1\" />",
			IsPublic:     true,
		},
		{
			Name:         "permission-row-01",
			DisplayName:  "Permission Row",
			Description:  "Permission scope toggle row with Viewer/Member/Admin buttons",
			Category:     "saas",
			Tags:         "[\"permissions\",\"roles\",\"access-control\"]",
			Files:        filesJSON("permission-row-01", permissionRow01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<PermissionRow scope=\"Members\" currentRole=\"Member\" />",
			IsPublic:     true,
		},
		{
			Name:         "sso-button-01",
			DisplayName:  "SSO Button",
			Description:  "SSO provider sign-in button with org name and domain (Okta-style)",
			Category:     "saas",
			Tags:         "[\"sso\",\"enterprise\",\"okta\",\"auth\"]",
			Files:        filesJSON("sso-button-01", ssoButton01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SSOButton provider=\"Google Workspace\" orgName=\"Acme Corp\" orgDomain=\"acme.com\" />",
			IsPublic:     true,
		},
		{
			Name:         "product-card-list-01",
			DisplayName:  "Product List Row",
			Description:  "Product list row with image, rating, price, and stock level (Shopify admin)",
			Category:     "ecommerce",
			Tags:         "[\"product\",\"list\",\"ecommerce\",\"shopify\"]",
			Files:        filesJSON("product-card-list-01", productCardList01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ProductCardList name=\"Wireless Headphones\" price=\"$129.99\" stock={42} />",
			IsPublic:     true,
		},
		{
			Name:         "product-gallery-01",
			DisplayName:  "Product Gallery",
			Description:  "Product image gallery with clickable thumbnail strip (Shopify PDP)",
			Category:     "ecommerce",
			Tags:         "[\"gallery\",\"images\",\"product\",\"pdp\"]",
			Files:        filesJSON("product-gallery-01", productGallery01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ProductGallery productName=\"Wireless Headphones\" />",
			IsPublic:     true,
		},
		{
			Name:         "product-variant-01",
			DisplayName:  "Product Variant Selector",
			Description:  "Color swatch and size variant selector buttons (Shopify PDP)",
			Category:     "ecommerce",
			Tags:         "[\"variants\",\"colors\",\"sizes\",\"product\"]",
			Files:        filesJSON("product-variant-01", productVariant01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ProductVariantSelector />",
			IsPublic:     true,
		},
		{
			Name:         "cart-item-01",
			DisplayName:  "Cart Item",
			Description:  "Cart line item with image, quantity spinner, and remove button (Shopify cart)",
			Category:     "ecommerce",
			Tags:         "[\"cart\",\"line-item\",\"checkout\",\"ecommerce\"]",
			Files:        filesJSON("cart-item-01", cartItem01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CartItem name=\"Wireless Headphones\" price={129.99} quantity={1} />",
			IsPublic:     true,
		},
		{
			Name:         "cart-summary-01",
			DisplayName:  "Cart Summary",
			Description:  "Order summary with subtotal, discount, tax, total, and checkout CTA (Shopify)",
			Category:     "ecommerce",
			Tags:         "[\"cart\",\"summary\",\"checkout\",\"order\"]",
			Files:        filesJSON("cart-summary-01", cartSummary01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CartSummary subtotal={259.98} />",
			IsPublic:     true,
		},
		{
			Name:         "order-status-01",
			DisplayName:  "Order Status Tracker",
			Description:  "Order progress timeline from placed to delivered (Shopify/Amazon)",
			Category:     "ecommerce",
			Tags:         "[\"order\",\"tracking\",\"shipping\",\"status\"]",
			Files:        filesJSON("order-status-01", orderStatus01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<OrderStatus orderId=\"#1042\" />",
			IsPublic:     true,
		},
		{
			Name:         "order-card-01",
			DisplayName:  "Order Card",
			Description:  "Order history card with items, status badge, and action buttons",
			Category:     "ecommerce",
			Tags:         "[\"order\",\"history\",\"ecommerce\"]",
			Files:        filesJSON("order-card-01", orderCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<OrderCard orderId=\"#1042\" status=\"shipped\" total=\"$169.97\" />",
			IsPublic:     true,
		},
		{
			Name:         "review-card-01",
			DisplayName:  "Review Card",
			Description:  "Product review with star rating, verified badge, and helpful vote",
			Category:     "ecommerce",
			Tags:         "[\"review\",\"rating\",\"social-proof\",\"product\"]",
			Files:        filesJSON("review-card-01", reviewCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ReviewCard author=\"Alex M.\" rating={5} title=\"Best product ever\" />",
			IsPublic:     true,
		},
		{
			Name:         "discount-badge-01",
			DisplayName:  "Discount Badge",
			Description:  "Sale percentage-off badge and flash sale pill variants",
			Category:     "ecommerce",
			Tags:         "[\"discount\",\"badge\",\"sale\",\"promotion\"]",
			Files:        filesJSON("discount-badge-01", discountBadge01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<DiscountBadge type=\"percent\" value=\"20\" /><SaleBadge text=\"Flash Sale\" />",
			IsPublic:     true,
		},
		{
			Name:         "stock-indicator-01",
			DisplayName:  "Stock Indicator",
			Description:  "In stock / low stock / out of stock indicator with count (Shopify PDP)",
			Category:     "ecommerce",
			Tags:         "[\"stock\",\"inventory\",\"product\"]",
			Files:        filesJSON("stock-indicator-01", stockIndicator01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<StockIndicator stock={8} lowThreshold={10} />",
			IsPublic:     true,
		},
		{
			Name:         "flash-sale-timer-01",
			DisplayName:  "Flash Sale Timer",
			Description:  "Live countdown timer with urgency styling for limited-time offers",
			Category:     "ecommerce",
			Tags:         "[\"timer\",\"countdown\",\"flash-sale\",\"urgency\"]",
			Files:        filesJSON("flash-sale-timer-01", flashSaleTimer01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<FlashSaleTimer label=\"Flash Sale ends in\" />",
			IsPublic:     true,
		},
		{
			Name:         "bundle-offer-01",
			DisplayName:  "Bundle Offer",
			Description:  "Frequently bought together bundle offer card (Amazon-style)",
			Category:     "ecommerce",
			Tags:         "[\"bundle\",\"upsell\",\"cross-sell\",\"ecommerce\"]",
			Files:        filesJSON("bundle-offer-01", bundleOffer01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<BundleOffer discountPercent={15} />",
			IsPublic:     true,
		},
		{
			Name:         "category-filter-01",
			DisplayName:  "Category Filter",
			Description:  "Filter sidebar with category checkboxes, price range, and star rating",
			Category:     "ecommerce",
			Tags:         "[\"filter\",\"sidebar\",\"facets\",\"search\",\"ecommerce\"]",
			Files:        filesJSON("category-filter-01", categoryFilter01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CategoryFilter />",
			IsPublic:     true,
		},
		{
			Name:         "checkout-step-indicator-01",
			DisplayName:  "Checkout Step Indicator",
			Description:  "Checkout progress breadcrumb (Cart → Information → Shipping → Payment)",
			Category:     "ecommerce",
			Tags:         "[\"checkout\",\"steps\",\"progress\",\"ecommerce\"]",
			Files:        filesJSON("checkout-step-indicator-01", checkoutStepIndicator01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CheckoutStepIndicator currentStep={1} />",
			IsPublic:     true,
		},
		{
			Name:         "payment-method-01",
			DisplayName:  "Payment Method Selector",
			Description:  "Payment selector with card form, PayPal, and Apple Pay (Stripe checkout)",
			Category:     "ecommerce",
			Tags:         "[\"payment\",\"checkout\",\"stripe\",\"ecommerce\"]",
			Files:        filesJSON("payment-method-01", paymentMethod01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<PaymentMethodSelector />",
			IsPublic:     true,
		},
		{
			Name:         "address-card-01",
			DisplayName:  "Address Card",
			Description:  "Saved address card with select, edit, set-as-default, and delete actions",
			Category:     "ecommerce",
			Tags:         "[\"address\",\"shipping\",\"checkout\",\"ecommerce\"]",
			Files:        filesJSON("address-card-01", addressCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<AddressCard name=\"Sarah Chen\" city=\"San Francisco\" isDefault={true} />",
			IsPublic:     true,
		},
		{
			Name:         "wishlist-button-01",
			DisplayName:  "Wishlist Button",
			Description:  "Heart/bookmark toggle button for save-for-later / wishlist (Shopify/Amazon)",
			Category:     "ecommerce",
			Tags:         "[\"wishlist\",\"save\",\"heart\",\"product\"]",
			Files:        filesJSON("wishlist-button-01", wishlistButton01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<WishlistButton productName=\"Wireless Headphones\" />",
			IsPublic:     true,
		},
		{
			Name:         "shipping-estimate-01",
			DisplayName:  "Shipping Estimate",
			Description:  "Shipping option selector with carrier, delivery estimate, and price",
			Category:     "ecommerce",
			Tags:         "[\"shipping\",\"delivery\",\"checkout\",\"ecommerce\"]",
			Files:        filesJSON("shipping-estimate-01", shippingEstimate01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ShippingEstimate />",
			IsPublic:     true,
		},
		{
			Name:         "review-summary-01",
			DisplayName:  "Review Summary",
			Description:  "Aggregate rating summary with star distribution bars (Amazon-style)",
			Category:     "ecommerce",
			Tags:         "[\"reviews\",\"rating\",\"summary\",\"social-proof\"]",
			Files:        filesJSON("review-summary-01", reviewSummary01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ReviewSummary average={4.3} total={247} />",
			IsPublic:     true,
		},
		{
			Name:         "app-navbar-01",
			DisplayName:  "App Navbar",
			Description:  "Dark app top navbar with logo, nav links, and user menu (Vercel/Linear)",
			Category:     "layout",
			Tags:         "[\"navbar\",\"navigation\",\"header\",\"app\"]",
			Files:        filesJSON("app-navbar-01", appNavbar01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<AppNavbar appName=\"Grit\" />",
			IsPublic:     true,
		},
		{
			Name:         "marketing-navbar-01",
			DisplayName:  "Marketing Navbar",
			Description:  "Marketing site navbar with links, login, and CTA button",
			Category:     "layout",
			Tags:         "[\"navbar\",\"marketing\",\"header\",\"navigation\"]",
			Files:        filesJSON("marketing-navbar-01", marketingNavbar01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<MarketingNavbar brand=\"Grit\" />",
			IsPublic:     true,
		},
		{
			Name:         "sidebar-nav-01",
			DisplayName:  "Sidebar Nav",
			Description:  "App sidebar with icon + label navigation and badge counts (Linear/Notion)",
			Category:     "layout",
			Tags:         "[\"sidebar\",\"navigation\",\"app\",\"layout\"]",
			Files:        filesJSON("sidebar-nav-01", sidebarNav01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SidebarNav />",
			IsPublic:     true,
		},
		{
			Name:         "breadcrumb-01",
			DisplayName:  "Breadcrumb",
			Description:  "Breadcrumb navigation with chevron separators (Vercel dashboard-style)",
			Category:     "layout",
			Tags:         "[\"breadcrumb\",\"navigation\",\"wayfinding\"]",
			Files:        filesJSON("breadcrumb-01", breadcrumb01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<Breadcrumb items={[{label:\"Projects\",href:\"/projects\"},{label:\"App\"}]} />",
			IsPublic:     true,
		},
		{
			Name:         "page-header-01",
			DisplayName:  "Page Header",
			Description:  "Page header with title, description, optional badge, and action button slot",
			Category:     "layout",
			Tags:         "[\"header\",\"page\",\"title\",\"layout\"]",
			Files:        filesJSON("page-header-01", pageHeader01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<PageHeader title=\"Settings\" description=\"Manage your workspace.\" />",
			IsPublic:     true,
		},
		{
			Name:         "marketing-footer-01",
			DisplayName:  "Marketing Footer",
			Description:  "Footer with 4 column links, brand tagline, and copyright (Vercel-style)",
			Category:     "layout",
			Tags:         "[\"footer\",\"marketing\",\"links\"]",
			Files:        filesJSON("marketing-footer-01", marketingFooter01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<MarketingFooter brand=\"Grit\" />",
			IsPublic:     true,
		},
		{
			Name:         "alert-banner-01",
			DisplayName:  "Alert Banner",
			Description:  "Inline alert/warning/success/error banner with dismiss button",
			Category:     "layout",
			Tags:         "[\"alert\",\"banner\",\"notification\",\"feedback\"]",
			Files:        filesJSON("alert-banner-01", alertBanner01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<AlertBanner variant=\"success\" message=\"Changes saved.\" />",
			IsPublic:     true,
		},
		{
			Name:         "modal-shell-01",
			DisplayName:  "Modal Shell",
			Description:  "Modal dialog shell with Escape close, backdrop, and size variants",
			Category:     "layout",
			Tags:         "[\"modal\",\"dialog\",\"overlay\",\"ui\"]",
			Files:        filesJSON("modal-shell-01", modalShell01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ModalShell title=\"Confirm\" onClose={() => {}}>...</ModalShell>",
			IsPublic:     true,
		},
		{
			Name:         "code-block-01",
			DisplayName:  "Code Block",
			Description:  "Code display block with language badge, copy button, optional line numbers (Vercel docs)",
			Category:     "layout",
			Tags:         "[\"code\",\"syntax\",\"copy\",\"developer\"]",
			Files:        filesJSON("code-block-01", codeBlock01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CodeBlock code=\"grit new my-app\" language=\"bash\" />",
			IsPublic:     true,
		},
		{
			Name:         "stat-card-01",
			DisplayName:  "Stat Card",
			Description:  "Simple KPI stat card with icon, value, and trend indicator (Stripe dashboard)",
			Category:     "layout",
			Tags:         "[\"stat\",\"metric\",\"kpi\",\"dashboard\"]",
			Files:        filesJSON("stat-card-01", statCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<StatCard label=\"Total Revenue\" value=\"$48,352\" trend=\"up\" />",
			IsPublic:     true,
		},
		{
			Name:         "section-header-01",
			DisplayName:  "Section Header",
			Description:  "Centered marketing section header with badge, title, and subtitle",
			Category:     "layout",
			Tags:         "[\"section\",\"heading\",\"marketing\",\"landing\"]",
			Files:        filesJSON("section-header-01", sectionHeader01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SectionHeader badge=\"Features\" title=\"Everything you need\" />",
			IsPublic:     true,
		},
		{
			Name:         "tab-nav-01",
			DisplayName:  "Tab Nav",
			Description:  "Tab navigation bar with badge counts and active indicator (GitHub repo tabs)",
			Category:     "layout",
			Tags:         "[\"tabs\",\"navigation\",\"ui\",\"layout\"]",
			Files:        filesJSON("tab-nav-01", tabNav01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<TabNav defaultTab=\"overview\" />",
			IsPublic:     true,
		},
		{
			Name:         "loading-skeleton-01",
			DisplayName:  "Loading Skeleton",
			Description:  "Animated skeleton placeholder with card and table row presets",
			Category:     "layout",
			Tags:         "[\"skeleton\",\"loading\",\"placeholder\",\"ui\"]",
			Files:        filesJSON("loading-skeleton-01", loadingSkeleton01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CardSkeleton /><TableRowSkeleton cols={4} />",
			IsPublic:     true,
		},
		{
			Name:         "toast-notification-01",
			DisplayName:  "Toast Notification",
			Description:  "Toast with success/error/info/warning variants, action, and dismiss",
			Category:     "layout",
			Tags:         "[\"toast\",\"notification\",\"feedback\",\"ui\"]",
			Files:        filesJSON("toast-notification-01", toastNotification01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<Toast message=\"Saved!\" variant=\"success\" />",
			IsPublic:     true,
		},
		{
			Name:         "data-list-01",
			DisplayName:  "Data List",
			Description:  "Key-value data list / details panel (Stripe invoice details-style)",
			Category:     "layout",
			Tags:         "[\"data\",\"list\",\"details\",\"description\"]",
			Files:        filesJSON("data-list-01", dataList01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<DataList items={[{label:\"Status\",value:\"Active\"}]} />",
			IsPublic:     true,
		},
		{
			Name:         "error-page-01",
			DisplayName:  "Error Page",
			Description:  "404/500 error page with code, message, and back/home navigation",
			Category:     "layout",
			Tags:         "[\"error\",\"404\",\"500\",\"page\"]",
			Files:        filesJSON("error-page-01", errorPage01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<ErrorPage code=\"404\" title=\"Page not found\" />",
			IsPublic:     true,
		},
		{
			Name:         "card-grid-01",
			DisplayName:  "Card Grid",
			Description:  "Responsive 2/3/4-column card grid wrapper with header and action slot",
			Category:     "layout",
			Tags:         "[\"grid\",\"cards\",\"layout\",\"responsive\"]",
			Files:        filesJSON("card-grid-01", cardGrid01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CardGrid title=\"Projects\" columns={3}>...</CardGrid>",
			IsPublic:     true,
		},
		{
			Name:         "floating-action-01",
			DisplayName:  "Floating Action Button",
			Description:  "Fixed floating action button for primary creation actions (Notion-style)",
			Category:     "layout",
			Tags:         "[\"fab\",\"action\",\"button\",\"floating\"]",
			Files:        filesJSON("floating-action-01", floatingAction01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<FloatingActionButton label=\"New\" />",
			IsPublic:     true,
		},
		{
			Name:         "social-proof-bar-01",
			DisplayName:  "Social Proof Bar",
			Description:  "Avatar stack with member count and star rating trust bar",
			Category:     "marketing",
			Tags:         "[\"social-proof\",\"trust\",\"testimonial\",\"avatar\"]",
			Files:        filesJSON("social-proof-bar-01", socialProofBar01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SocialProofBar count=\"50,000+\" />",
			IsPublic:     true,
		},
		{
			Name:         "feature-comparison-01",
			DisplayName:  "Feature Comparison",
			Description:  "Feature comparison table across plans (Linear pricing-style)",
			Category:     "marketing",
			Tags:         "[\"comparison\",\"table\",\"pricing\",\"features\"]",
			Files:        filesJSON("feature-comparison-01", featureComparison01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<FeatureComparison />",
			IsPublic:     true,
		},
		{
			Name:         "announcement-bar-01",
			DisplayName:  "Announcement Bar",
			Description:  "Dismissible top-of-page announcement banner (Vercel-style)",
			Category:     "marketing",
			Tags:         "[\"announcement\",\"banner\",\"bar\",\"notification\"]",
			Files:        filesJSON("announcement-bar-01", announcementBar01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<AnnouncementBar message=\"v2.0 is here\" />",
			IsPublic:     true,
		},
		{
			Name:         "waitlist-form-01",
			DisplayName:  "Waitlist Form",
			Description:  "Pre-launch waitlist signup with position counter and join count",
			Category:     "marketing",
			Tags:         "[\"waitlist\",\"signup\",\"pre-launch\",\"email\"]",
			Files:        filesJSON("waitlist-form-01", waitlistForm01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<WaitlistForm />",
			IsPublic:     true,
		},
		{
			Name:         "case-study-card-01",
			DisplayName:  "Case Study Card",
			Description:  "Customer case study card with metric callout and quote",
			Category:     "marketing",
			Tags:         "[\"case-study\",\"customer\",\"testimonial\",\"social-proof\"]",
			Files:        filesJSON("case-study-card-01", caseStudyCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CaseStudyCard company=\"Acme\" metric=\"10x\" metricLabel=\"faster deploys\" />",
			IsPublic:     true,
		},
		{
			Name:         "roadmap-item-01",
			DisplayName:  "Roadmap Item",
			Description:  "Public roadmap card with status badge and upvote button",
			Category:     "marketing",
			Tags:         "[\"roadmap\",\"upvote\",\"feedback\",\"public\"]",
			Files:        filesJSON("roadmap-item-01", roadmapItem01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<RoadmapItem title=\"Dark mode\" status=\"planned\" votes={142} />",
			IsPublic:     true,
		},
		{
			Name:         "partner-card-01",
			DisplayName:  "Partner Card",
			Description:  "Technology partner showcase card with official badge",
			Category:     "marketing",
			Tags:         "[\"partner\",\"technology\",\"integration\",\"badge\"]",
			Files:        filesJSON("partner-card-01", partnerCard01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<PartnerCard name=\"Vercel\" category=\"Deployment\" />",
			IsPublic:     true,
		},
		{
			Name:         "settings-nav-01",
			DisplayName:  "Settings Nav",
			Description:  "Settings sidebar with grouped navigation sections (Vercel/GitHub-style)",
			Category:     "layout",
			Tags:         "[\"settings\",\"sidebar\",\"navigation\",\"grouped\"]",
			Files:        filesJSON("settings-nav-01", settingsNav01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<SettingsNav />",
			IsPublic:     true,
		},
		{
			Name:         "command-palette-shell-01",
			DisplayName:  "Command Palette Shell",
			Description:  "Full command palette modal with search, groups, and keyboard shortcuts",
			Category:     "layout",
			Tags:         "[\"command\",\"palette\",\"search\",\"keyboard\",\"modal\"]",
			Files:        filesJSON("command-palette-shell-01", commandPaletteShell01TSX),
			Dependencies: "[]",
			RegistryDeps: "[]",
			PreviewCode:  "<CommandPaletteShell isOpen={true} onClose={() => {}} />",
			IsPublic:     true,
		},
	}

	if err := db.Create(&components).Error; err != nil {
		log.Printf("Warning: failed to seed extended Grit UI components: %v", err)
	} else {
		log.Printf("Seeded %d extended Grit UI components", len(components))
	}
}
