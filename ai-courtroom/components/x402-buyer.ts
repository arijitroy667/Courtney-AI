"use client";

import { createThirdwebClient } from "thirdweb";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { createWallet } from "thirdweb/wallets";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "",
});

class PaymentClient {
  private wallet: any = null;
  private paymentReceipts: Map<string, any> = new Map();
  private initialized: boolean = false;

  isReady(): boolean {
    return this.initialized && this.wallet !== null;
  }

  async initialize(): Promise<string> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    try {
      console.log("🔧 Initializing Thirdweb payment client...");

      // Create and connect wallet
      this.wallet = createWallet("io.metamask");
      const account = await this.wallet.connect({ client });

      this.initialized = true;

      const address = account.address;
      console.log(`🔑 Wallet connected: ${address}`);
      console.log("✅ Payment client initialized successfully");

      return address;
    } catch (error: any) {
      console.error("❌ Failed to initialize payment client:", error);
      this.reset();
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  async makePaymentRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    if (!this.initialized || !this.wallet) {
      throw new Error("Payment client not initialized");
    }

    try {
      console.log("\n💳 Making payment-gated request...");
      console.log(`   URL: ${url}`);
      console.log(`   Method: ${options.method || "GET"}`);

      // Ensure Content-Type is set for JSON requests
      const headers = new Headers(options.headers);
      if (!headers.has("Content-Type") && options.body) {
        headers.set("Content-Type", "application/json");
      }

      // Merge headers back into options
      const requestOptions = {
        ...options,
        headers: Object.fromEntries(headers.entries()),
      };

      console.log("📋 Request headers:", requestOptions.headers);

      // Use Thirdweb's wrapFetchWithPayment to handle the entire payment flow
      const fetchWithPayment = wrapFetchWithPayment(fetch, client, this.wallet);

      const response = await fetchWithPayment(url, requestOptions);

      console.log(`   Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.details ||
            `Request failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Payment request completed successfully!");

      // Extract payment receipt from response headers
      const paymentReceiptHeader = response.headers.get("X-Payment-Receipt");
      let receipt = null;

      if (paymentReceiptHeader) {
        try {
          receipt = JSON.parse(paymentReceiptHeader);
          this.paymentReceipts.set(url, {
            ...receipt,
            timestamp: new Date().toISOString(),
            url,
          });
        } catch (e) {
          console.warn("Could not parse payment receipt header");
        }
      }

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        payment: receipt,
      };
    } catch (error: any) {
      console.error("❌ Payment request failed:", error);
      throw error;
    }
  }

  getPaymentHistory(): any[] {
    return Array.from(this.paymentReceipts.values());
  }

  getPaymentReceipt(url: string): any {
    return this.paymentReceipts.get(url);
  }

  getWalletAddress(): string | null {
    return this.wallet?.getAccount()?.address || null;
  }

  async disconnect(): Promise<void> {
    if (this.wallet) {
      await this.wallet.disconnect();
    }
    this.reset();
    console.log("👋 Wallet disconnected");
  }

  reset(): void {
    this.wallet = null;
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
