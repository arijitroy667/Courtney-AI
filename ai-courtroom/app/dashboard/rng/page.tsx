"use client";
import { useState } from "react";
import { Dice1, Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/components/wallet_connect";
import { ethers } from "ethers";

const CONTRACT_ABI = [
  "function getRandomNumber() external payable returns (uint256)",
  "function addProofHash(bytes32 proofHash) external",
  "event RandomnessConsumed(address indexed user, uint256 random)",
];

const CONTRACT_ADDRESS = "0x220c50dC9908ed49dE73F353E83d7a61fb9E7853";

export default function RNGPage() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [random, setRandom] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proofHash, setProofHash] = useState("");
  const [copied, setCopied] = useState(false);
  const FEE = "0.001 ETH + gas";

  const callGetRandom = async () => {
    setError(null);
    setLoading(true);
    setRandom(null);
    setTxHash(null);
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const tx = await contract.getRandomNumber({
        value: ethers.utils.parseEther("0.001"),
      });
      setTxHash(tx.hash);

      const receipt = await tx.wait();

      // Parse logs to find RandomnessConsumed event
      const iface = new ethers.utils.Interface(CONTRACT_ABI);

      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed.name === "RandomnessConsumed") {
            setRandom(parsed.args.random.toString());
            return;
          }
        } catch (e) {
          // Skip logs that don't match our ABI
          continue;
        }
      }

      // Fallback if event not found
      setError("Random number generated but event not found in logs.");
    } catch (err: any) {
      console.error("Error:", err);
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
      if (!address) {
        throw new Error("Wallet not connected");
      }
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Convert proof hash to bytes32
      const proofHashBytes = ethers.utils.formatBytes32String(proofHash.trim());

      const tx = await contract.addProofHash(proofHashBytes);
      setTxHash(tx.hash);

      await tx.wait();

      setProofHash("");
      setError(null);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to add proof hash");
    } finally {
      setLoading(false);
    }
  };

  const copyRandom = async () => {
    if (!random) return;
    await navigator.clipboard.writeText(random);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            Receive provably random numbers generated on-chain. Cost:{" "}
            <strong>{FEE}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Request Random Number</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Directly call the smart contract to generate a random number on
              Monad Testnet.
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
                {loading ? "Processing..." : "Generate Random Number"}
              </Button>

              <Button
                variant="outline"
                className="h-12"
                onClick={() => {
                  setRandom(null);
                  setTxHash(null);
                  setError(null);
                }}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            {random && (
              <div className="mt-4 space-y-3">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Random Number (uint256)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyRandom}
                      className="h-8"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="font-mono text-sm break-all bg-background/50 p-3 rounded border">
                    {random}
                  </div>
                </div>

                {txHash && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Transaction Hash
                        </div>
                        <div className="font-mono text-xs truncate text-muted-foreground">
                          {txHash}
                        </div>
                      </div>
                      <a
                        href={`https://monad-testnet.socialscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-4 text-sm text-primary hover:underline whitespace-nowrap"
                      >
                        View Explorer →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!address && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30 text-sm text-muted-foreground text-center">
                Connect your wallet to generate random numbers
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
