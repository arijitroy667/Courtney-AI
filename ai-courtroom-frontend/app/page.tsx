import Link from "next/link"
import { Shield, Scale, Gavel, Cpu, ArrowRight, Zap, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">AI COURTROOM</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How it Works
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
            >
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:flex">
              Login
            </Button>
            <Button className="bg-primary hover:bg-primary/90">Connect Wallet</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="container relative z-10 flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary px-3 py-1">
              Web3 Native AI Governance
            </Badge>
            <h1 className="max-w-4xl text-balance text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Decentralized <span className="text-primary italic">Deliberation</span> for Complex Decisions
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              Orchestrate a council of AI agents to debate, analyze, and render verdicts on any prompt. Transparent,
              verifiable, and governed by the digital gavel.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                asChild
              >
                <Link href="/dashboard">
                  Enter Courtroom <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-border hover:bg-accent transition-all bg-transparent"
              >
                View Documentation
              </Button>
            </div>
          </div>

          {/* Animated Background Element */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(104,42,216,0.1),transparent_70%)]" />
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Platform Features</h2>
              <p className="mt-4 text-muted-foreground">The digital architecture of high-stakes AI reasoning.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="flex flex-col justify-between p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Multi-Agent Consensus</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Deploy multiple specialized LLM agents that deliberate simultaneously to minimize bias.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col justify-between p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Gavel className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">The Digital Gavel</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    A master Judge agent orchestrates the debate and renders a final, authoritative verdict.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col justify-between p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Verifiable Proofs</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Every session is hashed and stored on-chain, providing immutable audit trails.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-2xl">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold sm:text-4xl">Ready to enter the court?</h2>
                <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl mx-auto">
                  Join the forefront of AI deliberation. Connect your wallet and start your first session.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                  <Button size="lg" variant="secondary" className="h-12 px-8 font-semibold shadow-lg" asChild>
                    <Link href="/dashboard">Launch App</Link>
                  </Button>
                </div>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_107%,rgba(255,255,255,0.1),transparent_30%),radial-gradient(circle_at_90%_-10%,rgba(255,255,255,0.1),transparent_40%)]" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 py-12">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-bold">AI COURTROOM</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 AI Courtroom. Built for the decentralized future.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Zap className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <History className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
