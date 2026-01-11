import { createThirdwebClient } from "thirdweb";
import { facilitator, settlePayment } from "thirdweb/x402";
import { monadTestnet } from "thirdweb/chains";

if (!process.env.SECRET_KEY) {
  throw new Error("SECRET_KEY environment variable is not set");
}
const client = createThirdwebClient({
  secretKey: process.env.SECRET_KEY,
});

const thirdwebX402Facilitator = facilitator({
  client,
  serverWalletAddress: process.env.SERVER_WALLET,
});

const USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

/**
 * Verify and settle payment using Thirdweb X402
 */
async function verifyAndSettlePayment(req, config) {
  try {
    console.log("🔍 Verifying payment with Thirdweb X402...");

    const paymentData =
      req.headers["x-payment"] ||
      req.headers["x-x402-payment"] ||
      req.headers["payment"];

    if (!paymentData) {
      return null;
    }

    const result = await settlePayment({
      resourceUrl: `${config.baseUrl}${req.path}`,
      method: req.method,
      paymentData,
      network: "eip155:10413",
      price: config.price,
      payTo: config.payTo,
      facilitator: thirdwebX402Facilitator,
    });

    if (result.status === 200) {
      console.log("✅ Payment settled on-chain");
      console.log(`   Transaction: ${result.paymentReceipt.txHash}`);

      return {
        verified: true,
        txHash: result.paymentReceipt.txHash,
        amount: result.paymentReceipt.balance,
        from: result.paymentReceipt.from,
        to: result.paymentReceipt.to,
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Payment verification failed:", error.message);
    throw error;
  }
}

/**
 * Create payment requirements object for 402 response
 */
function createPaymentRequirements(config) {
  const { price, payTo, resource, description } = config;

  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "eip155:10413", // Monad
        maxAmountRequired: price,
        resource: resource || "protected-resource",
        description: description || "Payment required for access",
        payTo: payTo,
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
 * X402 Payment Middleware Factory using Thirdweb
 */
export function requirePayment(config) {
  const paymentRequirements = createPaymentRequirements(config);

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
      // Verify and settle payment with Thirdweb X402
      const receipt = await verifyAndSettlePayment(req, config);

      if (!receipt) {
        console.log("⚠️  Payment verification returned no receipt");
        return res.status(402).json({
          error: "Payment verification failed",
          message: "Unable to verify payment",
          details: "The payment could not be verified or settled on-chain",
        });
      }

      console.log("✅ Payment verified and settled on-chain");
      console.log(`   Transaction: ${receipt.txHash}`);
      console.log(`   Amount: ${receipt.amount}`);

      // Attach payment receipt to request
      req.paymentReceipt = receipt;

      // Set payment response headers for client
      res.set(
        "X-Payment-Receipt",
        JSON.stringify({
          txHash: receipt.txHash,
          amount: receipt.amount,
          verified: true,
        })
      );

      next();
    } catch (error) {
      console.error("❌ Payment verification failed:", error.message);

      return res.status(402).json({
        error: "Payment verification failed",
        message: error.message,
        details:
          "The payment signature could not be verified or settled on-chain",
      });
    }
  };
}

/**
 * Pre-configured middleware for base prompt ($1.00 USDC)
 */
export function requireBasePromptPayment(payTo, baseUrl) {
  return requirePayment({
    price: "$1.00",
    payTo,
    baseUrl,
    resource: "base-prompt",
    description: "Initialize AI courtroom session with base prompt",
  });
}

/**
 * Pre-configured middleware for discussion round ($1.50 USDC)
 */
export function requireDiscussionPayment(payTo, baseUrl) {
  return requirePayment({
    price: "$1.50",
    payTo,
    baseUrl,
    resource: "discussion-round",
    description: "Continue deliberation with discussion round",
  });
}

export default {
  requirePayment,
  requireBasePromptPayment,
  requireDiscussionPayment,
};
