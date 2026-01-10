"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Scale,
  Gavel,
  Cpu,
  ArrowRight,
  Zap,
  History,
  Wallet,
  Brain,
  Users,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/components/wallet_connect";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { AnimatedBackground } from "@/components/ui/background-motion";

export default function LandingPage() {
  const { address, connect, isConnecting } = useWallet();
  const router = useRouter();

  const handleEnterCourtroom = async () => {
    if (!address) {
      await connect();
    } else {
      router.push("/dashboard");
    }
  };

  const features = [
    {
      icon: Cpu,
      title: "Multi-Agent Consensus",
      description:
        "Deploy multiple specialized LLM agents that deliberate simultaneously to minimize bias and maximize insight.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Gavel,
      title: "The Digital Gavel",
      description:
        "A master orchestrator agent manages the debate flow and renders authoritative, well-reasoned verdicts.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Shield,
      title: "Verifiable Proofs",
      description:
        "Every session is cryptographically secured and stored on-chain for immutable audit trails.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Brain,
      title: "Adaptive Learning",
      description:
        "Agents learn from each round, refining their arguments based on peer responses and user feedback.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Users,
      title: "Community Governance",
      description:
        "Token holders can propose new agents, voting mechanisms, and protocol upgrades.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Lock,
      title: "Privacy First",
      description:
        "Your prompts and deliberations remain encrypted and accessible only to you.",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Connect Wallet",
      description:
        "Link your Web3 wallet to authenticate and access the courtroom.",
    },
    {
      step: "02",
      title: "Submit Your Case",
      description:
        "Present your prompt or question for the AI council to deliberate.",
    },
    {
      step: "03",
      title: "Watch the Debate",
      description:
        "Observe as AI agents analyze, argue, and refine their positions.",
    },
    {
      step: "04",
      title: "Receive Verdict",
      description:
        "Get a comprehensive verdict with confidence scores and reasoning.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Courtney AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              How it Works
            </Link>

            {/* RNG link added to landing navbar */}
            <Link
              href="/dashboard/rng"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              RNG
            </Link>

            {address && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
            )}
          </nav>

          <ConnectWalletButton />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background - now with proper z-index */}
          <div className="absolute inset-0 z-0">
            <AnimatedBackground />
          </div>

          {/* Content - above background */}
          <div className="container relative z-10 flex flex-col items-center text-center px-4 py-20">
            <Badge
              variant="outline"
              className="mb-6 border-primary/50 text-primary px-4 py-1.5 backdrop-blur-sm bg-background/50"
            >
              <Sparkles className="h-3 w-3 mr-2" />
              Web3 Native AI Governance
            </Badge>

            <h1 className="max-w-4xl text-balance text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Decentralized{" "}
              <span className="text-primary italic relative">
                Deliberation
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                >
                  <path
                    d="M0 4C50 4 50 7 100 7C150 7 150 1 200 1"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary/30"
                  />
                </svg>
              </span>
              <br />
              for Complex Decisions
            </h1>

            <p className="mt-8 max-w-2xl text-pretty text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Orchestrate a council of AI agents to debate, analyze, and render
              verdicts on any prompt.
              <span className="text-foreground font-medium">
                {" "}
                Transparent, verifiable, and governed by the digital gavel.
              </span>
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="h-14 px-10 text-base font-semibold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
                onClick={handleEnterCourtroom}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Connecting...
                  </>
                ) : address ? (
                  <>
                    Enter Courtroom <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet to Enter
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 text-base font-semibold border-border/50 hover:bg-accent/50 transition-all bg-background/50 backdrop-blur-sm"
              >
                View Documentation
              </Button>
            </div>

            {!address && (
              <p className="mt-6 text-sm text-muted-foreground flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full backdrop-blur-sm">
                <Wallet className="h-4 w-4" />
                Connect your wallet to access the courtroom
              </p>
            )}

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
                <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 lg:py-32 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Platform Capabilities
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                The digital architecture of high-stakes AI reasoning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="group relative flex flex-col p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div
                      className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${feature.bgColor} ${feature.color} transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 lg:py-32">
          <div className="container px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Process
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Four simple steps to AI-powered deliberation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Connector line */}
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-primary/10" />
                  )}

                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl font-bold mb-6 relative">
                      {step.step}
                      <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 lg:py-32">
          <div className="container px-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 px-8 py-16 lg:py-24 text-center text-primary-foreground shadow-2xl">
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                  Ready to Enter the Court?
                </h2>
                <p className="mt-6 text-lg text-primary-foreground/80 max-w-xl mx-auto">
                  Join the forefront of AI deliberation. Connect your wallet and
                  start your first session today.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 px-10 font-semibold shadow-xl hover:-translate-y-0.5 transition-all"
                    onClick={handleEnterCourtroom}
                  >
                    {address ? (
                      <>
                        Launch App <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-5 w-5" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Background decorations */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
              <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 py-12">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-6 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-bold">Courtney AI</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            © 2025 Courtney AI. Built for the decentralized future.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <Zap className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <History className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
