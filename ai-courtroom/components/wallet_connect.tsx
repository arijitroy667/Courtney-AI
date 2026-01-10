"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

type WalletContextType = {
  address: string | null
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
})

export const useWallet = () => useContext(WalletContext)

const WALLET_STORAGE_KEY = "courtney_wallet_address"

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) {
        setIsInitialized(true)
        return
      }

      try {
        // Check localStorage for previously connected wallet
        const savedAddress = localStorage.getItem(WALLET_STORAGE_KEY)
        
        if (savedAddress) {
          // Verify the wallet is still connected
          const accounts = await window.ethereum.request({ 
            method: "eth_accounts" 
          })
          
          if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
            setAddress(accounts[0])
          } else {
            // Clear saved address if no longer connected
            localStorage.removeItem(WALLET_STORAGE_KEY)
          }
        }
      } catch (error) {
        console.error("Error checking existing connection:", error)
        localStorage.removeItem(WALLET_STORAGE_KEY)
      }
      
      setIsInitialized(true)
    }

    checkExistingConnection()
  }, [])

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("MetaMask not found. Please install MetaMask extension.")
      return
    }

    setIsConnecting(true)
    
    try {
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      })
      
      if (accounts.length > 0) {
        setAddress(accounts[0])
        localStorage.setItem(WALLET_STORAGE_KEY, accounts[0])
      }
    } catch (err: any) {
      if (err.code === 4001) {
        console.log("User rejected the connection request")
      } else {
        console.error("Wallet connection failed:", err)
        alert("Wallet connection failed. Please try again.")
      }
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null)
    localStorage.removeItem(WALLET_STORAGE_KEY)
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected from MetaMask
        setAddress(null)
        localStorage.removeItem(WALLET_STORAGE_KEY)
      } else if (accounts[0] !== address) {
        // User switched accounts
        setAddress(accounts[0])
        localStorage.setItem(WALLET_STORAGE_KEY, accounts[0])
      }
    }

    const handleChainChanged = () => {
      // Reload on chain change for safety
      window.location.reload()
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum.removeListener("chainChanged", handleChainChanged)
    }
  }, [address])

  // Don't render children until we've checked for existing connection
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <WalletContext.Provider value={{ address, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}