import { Navigation } from "@/components/navigationbar"
import { WalletGate } from "@/components/wallet-gate"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <WalletGate>{children}</WalletGate>
    </div>
  )
}