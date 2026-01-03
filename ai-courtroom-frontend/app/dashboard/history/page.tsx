"use client"

import { Scale, Search, Filter, ExternalLink, Download, ArrowLeft, TrendingUp, DollarSign, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { Suspense } from "react"

const analyticsData = [
  { name: "Counselor GPT", cost: 12.45, sessions: 42 },
  { name: "Claude-Juris", cost: 8.12, sessions: 28 },
  { name: "Llama-Lex", cost: 4.56, sessions: 15 },
  { name: "System Oracle", cost: 2.34, sessions: 85 },
]

const historyData = [
  {
    id: "PROMPT-01",
    title: "Ethical Implementation Framework",
    date: "2025-12-30",
    verdict: "Defense",
    confidence: "94%",
    cost: "$1.20",
    status: "Completed",
  },
  {
    id: "PROMPT-02",
    title: "Security Protocol Optimization",
    date: "2025-12-29",
    verdict: "Prosecution",
    confidence: "88%",
    cost: "$0.85",
    status: "Completed",
  },
  {
    id: "PROMPT-03",
    title: "Smart Contract Logic Review",
    date: "2025-12-28",
    verdict: "Defense",
    confidence: "91%",
    cost: "$2.10",
    status: "Completed",
  },
  {
    id: "PROMPT-04",
    title: "Tokenomics Fairness Assessment",
    date: "2025-12-27",
    verdict: "Inconclusive",
    confidence: "62%",
    cost: "$1.50",
    status: "Failed",
  },
]

function HistoryContent() {
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
              <span className="font-bold">SESSION HISTORY</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 border-primary/20 hover:bg-primary/10 bg-transparent">
              <Download className="mr-2 h-4 w-4" /> Export All
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Sessions</p>
                <h3 className="text-3xl font-bold">170</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Spend</p>
                <h3 className="text-3xl font-bold">$27.47</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Avg. Deliberation</p>
                <h3 className="text-3xl font-bold">42s</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* History Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Recent Verdicts</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search sessions..." className="pl-9 bg-muted/30 border-border/50" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card className="border-border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Case Title</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((session) => (
                    <TableRow key={session.id} className="group cursor-pointer">
                      <TableCell className="font-mono text-xs font-bold text-primary">{session.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{session.title}</span>
                          <span className="text-[10px] text-muted-foreground">{session.date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            session.verdict === "Defense"
                              ? "secondary"
                              : session.verdict === "Prosecution"
                                ? "destructive"
                                : "outline"
                          }
                          className="h-5 px-2 text-[10px] uppercase font-bold tracking-tighter"
                        >
                          {session.verdict}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: session.confidence }} />
                          </div>
                          <span className="text-xs font-medium">{session.confidence}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <div className="flex items-center justify-end gap-2 group-hover:hidden">{session.cost}</div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hidden group-hover:inline-flex" asChild>
                          <Link href="/dashboard/deliberation">
                            <ExternalLink className="h-4 w-4 text-primary" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Analytics Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Agent Analytics</h2>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Spend by Agent
                </CardTitle>
                <CardDescription>Contribution to session costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <p className="text-xs font-bold">{payload[0].payload.name}</p>
                                <p className="text-xs text-primary">${payload[0].value}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                        {analyticsData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? "oklch(0.65 0.20 280)" : "oklch(0.25 0.01 276)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4 pt-4 border-t border-border mt-4">
                  {analyticsData.map((agent) => (
                    <div key={agent.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${agent.name === "Counselor GPT" ? "bg-primary" : "bg-muted"}`}
                        />
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">${agent.cost}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary border-none text-primary-foreground shadow-lg shadow-primary/20">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold">Upgrade to Premium Counsel</h3>
                <p className="text-xs opacity-80 leading-relaxed">
                  Unlock specialized legal agents and higher-fidelity deliberation models for complex enterprise cases.
                </p>
                <Button variant="secondary" className="w-full h-8 text-xs font-bold">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={null}>
      <HistoryContent />
    </Suspense>
  )
}
