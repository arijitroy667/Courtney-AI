import { paymentClient } from "../components/x402-buyer";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;

export interface AgentResponse {
  content: string;
  confidence_score: number;
  reason: string;
}

export const api = {
  async basePrompt(walletAddress: string, prompt: string) {
    const result = await paymentClient.makePaymentRequest(
      `${BACKEND_URL}/api/base-prompt/${walletAddress}`,
      {
        method: "POST",
        body: JSON.stringify({ prompt }),
      }
    );

    console.log("✅ Base prompt response:", result.data);
    if (result.payment) {
      console.log("💰 Payment receipt:", result.payment);
    }

    return result.data;
  },

  async discuss(walletAddress: string, roundNo: number, userBoost: number[]) {
    const result = await paymentClient.makePaymentRequest(
      `${BACKEND_URL}/api/discuss/${walletAddress}`,
      {
        method: "POST",
        body: JSON.stringify({ round_no: roundNo, user_boost: userBoost }),
      }
    );

    console.log("✅ Discussion response:", result.data);
    if (result.payment) {
      console.log("💰 Payment receipt:", result.payment);
    }

    return result.data;
  },

  async verdict(walletAddress: string) {
    // No payment required for verdict - use regular fetch
    const response = await fetch(
      `${BACKEND_URL}/api/verdict/${walletAddress}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.details ||
          `Failed to generate verdict: ${response.statusText}`
      );
    }

    return response.json();
  },

  async deleteSession(walletAddress: string) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/session/${walletAddress}`,
        {
          method: "DELETE",
        }
      );
      return response.json();
    } catch (e) {
      return { success: false };
    }
  },

  async getFees(userBoost?: number[]) {
    const params = userBoost ? `?user_boost=${JSON.stringify(userBoost)}` : "";
    const response = await fetch(`${BACKEND_URL}/api/fees${params}`);
    return response.json();
  },

  async getReports(walletAddress: string) {
    const response = await fetch(
      `${BACKEND_URL}/api/reports/${walletAddress}`
    );
    return response.json();
  },
};