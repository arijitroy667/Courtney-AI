import { paymentMiddleware } from "@x402/express";

const payTo = "0x27F311887caa22400EDbf6338D917Fbb466CfeB1";

/**
 * Create base prompt payment middleware (1 USDC)
 * Uses the official x402 paymentMiddleware
 */
export function createBasePromptMiddleware(server) {
  return paymentMiddleware(
    server,
    {
      scheme: "exact",
      network: "eip155:84532",
      maxAmountRequired: "1000000", // 1 USDC (6 decimals)
      resource: "base-prompt",
      description: "Initialize AI courtroom session with base prompt",
    },
    {
      payTo,
    }
  );
}

/**
 * Create discussion round payment middleware (1.5 USDC)
 * Uses the official x402 paymentMiddleware
 */
export function createDiscussionMiddleware(server) {
  return paymentMiddleware(
    server,
    {
      scheme: "exact",
      network: "eip155:84532",
      maxAmountRequired: "1500000", // 1.5 USDC (6 decimals)
      resource: "discussion-round",
      description: "Continue deliberation with discussion round",
    },
    {
      payTo,
    }
  );
}

/**
 * Create boost payment middleware (dynamic pricing)
 */
export function createBoostMiddleware(server, boostAmount) {
  return paymentMiddleware(
    {
      "POST /api/boost": {
        accepts: [
          {
            scheme: "exact",
            price: `$${boostAmount.toFixed(3)}`,
            network: "eip155:84532",
            payTo,
          },
        ],
        description: "Apply LLM boost to agents",
        mimeType: "application/json",
      },
    },
    server
  );
}
