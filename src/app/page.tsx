"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  Target,
  Brain,
  Zap,
  Users,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Layers,
  Shield,
  Lightbulb,
  DollarSign,
  Menu,
  X
} from "lucide-react";

// Animated counter
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target, isVisible]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Method card
function MethodCard({ icon: Icon, title, description, color }: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group relative p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10
                    hover:bg-white/10 hover:border-white/20
                    transition-all duration-300 backdrop-blur-sm">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4
                       group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}

// Use case card
function UseCaseCard({ title, description, metrics }: {
  title: string;
  description: string;
  metrics: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-white/60 mb-4">{description}</p>
      <div className="text-sm font-mono text-cyan-400">{metrics}</div>
    </div>
  );
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-cyan-500/20 rounded-full blur-[80px] sm:blur-[120px] -top-20 sm:-top-40 -left-20 sm:-left-40 animate-pulse" />
        <div className="absolute w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-rose-500/20 rounded-full blur-[80px] sm:blur-[120px] top-1/3 -right-20 sm:-right-40 animate-pulse"
             style={{ animationDelay: "1s" }} />
        <div className="absolute w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-violet-500/20 rounded-full blur-[80px] sm:blur-[120px] bottom-1/4 left-1/4 animate-pulse"
             style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrollY > 50 || mobileMenuOpen
            ? "bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/images/logo.png"
                alt="AudienceAudit"
                width={140}
                height={76}
                className="h-8 sm:h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#problem" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Problem
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#methods" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Methods
              </a>
              <Link
                href="/login"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-semibold rounded-full
                           bg-gradient-to-r from-cyan-400 to-rose-400 text-[#0a0a0f]
                           hover:shadow-lg hover:shadow-cyan-400/25 transition-all duration-300
                           hover:scale-105 active:scale-95"
              >
                Start Free
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0f]/98 backdrop-blur-xl border-t border-white/5">
            <nav className="flex flex-col p-4 gap-2">
              <a
                href="#problem"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Problem
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                How It Works
              </a>
              <a
                href="#methods"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Methods
              </a>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 px-4 py-3 text-base font-semibold rounded-lg text-center
                           bg-gradient-to-r from-cyan-400 to-rose-400 text-[#0a0a0f]"
              >
                Start Free
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-16 sm:pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-32 w-full">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                              bg-white/5 border border-white/10 backdrop-blur-sm mb-6 sm:mb-8">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-xs sm:text-sm text-white/70">
                  AI-Powered Audience Analysis in Minutes
                </span>
              </div>

              {/* Main headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 sm:mb-8">
                Understanding Your Audience{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                  Is Hard
                </span>
              </h1>

              <p className="text-lg sm:text-xl lg:text-2xl text-white/60 leading-relaxed mb-8 sm:mb-10 max-w-3xl mx-auto">
                Even experienced marketers spend weeks on research.
                And still miss the mark with messaging.
                <span className="block mt-4 text-white/80">
                  We solved this problem with AI.
                </span>
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16">
                <Link
                  href="/login"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2
                             px-8 py-4 font-semibold text-lg rounded-xl
                             bg-gradient-to-r from-cyan-400 to-rose-400 text-[#0a0a0f]
                             hover:shadow-xl hover:shadow-cyan-400/30
                             transition-all duration-500 hover:scale-105"
                >
                  Try It Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4
                             text-white/70 hover:text-white border border-white/20 rounded-xl
                             hover:bg-white/5 transition-all"
                >
                  How It Works
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                    <AnimatedNumber target={10} suffix="+" />
                  </div>
                  <div className="text-xs sm:text-sm text-white/50">Methodologies</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-rose-400">30 min</div>
                  <div className="text-xs sm:text-sm text-white/50">Instead of Weeks</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-violet-400">
                    <AnimatedNumber target={100} suffix="%" />
                  </div>
                  <div className="text-xs sm:text-sm text-white/50">Detailed Insights</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why understand audience section */}
        <section id="problem" className="py-16 sm:py-24 lg:py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            {/* Section header */}
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-block px-3 py-1 rounded-full bg-rose-400/10 border border-rose-400/20 mb-4">
                <span className="text-xs text-rose-400 uppercase tracking-wider font-mono">Why Understand Your Audience?</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Audience Knowledge = <span className="text-rose-400">Conversions</span>
              </h2>
            </div>

            {/* The formula explanation */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 mb-16 sm:mb-24">
              {/* Left - Why it matters */}
              <div className="space-y-6">
                <h3 className="text-2xl sm:text-3xl font-semibold">
                  Why Is This Critical?
                </h3>
                <p className="text-lg text-white/70 leading-relaxed">
                  Every customer touchpoint must be <strong className="text-white">personal</strong>.
                  Not &quot;for everyone&quot;, but specifically for each segment with their unique pains, fears, and desires.
                </p>

                <div className="space-y-4 pt-4">
                  {[
                    { icon: Target, text: "Hit audience pain points precisely", color: "text-cyan-400" },
                    { icon: MessageSquare, text: "Language and tone that resonates", color: "text-rose-400" },
                    { icon: Lightbulb, text: "Creatives that grab attention", color: "text-violet-400" },
                    { icon: TrendingUp, text: "Landing pages with high conversions", color: "text-green-400" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <item.icon className={`h-6 w-6 ${item.color} shrink-0`} />
                      <span className="text-white/80">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - The equation */}
              <div className="flex items-center">
                <div className="w-full p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center">The Success Formula</h3>

                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-[100px] p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-center">
                      <Target className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                      <div className="font-semibold">Audience</div>
                    </div>
                    <span className="text-2xl text-white/30">+</span>
                    <div className="flex-1 min-w-[100px] p-4 rounded-xl bg-rose-400/10 border border-rose-400/20 text-center">
                      <Zap className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                      <div className="font-semibold">Pain</div>
                    </div>
                    <span className="text-2xl text-white/30">=</span>
                    <div className="flex-1 min-w-[100px] p-4 rounded-xl bg-violet-400/10 border border-violet-400/20 text-center">
                      <MessageSquare className="h-8 w-8 text-violet-400 mx-auto mb-2" />
                      <div className="font-semibold">Creative</div>
                    </div>
                  </div>

                  <div className="flex justify-center my-4">
                    <ArrowRight className="h-8 w-8 text-white/30 rotate-90" />
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-400/20 to-rose-400/20 border border-cyan-400/30 text-center">
                    <TrendingUp className="h-10 w-10 text-cyan-400 mx-auto mb-2" />
                    <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-rose-400 bg-clip-text text-transparent">
                      High Conversion
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What you need to know */}
            <div className="text-center mb-12">
              <h3 className="text-2xl sm:text-3xl font-semibold mb-4">
                What Do You Need to Know About Your Audience?
              </h3>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                It&apos;s not just demographics. It&apos;s deep understanding of customer psychology.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: Brain, title: "What They Think", desc: "Fears, doubts, objections", color: "bg-violet-500" },
                { icon: MessageSquare, title: "How They Speak", desc: "Tone, slang, terminology", color: "bg-cyan-500" },
                { icon: Target, title: "What Grabs Them", desc: "Attention and interest triggers", color: "bg-rose-500" },
                { icon: Zap, title: "What Motivates", desc: "Purchase decision drivers", color: "bg-amber-500" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Providers Section */}
        <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                <span className="text-xs text-white/70 uppercase tracking-wider font-mono">
                  Powered by AI
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Best AI Models<br />
                <span className="bg-gradient-to-r from-cyan-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                  In One Tool
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
                Where else can you get so much knowledge about your audience if not from AI?
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
              {/* Claude */}
              <div className="group p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10
                              hover:bg-violet-500/10 hover:border-violet-500/30
                              transition-all duration-300">
                <div className="flex items-center gap-4 mb-4 sm:mb-6">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-violet-500/20 flex items-center justify-center
                                  group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-6 sm:h-7 w-6 sm:w-7 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg sm:text-xl">Claude</h3>
                    <p className="text-sm text-white/50">Anthropic</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                  Deep contextual analysis. Ideal for psychographic portraits.
                </p>
              </div>

              {/* GPT */}
              <div className="group p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10
                              hover:bg-emerald-500/10 hover:border-emerald-500/30
                              transition-all duration-300">
                <div className="flex items-center gap-4 mb-4 sm:mb-6">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center
                                  group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-6 sm:h-7 w-6 sm:w-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg sm:text-xl">GPT-4</h3>
                    <p className="text-sm text-white/50">OpenAI</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                  Structured analysis. Finds patterns and connections in data.
                </p>
              </div>

              {/* Gemini */}
              <div className="group p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10
                              hover:bg-blue-500/10 hover:border-blue-500/30
                              transition-all duration-300">
                <div className="flex items-center gap-4 mb-4 sm:mb-6">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-blue-500/20 flex items-center justify-center
                                  group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-6 sm:h-7 w-6 sm:w-7 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg sm:text-xl">Gemini</h3>
                    <p className="text-sm text-white/50">Google</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                  Multimodal insights. Fresh perspective on data.
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-white/50 text-sm">
                Use built-in models or connect your own API key
              </p>
            </div>
          </div>
        </section>

        {/* How it works - Cascade */}
        <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 mb-4">
                <span className="text-xs text-cyan-400 uppercase tracking-wider font-mono">How It Works</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Cascading Knowledge Base
              </h2>
              <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto">
                Each analysis stage enriches understanding. Data accumulates and refines —
                <span className="text-white"> the model learns specifically from your niche</span>.
              </p>
            </div>

            {/* Process steps */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 sm:mb-24">
              {[
                {
                  step: "01",
                  title: "Product Description",
                  desc: "Tell us about your product, niche, and competitors",
                  icon: Layers
                },
                {
                  step: "02",
                  title: "AI Segment Generation",
                  desc: "System creates hypotheses about your audience",
                  icon: Brain
                },
                {
                  step: "03",
                  title: "Deep Analysis",
                  desc: "JTBD, pains, triggers, barriers for each segment",
                  icon: Target
                },
                {
                  step: "04",
                  title: "Validation & Refinement",
                  desc: "Your feedback makes the analysis even more accurate",
                  icon: CheckCircle2
                },
              ].map((item, i) => (
                <div key={i} className="relative group">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10
                                  hover:bg-white/10 transition-all h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20
                                      flex items-center justify-center font-mono text-cyan-400 font-bold text-lg">
                        {item.step}
                      </div>
                      <item.icon className="h-6 w-6 text-white/40" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                    <p className="text-sm text-white/60">{item.desc}</p>
                  </div>

                  {/* Arrow connector - only on larger screens */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="h-6 w-6 text-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Key benefit */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-cyan-400/10 to-rose-400/10 border border-white/10 text-center">
              <p className="text-lg sm:text-xl text-white/80 mb-2">
                The more data you input, the more accurate the analysis becomes
              </p>
              <p className="text-white/50">
                Knowledge base grows with each project in your niche
              </p>
            </div>
          </div>
        </section>

        {/* Methodologies Section */}
        <section id="methods" className="py-16 sm:py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-block px-3 py-1 rounded-full bg-violet-400/10 border border-violet-400/20 mb-4">
                <span className="text-xs text-violet-400 uppercase tracking-wider font-mono">Methodologies</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                10+ Proven Methodologies
              </h2>
              <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
                Combining best practices from marketing research
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <MethodCard
                icon={Users}
                title="Jobs-to-be-Done"
                description="What tasks does the customer solve with your product?"
                color="bg-cyan-500"
              />
              <MethodCard
                icon={Layers}
                title="Value Proposition Canvas"
                description="Audience pains and gains. What to offer for maximum resonance?"
                color="bg-rose-500"
              />
              <MethodCard
                icon={Brain}
                title="Psychographics"
                description="Values, fears, motivations, and lifestyle of each segment"
                color="bg-violet-500"
              />
              <MethodCard
                icon={Zap}
                title="Triggers & Barriers"
                description="What triggers purchase decision and what blocks it?"
                color="bg-amber-500"
              />
              <MethodCard
                icon={BarChart3}
                title="Competitive Analysis"
                description="How competitors position and where's your uniqueness?"
                color="bg-emerald-500"
              />
              <MethodCard
                icon={DollarSign}
                title="Pricing Psychology"
                description="How the audience perceives price and product value?"
                color="bg-blue-500"
              />
              <MethodCard
                icon={MessageSquare}
                title="Channel Strategy"
                description="Where to find your audience and how to communicate?"
                color="bg-pink-500"
              />
              <MethodCard
                icon={Shield}
                title="Trust Framework"
                description="How to build trust with each audience segment?"
                color="bg-indigo-500"
              />
              <MethodCard
                icon={Target}
                title="JTBD Context"
                description="The context in which customer 'hires' your product"
                color="bg-teal-500"
              />
            </div>
          </div>
        </section>

        {/* Value proposition */}
        <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-cyan-400/10 via-violet-400/10 to-rose-400/10
                            border border-white/10 relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-400/20 rounded-full blur-[100px]" />

              <div className="relative text-center max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
                  Your Product Knowledge +<br />
                  Target Audience Understanding +<br />
                  <span className="bg-gradient-to-r from-cyan-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                    Our AI Technology
                  </span>
                </h2>

                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold my-8 text-cyan-400">
                  = 1000% Efficiency
                </div>

                <p className="text-lg text-white/60 mb-8">
                  This isn&apos;t just a number. It&apos;s the real result of deep audience understanding —
                  when every message hits the target.
                </p>

                <Link
                  href="/login"
                  className="group inline-flex items-center gap-3 px-10 py-5 font-semibold text-lg rounded-2xl
                             bg-gradient-to-r from-cyan-400 to-rose-400 text-[#0a0a0f]
                             hover:shadow-2xl hover:shadow-cyan-400/40
                             transition-all duration-500 hover:scale-105"
                >
                  Try It Free
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-16 sm:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Who Is This Tool For?
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <UseCaseCard
                title="Marketers"
                description="Deep audience understanding for precise creatives and strategies"
                metrics="→ Ad ROI +200%"
              />
              <UseCaseCard
                title="Entrepreneurs"
                description="Quick idea validation and market understanding"
                metrics="→ Research time -80%"
              />
              <UseCaseCard
                title="Copywriters"
                description="Language and tone that resonates with audience"
                metrics="→ Copy conversion +150%"
              />
              <UseCaseCard
                title="Product Managers"
                description="Feature prioritization based on real needs"
                metrics="→ Product-market fit"
              />
              <UseCaseCard
                title="Agencies"
                description="Scalable research for clients"
                metrics="→ Margin +40%"
              />
              <UseCaseCard
                title="Startups"
                description="From hypothesis to market understanding in hours"
                metrics="→ Time-to-insight -90%"
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/10 via-transparent to-transparent" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center relative">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6">
              Ready to Understand<br />
              <span className="bg-gradient-to-r from-cyan-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                Your Audience?
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-white/60 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Start for free. First analysis is on us.
              Sign up in 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3
                           px-10 sm:px-12 py-5 font-semibold text-lg sm:text-xl rounded-2xl
                           bg-gradient-to-r from-cyan-400 to-rose-400 text-[#0a0a0f]
                           hover:shadow-2xl hover:shadow-cyan-400/40
                           transition-all duration-500 hover:scale-105"
              >
                Start Free
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/40">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 sm:py-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="AudienceAudit"
              width={120}
              height={65}
              className="h-6 sm:h-8 w-auto"
            />
            <span className="text-sm text-white/30">© 2025</span>
          </div>

          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
