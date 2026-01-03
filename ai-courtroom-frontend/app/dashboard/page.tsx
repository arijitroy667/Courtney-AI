import { Scale, Users, Wallet, Play, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { AgentCard } from "@/components/agent-card"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-bold">COURTROOM DASHBOARD</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">0.42 ETH</span>
            </div>
            <Button size="sm" className="h-8">
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Config */}
        <div className="lg:col-span-7 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">The Case</h2>
              <Badge variant="secondary" className="font-mono">
                PROMPT-01
              </Badge>
            </div>
            <Card className="border-primary/20 shadow-lg shadow-primary/5">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Main Argument / Prompt</label>
                  <Textarea
                    placeholder="Enter the scenario or decision that needs deliberation..."
                    className="min-h-[200px] bg-muted/30 border-border/50 focus:border-primary/50 transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Context Type</label>
                    <Input placeholder="e.g. Legal, Technical, Ethics" className="bg-muted/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Complexity Level</label>
                    <div className="pt-2">
                      <Slider defaultValue={[50]} max={100} step={1} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Session Budget</h2>
              <div className="flex items-center gap-2 text-primary font-mono font-bold">
                $1.20 <span className="text-xs text-muted-foreground font-normal">Est. Cost</span>
              </div>
            </div>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 flex items-center justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Maximum Spend Limit</span>
                    <span className="font-bold">$5.00</span>
                  </div>
                  <Slider defaultValue={[20]} max={100} step={5} className="py-2" />
                </div>
                <Button size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                  <Play className="mr-2 h-5 w-5 fill-current" /> Commence Trial
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Right Column: Agents */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">The Legal Council</h2>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
              <Users className="mr-2 h-4 w-4" /> Add Agent
            </Button>
          </div>

          <div className="grid gap-4">
            <AgentCard
              name="Counselor GPT"
              role="Lead Defense"
              model="GPT-4o"
              status="active"
              weight={75}
              avatar="/ai-avatar-1.jpg"
            />
            <AgentCard
              name="Claude-Juris"
              role="Prosecutor"
              model="Claude 3.5 Sonnet"
              status="active"
              weight={60}
              avatar="/ai-avatar-2.jpg"
            />
            <AgentCard
              name="Llama-Lex"
              role="Neutral Observer"
              model="Llama 3.1 405B"
              status="idle"
              weight={40}
              avatar="/ai-avatar-3.jpg"
            />
          </div>

          <Card className="border-dashed bg-transparent border-muted-foreground/30">
            <CardContent className="p-6 text-center text-muted-foreground space-y-2">
              <Info className="h-5 w-5 mx-auto opacity-50" />
              <p className="text-sm">
                Each agent contributes to the final deliberation. Weighting adjusts their influence on the Judge's
                verdict.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
