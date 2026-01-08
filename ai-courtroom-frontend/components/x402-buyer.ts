"use client";

import { encodeFunctionData } from "viem";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// ERC20 ABI for transfer function
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

class PaymentClient {
  private walletAddress: string | null = null;
  private paymentReceipts: Map<string, any> = new Map();
  private initialized: boolean = false;

  isReady(): boolean {
    return this.initialized && this.walletAddress !== null;
  }

  async initialize(): Promise<string> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    try {
      console.log("🔧 Initializing payment client...");

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      this.walletAddress = accounts[0];
      this.initialized = true;

      // Check and switch to Base Sepolia if needed
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0x14a34") {
        // 84532 in hex
        console.log("🔄 Switching to Base Sepolia...");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x14a34" }],
          });
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x14a34",
                  chainName: "Base Sepolia",
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://sepolia.base.org"],
                  blockExplorerUrls: ["https://sepolia.basescan.org"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      console.log(`🔑 Wallet connected: ${this.walletAddress}`);
      console.log("✅ Payment client initialized successfully");

      if (!this.walletAddress) {
        throw new Error("Wallet address is not available");
      }
      return this.walletAddress;
    } catch (error: any) {
      console.error("❌ Failed to initialize payment client:", error);
      this.reset();
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  async checkUSDCBalance(
    address: string,
    usdcAddress: string
  ): Promise<bigint> {
    if (!window.ethereum) {
      throw new Error("MetaMask not available");
    }

    try {
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      const result = await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: usdcAddress,
            data: data,
          },
          "latest",
        ],
      });

      return BigInt(result);
    } catch (error) {
      console.error("Failed to check balance:", error);
      return BigInt(0);
    }
  }

  async makePaymentRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    if (!this.initialized || !this.walletAddress) {
      throw new Error("Payment client not initialized");
    }

    try {
      console.log("\n💳 Making payment-gated request...");
      console.log(`   URL: ${url}`);
      console.log(`   Method: ${options.method || "GET"}`);

      // Step 1: Make initial request to get payment requirements
      console.log("🔄 Step 1: Checking payment requirements...");
      const initialResponse = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      console.log(`   Response status: ${initialResponse.status}`);

      // If not 402, return the response
      if (initialResponse.status !== 402) {
        const data = await initialResponse.json();
        return {
          data,
          status: initialResponse.status,
          headers: Object.fromEntries(initialResponse.headers.entries()),
          payment: null,
        };
      }

      // Step 2: Parse payment requirements
      console.log("💰 Step 2: Payment required - parsing requirements...");
      const paymentReqs = await initialResponse.json();
      console.log("   Payment requirements:", paymentReqs);

      if (!paymentReqs.accepts || paymentReqs.accepts.length === 0) {
        throw new Error("Invalid payment requirements");
      }

      const requirement = paymentReqs.accepts[0];
      const amountInWei = requirement.maxAmountRequired;
      const amountInUSDC =
        requirement.extra?.priceUSDC || parseFloat(amountInWei) / 1_000_000;

      console.log(`   Amount: ${amountInWei} wei (${amountInUSDC} USDC)`);
      console.log(`   To: ${requirement.payTo}`);
      console.log(`   Asset: ${requirement.asset}`);

      // Step 3: Check balance first
      console.log("📝 Step 3: Checking USDC balance...");
      const balance = await this.checkUSDCBalance(
        this.walletAddress,
        requirement.asset
      );
      const balanceInUSDC = Number(balance) / 1_000_000;
      console.log(
        `   Balance: ${balance.toString()} wei (${balanceInUSDC} USDC)`
      );

      if (balance < BigInt(amountInWei)) {
        throw new Error(
          `Insufficient USDC balance. You have ${balanceInUSDC.toFixed(
            2
          )} USDC but need ${amountInUSDC} USDC.`
        );
      }

      // Step 4: Send payment using MetaMask
      console.log("💳 Step 4: Sending USDC payment...");
      console.log(`   From: ${this.walletAddress}`);
      console.log(`   To: ${requirement.payTo}`);
      console.log(`   Amount: ${amountInUSDC} USDC`);

      // Encode transfer function call
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [requirement.payTo as `0x${string}`, BigInt(amountInWei)],
      });

      console.log(
        "   Encoded transfer data:",
        transferData.substring(0, 20) + "..."
      );

      // Send transaction via MetaMask
      let txHash: string;
      try {
        txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: this.walletAddress,
              to: requirement.asset, // USDC contract address
              data: transferData,
              // Let MetaMask estimate gas
            },
          ],
        });
      } catch (txError: any) {
        console.error("Transaction error:", txError);

        if (txError.code === 4001) {
          throw new Error("Transaction rejected by user");
        }

        // Try to extract meaningful error
        if (txError.message?.includes("insufficient")) {
          throw new Error("Insufficient funds for gas or USDC transfer");
        }

        throw new Error(
          `Transaction failed: ${txError.message || "Unknown error"}`
        );
      }

      console.log(`✅ Payment transaction sent: ${txHash}`);

      // Step 5: Wait for transaction confirmation
      console.log("⏳ Step 5: Waiting for confirmation...");
      await this.waitForTransaction(txHash);

      // Step 6: Create payment header and retry request
      console.log("🔄 Step 6: Retrying request with payment proof...");

      const paymentHeader = JSON.stringify({
        txHash: txHash,
        amount: amountInWei,
        amountUSDC: amountInUSDC,
        timestamp: Date.now(),
        from: this.walletAddress,
        to: requirement.payTo,
      });

      const finalResponse = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Payment": paymentHeader,
          ...options.headers,
        },
      });

      console.log(`   Final response status: ${finalResponse.status}`);

      if (!finalResponse.ok) {
        const errorData = await finalResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.details ||
            `Request failed: ${finalResponse.statusText}`
        );
      }

      const data = await finalResponse.json();
      console.log("✅ Payment request completed successfully!");

      // Store receipt
      const receipt = {
        txHash: txHash,
        amount: amountInWei,
        amountUSDC: amountInUSDC,
        timestamp: new Date().toISOString(),
        url,
        from: this.walletAddress,
        to: requirement.payTo,
      };
      this.paymentReceipts.set(url, receipt);

      return {
        data,
        status: finalResponse.status,
        headers: Object.fromEntries(finalResponse.headers.entries()),
        payment: receipt,
      };
    } catch (error: any) {
      console.error("❌ Payment request failed:", error);
      throw error;
    }
  }

  async waitForTransaction(
    txHash: string,
    maxAttempts: number = 30
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt) {
          if (receipt.status === "0x1") {
            console.log("   ✅ Transaction confirmed!");
            return;
          } else {
            throw new Error("Transaction failed on-chain");
          }
        }

        // Wait 2 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`   Waiting for confirmation... (${i + 1}/${maxAttempts})`);
      } catch (error) {
        // Ignore errors and keep waiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // If we get here, just proceed (transaction might still be pending)
    console.log("   ⚠️ Transaction pending, proceeding anyway...");
  }

  getPaymentHistory(): any[] {
    return Array.from(this.paymentReceipts.values());
  }

  getPaymentReceipt(url: string): any {
    return this.paymentReceipts.get(url);
  }

  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  async disconnect(): Promise<void> {
    this.reset();
    console.log("👋 Wallet disconnected");
  }

  reset(): void {
    this.walletAddress = null;
    this.initialized = false;
    this.paymentReceipts.clear();
    console.log("🔄 Payment client reset");
  }
}

export const paymentClient = new PaymentClient();

export async function initializeX402Client(): Promise<string> {
  return paymentClient.initialize();
}

export function isX402Initialized(): boolean {
  return paymentClient.isReady();
}

export async function disconnectX402Client(): Promise<void> {
  return paymentClient.disconnect();
}

export function resetX402Client(): void {
  paymentClient.reset();
}

export function getPaymentHistory(): any[] {
  return paymentClient.getPaymentHistory();
}

export function getPaymentReceipt(url: string): any {
  return paymentClient.getPaymentReceipt(url);
}

export function getWalletAddress(): string | null {
  return paymentClient.getWalletAddress();
}
