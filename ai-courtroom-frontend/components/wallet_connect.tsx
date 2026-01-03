"use client"
import React, { createContext, useContext, useState, useEffect } from "react"

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

type WalletContextType = {
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connect: async () => {},
  disconnect: () => {},
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null)

  // Connect to MetaMask
  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("MetaMask not found")
      return
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      setAddress(accounts[0])
    } catch (err) {
      alert("Wallet connection failed")
    }
  }

  // Disconnect wallet
  const disconnect = () => setAddress(null)

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return
    const handler = (accounts: string[]) => setAddress(accounts[0] || null)
    window.ethereum.on("accountsChanged", handler)
    return () => window.ethereum.removeListener("accountsChanged", handler)
  }, [])

  return (
    <WalletContext.Provider value={{ address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}