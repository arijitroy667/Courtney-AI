"use client";
import { useState } from "react";
import {
  Dice1,
  CreditCard,
  Check,
  Copy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/components/wallet_connect";

export default function RNGPage() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [random, setRandom] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proofHash, setProofHash] = useState("");
  const FEE = "0.001 MON";

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4021";

  const callGetRandom = async () => {
    setError(null);
    setLoading(true);
    setRandom(null);
    setTxHash(null);
    try {
      const resp = await fetch("/api/contract/get-random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Request failed");
      setRandom(data.random ?? null);
      setTxHash(data.txHash ?? null);
    } catch (err: any) {
      setError(err.message || "Failed to get random number");
    } finally {
      setLoading(false);
    }
  };

  const callAddProof = async () => {
    if (!proofHash.trim()) {
      setError("Proof hash required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/contract/add-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofHash: proofHash.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Request failed");
      setTxHash(data.txHash || null);
    } catch (err: any) {
      setError(err.message || "Failed to add proof hash");
    } finally {
      setLoading(false);
    }
  };

  const copyRandom = async () => {
    if (!random) return;
    await navigator.clipboard.writeText(random);
  };

  return (
    <main className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Dice1 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">On-Chain RNG</h1>
          <p className="text-sm text-muted-foreground">
            Receive provably random numbers generated on-chain. Cost per
            request: <strong>{FEE}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Request Random Number</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Requests are processed on-chain. The server will submit the
              transaction and pay the gas/fee.
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 h-12 bg-primary hover:bg-primary/90"
                onClick={callGetRandom}
                disabled={loading || !address}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Dice1 className="mr-2 h-4 w-4" />
                )}
                {loading ? "Processing..." : "Get Random Number"}
              </Button>

              <Button
                variant="outline"
                className="h-12"
                onClick={() => {
                  setRandom(null);
                  setTxHash(null);
                  setError(null);
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="text-sm text-destructive flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {error}
              </div>
            )}

            {random && (
              <div className="mt-2 p-4 rounded-lg bg-muted/10 border border-border/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Random (uint256)
                    </div>
                    <div className="font-mono break-words">{random}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-muted-foreground">Tx</div>
                    <div className="text-xs font-mono">{txHash ?? "—"}</div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="ghost" size="sm" onClick={copyRandom}>
                        <Copy className="h-4 w-4 mr-2" /> Copy
                      </Button>
                      {txHash && (
                        <a
                          href={`https://blockscout.com/base-sepolia/tx/${txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline"
                        >
                          View tx
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Submit Entropy (Proof Hash)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Optionally contribute a proof hash to increase global entropy used
              by the RNG.
            </div>

            <Input
              placeholder="0xabc123..."
              value={proofHash}
              onChange={(e) => setProofHash(e.target.value)}
              disabled={loading}
              className="bg-muted/5"
            />

            <div className="flex gap-3">
              <Button
                onClick={callAddProof}
                disabled={loading || !proofHash.trim()}
              >
                <Check className="mr-2 h-4 w-4" />
                Add Proof Hash
              </Button>
              <Button variant="outline" onClick={() => setProofHash("")}>
                Clear
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Contributions are recorded on-chain and influence future
              randomness.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
