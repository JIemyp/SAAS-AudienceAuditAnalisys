import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-16 items-center justify-between border-b border-border px-6 lg:px-12">
        <div className="flex items-center gap-2 font-bold text-xl text-text-primary">
          <div className="h-8 w-8 rounded-lg bg-accent" />
          AudienceAudit
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            Sign In
          </Link>
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
            Understand your audience <br />
            <span className="text-accent">like never before</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-text-secondary max-w-2xl mx-auto">
            AI-powered tool for comprehensive target audience research.
            Generate detailed analysis including segments, pain points, and deep triggers in minutes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" asChild>
              <Link href="/login">
                Start Research <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="lg">
              Learn more
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
