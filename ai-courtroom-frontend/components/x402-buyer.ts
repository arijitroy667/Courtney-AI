import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import type { Account } from "viem";

// Declare MetaMask ethereum provider
declare global {
  interface Window {
    ethereum?: any;
  }
}

class PaymentClient {
  private client: InstanceType<typeof x402Client> | null = null;
  private fetchWithPayment: typeof fetch | null = null;
  private httpClient: InstanceType<typeof x402HTTPClient> | null = null;
  private walletAddress: string | null = null;
  private paymentReceipts: Map<string, any> = new Map();

  /**
   * Check if X402 client is initialized and ready
   */
  isReady(): boolean {
    return this.client !== null && this.fetchWithPayment !== null;
  }

  /**
   * Initialize X402 client with MetaMask wallet
   */
  async initialize(): Promise<string> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    try {
      console.log("🔧 Initializing X402 payment client...");

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];
      if (!address) {
        throw new Error("No account found. Please connect MetaMask.");
      }

      this.walletAddress = address;
      console.log(`🔑 Wallet address: ${address}`);

      // Create X402 client
      this.client = new x402Client();

      // Create MetaMask signer that matches viem Account interface
      const metamaskSigner: Account = {
        address: address as `0x${string}`,
        type: "local" as const,
        source: "custom" as const,

        // Required by Account interface but not used
        publicKey: "0x" as `0x${string}`,

        // Sign message using MetaMask
        async signMessage({ message }) {
          console.log("📝 Signing message with MetaMask...");

          const messageToSign =
            typeof message === "string"
              ? message
              : "raw" in message
              ? message.raw
              : new TextDecoder().decode(message);

          const signature = await window.ethereum.request({
            method: "personal_sign",
            params: [messageToSign, address],
          });

          console.log("✅ Message signed");
          return signature as `0x${string}`;
        },

        // Sign transaction
        async signTransaction(transaction) {
          console.log("📝 Signing transaction with MetaMask...");

          // MetaMask doesn't support signTransaction directly
          // This shouldn't be called by X402 exact scheme
          throw new Error("Use sendTransaction instead of signTransaction");
        },

        // Sign typed data (EIP-712) - This is what X402 uses for USDC transfers
        async signTypedData(typedData) {
          console.log("🔔 signTypedData CALLED - MetaMask should prompt now!");
          console.log("📝 Requesting EIP-3009 signature from MetaMask...");

          if (!typedData.message) {
            console.error("❌ typedData.message is undefined:", typedData);
            throw new Error("typedData.message is undefined");
          }

          console.log(
            "📋 Full typed data structure:",
            JSON.stringify(typedData, null, 2)
          );
          console.log("💳 Payment details:", {
            from: typedData.message.from,
            to: typedData.message.to,
            value: typedData.message.value,
            amount: `${parseInt(typedData.message.value) / 1_000_000} USDC`,
          });

          // MetaMask's eth_signTypedData_v4 method
          const signature = await window.ethereum.request({
            method: "eth_signTypedData_v4",
            params: [
              address,
              JSON.stringify({
                domain: typedData.domain,
                types: typedData.types,
                primaryType: typedData.primaryType,
                message: typedData.message,
              }),
            ],
          });

          console.log("✅ EIP-3009 authorization signed");
          console.log("   Signature:", signature);

          return signature as `0x${string}`;
        },
      };

      // Register EVM payment scheme with MetaMask signer
      registerExactEvmScheme(this.client, {
        signer: metamaskSigner as any,
      });

      // Wrap fetch with automatic payment handling
      this.fetchWithPayment = wrapFetchWithPayment(fetch, this.client);

      // Create HTTP client for extracting payment receipts
      this.httpClient = new x402HTTPClient(this.client);

      console.log("✅ X402 client initialized successfully");
      console.log("   Network: Base Sepolia (84532)");
      console.log(`   Wallet: ${address}`);
      console.log("   Ready to make payment-gated requests");

      return address;
    } catch (error: any) {
      console.error("❌ Failed to initialize X402 client:", error);
      this.reset();
      throw new Error(`X402 initialization failed: ${error.message}`);
    }
  }

  /**
   * Make a payment-gated HTTP request
   * Payment is handled automatically by X402
   */
  async makePaymentRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    if (!this.fetchWithPayment || !this.httpClient) {
      throw new Error("X402 client not initialized. Call initialize() first.");
    }

    try {
      console.log("\n💳 Making payment-gated request...");
      console.log(`   URL: ${url}`);
      console.log(`   Method: ${options.method || "GET"}`);
      console.log("   💡 Checking if payment is required...");

      // Make request with automatic payment handling
      // X402 will:
      // 1. Send initial request
      // 2. Receive 402 with payment requirements
      // 3. Automatically prompt MetaMask for EIP-3009 signature
      // 4. Send signed payment authorization in X-Payment header
      // 5. Server verifies with facilitator and returns content
      const response = await this.fetchWithPayment(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      console.log(`📥 Response status: ${response.status}`);

      // Check if payment was required and completed
      const paymentHeader = response.headers.get("x-payment-response");
      if (paymentHeader) {
        console.log("✅ Payment was processed");
      }

      // Handle 402 errors (payment failed)
      if (response.status === 402) {
        const clonedResponse = response.clone();
        try {
          const errorBody = await clonedResponse.json();
          console.error("❌ Payment required:", errorBody);
          throw new Error(
            errorBody.error ||
              errorBody.message ||
              "Payment required but not completed"
          );
        } catch (e) {
          throw new Error("Payment required but not completed");
        }
      }

      // Extract payment receipt if payment was made
      if (response.ok) {
        try {
          const paymentResponse = this.httpClient.getPaymentSettleResponse(
            (name: string) => response.headers.get(name)
          );

          if (paymentResponse) {
            console.log("✅ Payment settled successfully");
            console.log(`   Transaction: ${paymentResponse.txHash || "N/A"}`);
            console.log(`   Amount: ${paymentResponse.amount || "N/A"}`);

            // Store payment receipt
            this.paymentReceipts.set(url, {
              ...paymentResponse,
              timestamp: new Date().toISOString(),
              url,
            });
          } else {
            console.log("ℹ️ No payment required for this request");
          }
        } catch (receiptError) {
          console.warn("⚠️ Could not extract payment receipt:", receiptError);
        }
      }

      // Parse response body
      let data;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(
          (data as any).message ||
            (data as any).error ||
            `Request failed with status ${response.status}`
        );
      }

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        payment: this.paymentReceipts.get(url) || null,
      };
    } catch (error: any) {
      console.error("❌ Payment request failed:", error);

      // Handle specific MetaMask errors
      if (error.code === 4001 || error.message?.includes("User denied")) {
        throw new Error(
          "Payment rejected: You declined the MetaMask signature request"
        );
      } else if (error.message?.includes("insufficient funds")) {
        throw new Error(
          "Insufficient USDC balance. Please add USDC to your Base Sepolia wallet."
        );
      } else if (error.message?.includes("network")) {
        throw new Error(
          "Network error: Please ensure you're connected to Base Sepolia in MetaMask"
        );
      }

      throw error;
    }
  }

  /**
   * Get all payment receipts
   */
  getPaymentHistory(): any[] {
    return Array.from(this.paymentReceipts.values());
  }

  /**
   * Get specific payment receipt
   */
  getPaymentReceipt(url: string): any {
    return this.paymentReceipts.get(url);
  }

  /**
   * Get current wallet address
   */
  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Reset the client
   */
  reset(): void {
    this.client = null;
    this.fetchWithPayment = null;
    this.httpClient = null;
    this.walletAddress = null;
    this.paymentReceipts.clear();
    console.log("🔄 X402 client reset");
  }
}

// Export singleton instance
export const paymentClient = new PaymentClient();

// Export helper functions
export async function initializeX402Client(): Promise<string> {
  return paymentClient.initialize();
}

export async function makePaymentRequest(
  url: string,
  options: RequestInit = {}
): Promise<{ response: Response; paymentReceipt: any }> {
  const result = await paymentClient.makePaymentRequest(url, options);

  const response = new Response(JSON.stringify(result.data), {
    status: result.status,
    headers: result.headers,
  });

  return {
    response,
    paymentReceipt: result.payment,
  };
}

export function isX402Initialized(): boolean {
  return paymentClient.isReady();
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
