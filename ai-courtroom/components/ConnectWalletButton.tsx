"use client"
import React, { useState, useRef, useEffect } from "react"
import { useWallet } from "@/components/wallet_connect"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, Copy, Check, ExternalLink } from "lucide-react"

export default function ConnectWalletButton() {
  const { address, isConnecting, connect, disconnect } = useWallet()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!address) {
    return (
      <Button 
        className="bg-primary hover:bg-primary/90" 
        onClick={connect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        className="bg-primary hover:bg-primary/90"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-card border border-border ring-1 ring-black/5 z-50 overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
            <p className="text-sm font-mono break-all">{address}</p>
          </div>
          
          <div className="p-2 space-y-1">
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
              onClick={copyAddress}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{copied ? "Copied!" : "Copy Address"}</span>
            </button>
            
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
              onClick={() => window.open(`https://etherscan.io/address/${address}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span>View on Etherscan</span>
            </button>
            
            <div className="border-t border-border my-1" />
            
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              onClick={() => {
                disconnect()
                setOpen(false)
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}