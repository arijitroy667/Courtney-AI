"use client";
import { useState, useEffect } from "react";
import {
  Scale,
  Gavel,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Brain,
  Target,
  Download,
  FileText,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ScrollArea";
import Link from "next/link";
import { useWallet } from "@/components/wallet_connect";
import { api, AgentResponse } from "@/lib/api";
import { useRouter } from "next/navigation";

interface SessionState {
  round: number;
  responses: {
    gpt: AgentResponse;
    grok: AgentResponse;
    gemini: AgentResponse;
  } | null;
  confidenceScores: number[][];
  userBoost: number[];
  stage: "loading" | "responses" | "verdict";
}

interface VerdictData {
  wallet: string;
  verdict: {
    content: string;
    confidence_score: number;
    reason: string;
    winner: string;
    scores: {
      gpt: number;
      grok: number;
      gemini: number;
    };
  };
  sealed: boolean;
}

const agentInfo = {
  gpt: {
    name: "GPT",
    avatar: "/gpt-avatar.png",
    color: "text-green-500",
    bgColor: "bg-green-500",
  },
  grok: {
    name: "Grok",
    avatar: "/grok-avatar.png",
    color: "text-blue-500",
    bgColor: "bg-blue-500",
  },
  gemini: {
    name: "Gemini",
    avatar: "/gemini-avatar.png",
    color: "text-purple-500",
    bgColor: "bg-purple-500",
  },
};

export default function DeliberationPage() {
  const { address } = useWallet();
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({
    round: 0,
    responses: null,
    confidenceScores: [],
    userBoost: [0, 0, 0],
    stage: "loading",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!address) {
        router.push("/dashboard");
        return;
      }

      setSession((prev) => ({ ...prev, stage: "loading" }));

      // Get session from localStorage
      const storedSession = localStorage.getItem("currentSession");

      if (storedSession) {
        try {
          const data = JSON.parse(storedSession);
          setSession({
            round: data.round,
            responses: data.responses,
            confidenceScores: data.confidence_scores,
            userBoost: [0, 0, 0],
            stage: "responses",
          });
        } catch (err) {
          console.error("Error parsing session:", err);
          router.push("/dashboard");
        }
      } else {
        // No session found, redirect to dashboard
        router.push("/dashboard");
      }
    };

    fetchSession();
  }, [address, router]);

  const handleDiscussionRound = async () => {
    if (!address) return;
    setLoading(true);
    setSession((prev) => ({ ...prev, stage: "loading" }));

    try {
      const response = await api.discuss(
        address,
        session.round + 1,
        session.userBoost
      );
      setSession({
        round: response.round,
        responses: response.responses,
        confidenceScores: response.confidence_scores,
        userBoost: [0, 0, 0],
        stage: "responses",
      });
    } catch (err) {
      console.error(err);
      setSession((prev) => ({ ...prev, stage: "responses" }));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVerdict = async () => {
  if (!address) return;
  setLoading(true);
  setSession((prev) => ({ ...prev, stage: "loading" }));

  try {
    const verdictData = await api.verdict(address);
    console.log("Verdict data received:", verdictData); // Debug log
    
    // Store verdict data for display
    localStorage.setItem("verdictData", JSON.stringify(verdictData));
    
    // Clear the current session from localStorage since it's sealed
    localStorage.removeItem("currentSession");
    
    // Force state update to show verdict
    setSession((prev) => ({ ...prev, stage: "verdict" }));
  } catch (err) {
    console.error("Verdict error:", err);
    setSession((prev) => ({ ...prev, stage: "responses" }));
  } finally {
    setLoading(false);
  }
};

  const handleBoostChange = (index: number, value: number[]) => {
    const newBoost = [...session.userBoost];
    newBoost[index] = value[0] / 100;
    setSession((prev) => ({ ...prev, userBoost: newBoost }));
  };

  if (!address) return null;

  return (
    <main className="container py-8 max-w-7xl mx-auto space-y-8">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Session in Progress</h1>
            <p className="text-sm text-muted-foreground">
              {address.slice(0, 8)}...{address.slice(-6)}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            session.stage === "loading"
              ? "animate-pulse border-primary text-primary"
              : session.stage === "verdict"
              ? "border-green-500 text-green-500"
              : "border-blue-500 text-blue-500"
          }
        >
          {session.stage === "loading"
            ? "DELIBERATING..."
            : session.stage === "verdict"
            ? "VERDICT READY"
            : `ROUND ${session.round}`}
        </Badge>
      </div>

      {session.stage === "loading" && <LoadingState />}

      {session.stage === "responses" && session.responses && (
        <>
          <ResponsesSection
            responses={session.responses}
            round={session.round}
          />

          {/* Boost Controls - Only shown after first round */}
          {session.round >= 1 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Adjust Agent Influence
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Boost agents you find more convincing for the next discussion
                  round
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {(
                    Object.keys(agentInfo) as Array<keyof typeof agentInfo>
                  ).map((key, idx) => {
                    const agent = agentInfo[key];
                    return (
                      <div key={key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarImage src={agent.avatar} />
                              <AvatarFallback className={agent.color}>
                                {agent.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{agent.name}</span>
                          </div>
                          <Badge variant="secondary" className="font-mono">
                            +{Math.round(session.userBoost[idx] * 100)}%
                          </Badge>
                        </div>
                        <Slider
                          value={[session.userBoost[idx] * 100]}
                          onValueChange={(val) => handleBoostChange(idx, val)}
                          max={100}
                          step={5}
                          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={handleDiscussionRound}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Next Discussion Round"}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleGenerateVerdict}
                    disabled={loading}
                  >
                    <Gavel className="mr-2 h-4 w-4" /> Generate Verdict
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {session.stage === "verdict" && (
        <VerdictSection walletAddress={address} />
      )}
    </main>
  );
}

function LoadingState() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((old) => (old >= 100 ? 100 : old + 2));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in fade-in duration-1000">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
          <Sparkles className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-t-primary animate-spin" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Agents Deliberating...</h2>
        <p className="text-muted-foreground">
          Analyzing prompt and generating responses
        </p>
      </div>
      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-center text-xs text-muted-foreground font-mono">
          {progress}% Complete
        </p>
      </div>
    </div>
  );
}

function ResponsesSection({
  responses,
  round,
}: {
  responses: any;
  round: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Round {round} Responses</h2>
        <Badge variant="outline">{Object.keys(responses).length} Agents</Badge>
      </div>

      {/* Columnar Layout - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(responses).map(([agent, data]: [string, any]) => {
          const info = agentInfo[agent as keyof typeof agentInfo];
          return (
            <Card
              key={agent}
              className="border-t-4 hover:shadow-lg transition-all duration-300 flex flex-col h-[600px]"
              style={{ borderTopColor: `var(--${agent})` }}
            >
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className={`h-12 w-12 border-2 ${info.color}`}>
                    <AvatarImage src={info.avatar} />
                    <AvatarFallback className={info.color}>
                      {info.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{info.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="font-mono">
                        <Target className="h-3 w-3 mr-1" />
                        {data.confidence_score}/10
                      </Badge>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {/* Response Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Brain className="h-4 w-4" />
                      Response
                    </div>
                    <p className="text-sm leading-relaxed">
                      {data.content || data.response || "No content provided"}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Reasoning */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Scale className="h-4 w-4" />
                      Reasoning
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {data.reason || data.Reason || "No reasoning provided"}
                    </p>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer with confidence bar */}
              <div className="p-4 border-t bg-muted/30">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Confidence Level</span>
                    <span className="font-mono font-bold">
                      {data.confidence_score * 10}%
                    </span>
                  </div>
                  <Progress
                    value={data.confidence_score * 10}
                    className={`h-2 [&>div]:${info.bgColor}`}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function VerdictSection({ walletAddress }: { walletAddress: string }) {
  const [verdictData, setVerdictData] = useState<VerdictData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadVerdict = () => {
      console.log("Loading verdict from localStorage..."); // Debug log
      const storedVerdict = localStorage.getItem("verdictData");
      
      if (storedVerdict) {
        try {
          const parsed = JSON.parse(storedVerdict);
          console.log("Parsed verdict:", parsed); // Debug log
          setVerdictData(parsed);
        } catch (err) {
          console.error("Error parsing verdict:", err);
        }
      } else {
        console.warn("No verdict data in localStorage");
      }
      
      setIsLoading(false);
    };

    loadVerdict();
  }, []);

  const handleBackToDashboard = () => {
    // Clear verdict data from localStorage
    localStorage.removeItem("verdictData");
    console.log("✓ Verdict data cleared from localStorage");

    // Navigate back to dashboard
    router.push("/dashboard");
  };

  const downloadReport = (format: "txt" | "pdf") => {
    if (!verdictData) return;

    const reportContent = generateReportContent(verdictData);

    if (format === "txt") {
      const blob = new Blob([reportContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `courtroom-verdict-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // For PDF, we'll use a simple approach with window.print
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Courtney AI Verdict Report</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  padding: 40px;
                  max-width: 800px;
                  margin: 0 auto;
                  line-height: 1.6;
                }
                h1 { 
                  text-align: center; 
                  color: #682AD8;
                  border-bottom: 3px solid #682AD8;
                  padding-bottom: 10px;
                  margin-bottom: 30px;
                }
                .section {
                  margin: 20px 0;
                  padding: 15px;
                  border-left: 4px solid #682AD8;
                  background: #f5f5f5;
                }
                .section-title {
                  font-weight: bold;
                  color: #682AD8;
                  margin-bottom: 10px;
                  text-transform: uppercase;
                }
                .scores {
                  display: flex;
                  justify-content: space-around;
                  margin-top: 15px;
                }
                .score-item {
                  text-align: center;
                  padding: 10px;
                }
                .winner {
                  color: #10b981;
                  font-weight: bold;
                  font-size: 1.2em;
                }
                @media print {
                  body { padding: 20px; }
                }
              </style>
            </head>
            <body>
              <h1>⚖️ Courtney AI VERDICT REPORT</h1>
              <div class="section">
                <div class="section-title">Generated By</div>
                <div>${verdictData.wallet}</div>
              </div>
              <div class="section">
                <div class="section-title">Confidence Score</div>
                <div>${verdictData.verdict.confidence_score}/10</div>
              </div>
              <div class="section">
                <div class="section-title">Final Verdict</div>
                <div>${verdictData.verdict.content}</div>
              </div>
              <div class="section">
                <div class="section-title">Reasoning</div>
                <div>${verdictData.verdict.reason}</div>
              </div>
              <div class="section">
                <div class="section-title">Winning Agent</div>
                <div class="winner">🏆 ${verdictData.verdict.winner}</div>
              </div>
              <div class="section">
                <div class="section-title">Final Scores</div>
                <div class="scores">
                  <div class="score-item">
                    <strong>GPT</strong><br/>
                    ${verdictData.verdict.scores.gpt.toFixed(3)}
                  </div>
                  <div class="score-item">
                    <strong>Grok</strong><br/>
                    ${verdictData.verdict.scores.grok.toFixed(3)}
                  </div>
                  <div class="score-item">
                    <strong>Gemini</strong><br/>
                    ${verdictData.verdict.scores.gemini.toFixed(3)}
                  </div>
                </div>
              </div>
              <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
                Generated on ${new Date().toLocaleString()}<br/>
                Courtney AI - Decentralized AI Deliberation
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  const generateReportContent = (data: VerdictData): string => {
    return `
═══════════════════════════════════════════════════════════
           Courtney AI VERDICT REPORT
═══════════════════════════════════════════════════════════

Generated By: ${data.wallet}
Generated On: ${new Date().toLocaleString()}

───────────────────────────────────────────────────────────
CONFIDENCE SCORE
───────────────────────────────────────────────────────────
${data.verdict.confidence_score}/10

───────────────────────────────────────────────────────────
FINAL VERDICT
───────────────────────────────────────────────────────────
${data.verdict.content}

───────────────────────────────────────────────────────────
REASONING
───────────────────────────────────────────────────────────
${data.verdict.reason}

───────────────────────────────────────────────────────────
WINNING AGENT
───────────────────────────────────────────────────────────
🏆 ${data.verdict.winner}

───────────────────────────────────────────────────────────
FINAL AGENT SCORES
───────────────────────────────────────────────────────────
GPT:    ${data.verdict.scores.gpt.toFixed(6)}
Grok:   ${data.verdict.scores.grok.toFixed(6)}
Gemini: ${data.verdict.scores.gemini.toFixed(6)}

═══════════════════════════════════════════════════════════
        Courtney AI - Decentralized AI Deliberation
═══════════════════════════════════════════════════════════
    `.trim();
  };

  if (!verdictData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-muted-foreground">No verdict data available</p>
        <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
      </div>
    );
  }

  // Check if verdict has the expected structure
  if (!verdictData.verdict || typeof verdictData.verdict === 'string') {
    // Handle case where verdict is a string instead of object
    return (
      <div className="animate-in fade-in slide-in-from-bottom duration-1000 space-y-6">
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-background shadow-2xl">
          <div className="bg-primary px-6 py-4 flex items-center justify-between text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Gavel className="h-6 w-6" />
              <h2 className="text-2xl font-bold">THE VERDICT</h2>
            </div>
            <Badge variant="secondary" className="bg-green-500 text-white">
              SEALED
            </Badge>
          </div>

          <CardContent className="p-8 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <FileText className="h-4 w-4" />
                Generated By
              </div>
              <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm">
                {verdictData.wallet || walletAddress}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Brain className="h-4 w-4" />
                Final Verdict
              </div>
              <div className="p-6 bg-muted/30 rounded-lg border-l-4 border-primary">
                <p className="text-base leading-relaxed">
                  {typeof verdictData.verdict === 'string' 
                    ? verdictData.verdict 
                    : JSON.stringify(verdictData.verdict, null, 2)}
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Verdict structure is not in expected format. Please check backend response.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="outline" size="lg" onClick={handleBackToDashboard}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom duration-1000 space-y-6">
      <Card className="border-primary bg-gradient-to-br from-primary/5 to-background shadow-2xl">
        <div className="bg-primary px-6 py-4 flex items-center justify-between text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6" />
            <h2 className="text-2xl font-bold">THE VERDICT</h2>
          </div>
          <Badge variant="secondary" className="bg-green-500 text-white">
            SEALED
          </Badge>
        </div>

        <CardContent className="p-8 space-y-8">
          {/* ...existing verdict display code... */}

          {/* Generated By */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <FileText className="h-4 w-4" />
              Generated By
            </div>
            <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm">
              {verdictData.wallet}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <Target className="h-4 w-4" />
              Confidence Score
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="secondary"
                className="text-2xl font-bold px-6 py-2"
              >
                {verdictData.verdict.confidence_score}/10
              </Badge>
              <Progress
                value={verdictData.verdict.confidence_score * 10}
                className="flex-1 h-3"
              />
            </div>
          </div>

          {/* Final Verdict */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <Brain className="h-4 w-4" />
              Final Verdict
            </div>
            <div className="p-6 bg-muted/30 rounded-lg border-l-4 border-primary">
              <p className="text-base leading-relaxed">
                {verdictData.verdict.content}
              </p>
            </div>
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <Scale className="h-4 w-4" />
              Reasoning
            </div>
            <div className="p-6 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {verdictData.verdict.reason}
              </p>
            </div>
          </div>

          {/* Winner */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <Sparkles className="h-4 w-4" />
              Winning Agent
            </div>
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl">
                  🏆
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {verdictData.verdict.winner}
                </span>
              </div>
            </div>
          </div>

          {/* Final Scores */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <TrendingUp className="h-4 w-4" />
              Final Agent Scores
            </div>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(verdictData.verdict.scores).map(
                ([agent, score]) => {
                  const info = agentInfo[agent as keyof typeof agentInfo];
                  return (
                    <Card key={agent} className="p-4 text-center">
                      <Avatar
                        className={`h-12 w-12 mx-auto mb-2 border-2 ${info.color}`}
                      >
                        <AvatarImage src={info.avatar} />
                        <AvatarFallback className={info.color}>
                          {info.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h4 className="font-semibold mb-1">{info.name}</h4>
                      <Badge variant="secondary" className="font-mono">
                        {score.toFixed(4)}
                      </Badge>
                    </Card>
                  );
                }
              )}
            </div>
          </div>

          {/* Download Buttons */}
          <div className="pt-6 border-t space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Download your verdict report
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => downloadReport("txt")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Download as TXT
              </Button>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => downloadReport("pdf")}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Print as PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back to Dashboard */}
      <div className="text-center">
        <Button variant="outline" size="lg" onClick={handleBackToDashboard}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
