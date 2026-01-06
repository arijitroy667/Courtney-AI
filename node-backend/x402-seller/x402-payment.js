import { getAddress } from "viem";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const NETWORK = "eip155:84532"; // Base Sepolia chain ID format for X402

// X402 Facilitator endpoint (adjust based on actual facilitator URL)
const FACILITATOR_URL = "https://x402.org/facilitator";

/**
 * Create payment requirements object for 402 response
 */
function createPaymentRequirements(config) {
  const { price, payTo, resource, description } = config;

  // Convert price string like "$1.00" to base units (USDC has 6 decimals)
  let maxAmountRequired;
  if (typeof price === "string" && price.startsWith("$")) {
    const dollarAmount = parseFloat(price.slice(1));
    maxAmountRequired = Math.floor(dollarAmount * 1_000_000).toString();
  } else {
    maxAmountRequired = price.toString();
  }

  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: NETWORK,
        maxAmountRequired,
        resource: resource || "protected-resource",
        description: description || "Payment required for access",
        payTo: getAddress(payTo),
        maxTimeoutSeconds: 300,
        asset: USDC_ADDRESS,
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
  };
}

/**
 * Verify payment with X402 facilitator
 */
async function verifyPaymentWithFacilitator(paymentHeader, expectedAmount, payTo) {
  try {
    console.log("🔍 Verifying payment with facilitator...");
    
    const paymentPayload = typeof paymentHeader === "string" 
      ? JSON.parse(paymentHeader) 
      : paymentHeader;

    // Send to facilitator for verification and execution
    const response = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment: paymentPayload,
        expectedAmount,
        expectedRecipient: payTo,
        network: NETWORK,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Facilitator verification failed");
    }

    const result = await response.json();
    console.log("✅ Facilitator verified payment:", result.txHash);
    
    return {
      verified: true,
      txHash: result.txHash,
      amount: result.amount,
      from: result.from,
      to: result.to,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Facilitator verification failed:", error.message);
    throw error;
  }
}

/**
 * X402 Payment Middleware Factory
 */
export function requirePayment(config) {
  const paymentRequirements = createPaymentRequirements(config);
  const expectedAmount = paymentRequirements.accepts[0].maxAmountRequired;

  return async function x402PaymentMiddleware(req, res, next) {
    console.log(`\n🔐 X402 Payment Gate: ${req.method} ${req.path}`);

    const paymentHeader =
      req.headers["x-payment"] ||
      req.headers["x-x402-payment"] ||
      req.headers["payment"];

    if (!paymentHeader) {
      console.log("⚠️  No payment header found, returning 402");
      console.log(
        "📋 Payment requirements:",
        JSON.stringify(paymentRequirements, null, 2)
      );

      return res
        .status(402)
        .set("Content-Type", "application/json")
        .set("X-Payment-Required", "true")
        .json(paymentRequirements);
    }

    console.log(`💳 Payment header received (${paymentHeader.length} chars)`);

    try {
      // Verify payment with facilitator
      const receipt = await verifyPaymentWithFacilitator(
        paymentHeader,
        expectedAmount,
        config.payTo
      );

      console.log("✅ Payment verified and settled on-chain");
      console.log(`   Transaction: ${receipt.txHash}`);
      console.log(`   Amount: ${receipt.amount} (${parseInt(receipt.amount) / 1_000_000} USDC)`);

      // Attach payment receipt to request
      req.paymentReceipt = receipt;

      // Set payment response headers for client
      res.set("X-Payment-Receipt", JSON.stringify({
        txHash: receipt.txHash,
        amount: receipt.amount,
        verified: true,
      }));

      next();
    } catch (error) {
      console.error("❌ Payment verification failed:", error.message);
      
      return res.status(402).json({
        error: "Payment verification failed",
        message: error.message,
        details: "The payment signature could not be verified or settled on-chain",
      });
    }
  };
}

/**
 * Pre-configured middleware for base prompt ($1.00 USDC)
 */
export function requireBasePromptPayment(payTo) {
  return requirePayment({
    price: "$1.00",
    payTo,
    resource: "base-prompt",
    description: "Initialize AI courtroom session with base prompt",
  });
}

/**
 * Pre-configured middleware for discussion round ($1.50 USDC)
 */
export function requireDiscussionPayment(payTo) {
  return requirePayment({
    price: "$1.50",
    payTo,
    resource: "discussion-round",
    description: "Continue deliberation with discussion round",
  });
}

export default {
  requirePayment,
  requireBasePromptPayment,
  requireDiscussionPayment,
};