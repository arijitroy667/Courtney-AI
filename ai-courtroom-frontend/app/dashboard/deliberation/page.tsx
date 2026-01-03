"use client"

import { useState, useEffect } from "react"
import { Scale, Gavel, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function DeliberationPage() {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<"opening" | "deliberating" | "verdict">("opening")

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer)
          return 100
        }
        const newProgress = oldProgress + 1
        if (newProgress > 30 && newProgress < 80) setStage("deliberating")
        if (newProgress >= 90) setStage("verdict")
        return newProgress
      })
    }, 50)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-bold">IN SESSION</span>
            </div>
          </div>
          <Badge variant="outline" className="animate-pulse border-primary text-primary">
            {stage === "verdict" ? "VERDICT RENDERED" : "DELIBERATING..."}
          </Badge>
        </div>
      </header>

      <main className="container py-8 max-w-4xl mx-auto space-y-8">
        {/* Deliberation Status */}
        <section className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight font-serif italic">Case Deliberation: PROMPT-01</h1>
          <div className="space-y-2 max-w-md mx-auto">
            <div className="flex justify-between text-xs font-mono uppercase text-muted-foreground tracking-widest">
              <span>{stage.replace("-", " ")}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-muted border border-border/50" />
          </div>
        </section>

        {/* The Timeline / Deliberation Log */}
        <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-border/50 before:z-0">
          <TimelineItem
            title="Opening Statements"
            agent="System Oracle"
            time="09:00:01"
            status="complete"
            content="Initializing case parameters and aligning agent weights. Counselor GPT and Claude-Juris are preparing initial positions."
          />
          <TimelineItem
            title="Cross-Examination"
            agent="Counselor GPT"
            time="09:00:15"
            status={progress > 40 ? "complete" : "active"}
            content="Counselor GPT argues for a lenient interpretation based on the ethical context provided. Citing precedent from Session-H24."
          />
          <TimelineItem
            title="Prosecution Rebuttal"
            agent="Claude-Juris"
            time="09:00:42"
            status={progress > 70 ? "complete" : progress > 40 ? "active" : "pending"}
            content="Claude-Juris highlights potential technical risks and security vulnerabilities in the proposed solution. Demanding higher verification."
          />

          {stage === "verdict" && (
            <div className="pl-12 pt-4 animate-in fade-in slide-in-from-top-4 duration-1000">
              <Card className="border-primary bg-primary/5 shadow-2xl shadow-primary/20 overflow-hidden">
                <div className="bg-primary px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary-foreground font-bold">
                    <Gavel className="h-5 w-5" /> THE VERDICT
                  </div>
                  <Badge variant="secondary" className="bg-white text-primary hover:bg-white">
                    94% CONFIDENCE
                  </Badge>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight font-serif italic text-primary">
                      In Favor of the Defense
                    </h2>
                    <p className="text-lg leading-relaxed text-foreground/90">
                      "After thorough deliberation, the council finds the proposed ethical framework sufficient for the
                      technical implementation, provided that additional audit layers are implemented as suggested by
                      Claude-Juris."
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Integrity Score
                        </p>
                        <p className="text-lg font-bold">HIGH (98/100)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Risk Rating</p>
                        <p className="text-lg font-bold">LOW (12%)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 bg-primary hover:bg-primary/90">Mint Verdict NFT</Button>
                    <Button variant="outline" className="flex-1 border-primary/20 hover:bg-primary/10 bg-transparent">
                      Download Full Transcript
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function TimelineItem({
  title,
  agent,
  time,
  status,
  content,
}: {
  title: string
  agent: string
  time: string
  status: "complete" | "active" | "pending"
  content: string
}) {
  return (
    <div
      className={`relative pl-12 transition-all duration-500 ${status === "pending" ? "opacity-30" : "opacity-100"}`}
    >
      <div
        className={`absolute left-0 top-1 h-8 w-8 rounded-full border-2 flex items-center justify-center z-10 bg-background transition-colors
        ${status === "complete" ? "border-primary text-primary" : status === "active" ? "border-accent text-accent animate-pulse" : "border-muted text-muted"}`}
      >
        {status === "complete" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <Card className={`border-none bg-muted/30 shadow-none ${status === "active" ? "ring-1 ring-accent" : ""}`}>
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">{agent}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
            {status === "active" && (
              <Badge variant="outline" className="text-[10px] h-4 border-accent text-accent">
                TYPING...
              </Badge>
            )}
          </div>
          <CardTitle className="text-sm font-bold mt-1">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        </CardContent>
      </Card>
    </div>
  )
}
