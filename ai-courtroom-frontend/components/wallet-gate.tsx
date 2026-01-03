"use client"
import { useWallet } from "@/components/wallet_connect"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle } from "lucide-react"

export function WalletGate({ children }: { children: React.ReactNode }) {
  const { address, connect } = useWallet()

  if (!address) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20">
          <CardContent className="p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Wallet className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
              <p className="text-sm text-muted-foreground">
                Please connect your wallet to access the courtroom dashboard and participate in AI deliberations.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
              onClick={connect}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Make sure MetaMask is installed</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}