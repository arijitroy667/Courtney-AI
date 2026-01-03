"use client"
import React, { useState, useRef, useEffect } from "react"
import { useWallet } from "@/components/wallet_connect"
import { Button } from "@/components/ui/button"

export default function ConnectWalletButton() {
  const { address, connect, disconnect } = useWallet()
  const [open, setOpen] = useState(false)
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

  if (!address) {
    return (
      <Button className="bg-primary hover:bg-primary/90" onClick={connect}>
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        className="bg-primary hover:bg-primary/90"
        onClick={() => setOpen((v) => !v)}
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-zinc-900 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-2 px-4 text-xs text-muted-foreground break-all border-b border-border">
            {address}
          </div>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition"
            onClick={() => {
              disconnect()
              setOpen(false)
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}