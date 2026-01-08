"use client";
import { useState, useEffect } from "react";
import { Play, AlertCircle, Brain, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from "@/components/wallet_connect";
import { api } from "@/lib/api";
import {
  initializeX402Client,
  isX402Initialized,
  resetX402Client,
} from "@/components/x402-buyer";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

const agents = [
  {
    name: "GPT",
    model: "GPT-4o",
    avatar: "/gpt-avatar.png",
    description: "Advanced reasoning and analysis",
    properties: ["Multi-modal", "128K context", "Function calling"],
    color: "text-green-500",
  },
  {
    name: "Grok",
    model: "Grok-2",
    avatar: "/grok-avatar.png",
    description: "Real-time data integration",
    properties: ["X integration", "Real-time aware", "Humor-enhanced"],
    color: "text-blue-500",
  },
  {
    name: "Gemini",
    model: "Gemini 2.0",
    avatar: "/gemini-avatar.png",
    description: "Multimodal understanding",
    properties: ["Native multimodal", "2M context", "Code execution"],
    color: "text-purple-500",
  },
];

export default function DashboardPage() {
  const { address } = useWallet();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [x402Ready, setX402Ready] = useState(false);
  const [x402Initializing, setX402Initializing] = useState(false);

  // Reset x402 client when wallet changes
  useEffect(() => {
    if (!address) {
      resetX402Client();
      setX402Ready(false);
    }
  }, [address]);

  // Initialize x402 client when wallet connects
  // Initialize x402 client when wallet connects
  useEffect(() => {
    const initX402 = async () => {
      if (!address) return;
      
      if (isX402Initialized()) {
        setX402Ready(true);
        return;
      }

      setX402Initializing(true);
      setError("");

      try {
        // No parameter needed - initializeX402Client handles wallet connection
        await initializeX402Client();
        setX402Ready(true);
        console.log("✓ x402 client initialized");
      } catch (err: any) {
        console.error("Failed to initialize x402 client:", err);
        setError("Failed to initialize payment system: " + err.message);
        setX402Ready(false);
      } finally {
        setX402Initializing(false);
      }
    };

    initX402();
  }, [address]);

  const handleCommenceTrial = async () => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }

    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!x402Ready) {
      setError("Payment system not ready. Please wait or refresh the page.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Clear any previous session
      localStorage.removeItem("currentSession");
      localStorage.removeItem("verdictData");

      // Try to delete any existing session on the backend
      try {
        await api.deleteSession(address);
        console.log("✓ Previous backend session cleared");
      } catch (e) {
        // Ignore - session may not exist
      }

      console.log("💳 Sending base prompt with wallet:", address);
      console.log("   MetaMask should prompt for payment approval...");
      
      const response = await api.basePrompt(address, prompt);
      console.log("✅ Response received:", response);

      // Store new session in localStorage
      localStorage.setItem("currentSession", JSON.stringify(response));

      router.push("/dashboard/deliberation");
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-8 max-w-7xl mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Courtney AI</h1>
        <p className="text-muted-foreground">
          Orchestrate a council of AI agents for deliberation and verdict
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Agent Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">The Council</h2>
          {agents.map((agent) => (
            <Card
              key={agent.name}
              className="border-border/50 hover:border-primary/50 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback className={agent.color}>
                      {agent.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">
                      {agent.model}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>
                <div className="space-y-1">
                  {agent.properties.map((prop, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${agent.color.replace(
                          "text-",
                          "bg-"
                        )}`}
                      />
                      {prop}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column: Prompt Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Present Your Case</CardTitle>
                <div className="flex items-center gap-2">
                  {x402Initializing && (
                    <Badge variant="secondary" className="animate-pulse">
                      Initializing Payment...
                    </Badge>
                  )}
                  {x402Ready && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      Payment Ready
                    </Badge>
                  )}
                  <Badge variant="secondary" className="font-mono">
                    NEW SESSION
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Main Argument / Prompt
                </label>
                <Textarea
                  placeholder="Enter the scenario, question, or decision that needs deliberation...

Example: 'Should our company adopt a 4-day work week? Consider productivity, employee satisfaction, and competitive advantage.'"
                  className="min-h-[300px] bg-muted/30 border-border/50 focus:border-primary/50 transition-all resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  The more detailed your prompt, the better the deliberation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-lg">Ready to Begin?</h3>
                  <p className="text-sm text-muted-foreground">
                    The council will analyze your prompt and provide diverse
                    perspectives. <strong>Cost: 1 USDC</strong>
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      <span>3 AI Agents</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>Parallel Analysis</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>Confidence Scores</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 w-full md:w-auto"
                  onClick={handleCommenceTrial}
                  disabled={loading || !prompt.trim() || !x402Ready || x402Initializing}
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing Payment...
                    </>
                  ) : x402Initializing ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Commence Trial (1 USDC)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}