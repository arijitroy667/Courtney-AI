import "dotenv/config";
import express from "express";
import axios from "axios";
import { getAddress } from "viem";
import { createThirdwebClient } from "thirdweb";
import { facilitator, settlePayment } from "thirdweb/x402";
import {
  calculateBasePromptFee,
  calculateDiscussionRoundFee,
  calculateTotalDiscussionFee,
  calculateBoostFee,
} from "./functions/fee-calculation.js";
import { generateZkProofAndStore } from "./utils/ipfs-proof-storage.js";
import contractRoutes from "./contract/contract-routes.js";
import { addProofHashToContract } from "./contract/contract-client.js";

const app = express();

// Your receiving wallet address
const payTo = getAddress(
  process.env.SERVER_WALLET || "0x27F311887caa22400EDbf6338D917Fbb466CfeB1"
);

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

// Base URL for this server
const BASE_URL = process.env.BASE_URL || "http://localhost:4021";

// Create Thirdweb client
const client = createThirdwebClient({
  secretKey: process.env.SECRET_KEY,
});

// Create X402 facilitator
const thirdwebX402Facilitator = facilitator({
  client,
  serverWalletAddress: payTo,
});

console.log("✅ Thirdweb X402 payment gateway loaded");

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Payment, X-X402-Payment, Payment, Access-Control-Expose-Headers"
  );
  res.header("Access-Control-Expose-Headers", "X-Payment-Receipt");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// JSON parser - MUST come before any routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  console.log("📋 Headers:", {
    "x-payment": req.headers["x-payment"]
      ? `present (${req.headers["x-payment"].length} chars)`
      : "missing",
    "content-type": req.headers["content-type"],
  });
  console.log(
    "📦 Body:",
    req.body ? JSON.stringify(req.body).substring(0, 200) : "empty"
  );
  next();
});

// JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(contractRoutes);

// Health check (free)
app.get("/health", (req, res) => {
  console.log("💚 Health check requested");
  res.json({
    status: "ok",
    service: "x402-payment-gateway",
    timestamp: new Date().toISOString(),
    payment: {
      enabled: true,
      network: "Base Sepolia",
      chainId: 84532,
      recipient: payTo,
      provider: "Thirdweb X402",
    },
  });
});

// Get fee estimates (free)
app.get("/api/fees", (req, res) => {
  const { user_boost } = req.query;

  let boosts = [0, 0, 0];
  if (user_boost) {
    try {
      boosts = JSON.parse(user_boost);
    } catch (e) {
      console.error("Invalid boost format");
    }
  }

  const baseFee = calculateBasePromptFee();
  const discussionBaseFee = calculateDiscussionRoundFee();
  const boostFee = calculateBoostFee(boosts);
  const totalDiscussionFee = calculateTotalDiscussionFee(boosts);

  res.json({
    base_prompt: baseFee,
    discussion_round_base: discussionBaseFee,
    boost_fee: boostFee,
    boost_per_20_percent: 0.2,
    total_discussion_with_boost: totalDiscussionFee,
    user_boost: boosts,
  });
});

// Base Prompt Endpoint (PAID)
app.post("/api/base-prompt/:wallet_address", async (req, res) => {
  const { wallet_address } = req.params;
  const { prompt } = req.body;

  console.log(`\n🔐 Base Prompt Request: ${wallet_address}`);
  console.log(`📝 Prompt: ${prompt?.substring(0, 100)}...`);

  try {
    const feeInUSDC = calculateBasePromptFee();
    const priceString = `$${feeInUSDC.toFixed(2)}`;

    console.log(`💰 Required fee: ${priceString}`);

    // Get payment data from header
    const paymentData = req.headers["x-payment"];

    // Use Thirdweb settlePayment
    const result = await settlePayment({
      resourceUrl: `${BASE_URL}/api/base-prompt/${wallet_address}`,
      method: "POST",
      paymentData,
      network: "eip155:84532", // Base Sepolia
      price: priceString,
      payTo: payTo,
      facilitator: thirdwebX402Facilitator,
    });

    // If payment required (402), return the payment requirements
    if (result.status === 402) {
      console.log("⚠️ Payment required, returning 402");
      return res
        .status(402)
        .set(result.responseHeaders || {})
        .json(result.responseBody);
    }

    // If payment failed
    if (result.status !== 200) {
      console.log(`❌ Payment failed with status ${result.status}`);
      return res
        .status(result.status)
        .set(result.responseHeaders || {})
        .json(result.responseBody);
    }

    // Payment successful - proceed with API call
    console.log("✅ Payment settled successfully");
    console.log(`   Transaction: ${result.paymentReceipt}`);

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        message: "Prompt is required and must be a string",
      });
    }

    console.log(
      `🔄 Forwarding to FastAPI: ${FASTAPI_URL}/base-prompt/${wallet_address}`
    );

    const response = await axios.post(
      `${FASTAPI_URL}/base-prompt/${wallet_address}`,
      { prompt },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("✓ FastAPI responded successfully");

    res.set(
      "X-Payment-Receipt",
      JSON.stringify({
        txHash: result.paymentReceipt?.txHash,
        verified: true,
        priceUSDC: feeInUSDC,
      })
    );

    res.json({
      ...response.data,
      fee_charged: feeInUSDC,
      payment_verified: true,
      payment_receipt: result.paymentReceipt,
    });
  } catch (error) {
    console.error("❌ Error in base prompt:", error.message);

    if (error.response?.data?.detail) {
      return res.status(error.response.status || 500).json({
        error: error.response.data.detail,
      });
    }

    res.status(500).json({
      error: "Failed to process base prompt",
      details: error.message,
    });
  }
});

// Discussion Round Endpoint (PAID)
app.post("/api/discuss/:wallet_address", async (req, res) => {
  const { wallet_address } = req.params;
  const { round_no, user_boost } = req.body;

  console.log(`\n🔐 Discussion Round Request: ${wallet_address}`);
  console.log(`   Round: ${round_no}`);
  console.log(`   User boost: ${JSON.stringify(user_boost)}`);

  try {
    const boosts = user_boost || [0, 0, 0];
    const totalFee = calculateTotalDiscussionFee(boosts);
    const priceString = `$${totalFee.toFixed(2)}`;

    console.log(`💰 Required fee: ${priceString}`);

    const paymentData = req.headers["x-payment"];

    const result = await settlePayment({
      resourceUrl: `${BASE_URL}/api/discuss/${wallet_address}`,
      method: "POST",
      paymentData,
      network: "eip155:84532",
      price: priceString,
      payTo: payTo,
      facilitator: thirdwebX402Facilitator,
    });

    if (result.status === 402) {
      console.log("⚠️ Payment required, returning 402");
      return res
        .status(402)
        .set(result.responseHeaders || {})
        .json(result.responseBody);
    }

    if (result.status !== 200) {
      return res
        .status(result.status)
        .set(result.responseHeaders || {})
        .json(result.responseBody);
    }

    console.log("✅ Payment settled successfully");

    const response = await axios.post(
      `${FASTAPI_URL}/discuss/${wallet_address}`,
      { round_no, user_boost: boosts }
    );

    res.set(
      "X-Payment-Receipt",
      JSON.stringify({
        txHash: result.paymentReceipt?.txHash,
        verified: true,
        priceUSDC: totalFee,
      })
    );

    res.json({
      ...response.data,
      fee_charged: totalFee,
      payment_verified: true,
      payment_receipt: result.paymentReceipt,
    });
  } catch (error) {
    console.error("Error in discuss:", error.message);
    res.status(500).json({
      error: "Failed to process discussion round",
      details: error.message,
    });
  }
});

// Verdict Endpoint (FREE)
app.post("/api/verdict/:wallet_address", async (req, res) => {
  const { wallet_address } = req.params;

  console.log(`\n📜 Verdict Request: ${wallet_address} (FREE)`);

  try {
    const response = await fetch(`${FASTAPI_URL}/verdict/${wallet_address}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.statusText}`);
    }

    const verdictData = await response.json();

    try {
      console.log("🔐 Generating ZK proof for verdict...");
      const proofResult = await generateZkProofAndStore(verdictData);
      console.log(`✓ Proof uploaded to IPFS: ${proofResult.cid}`);

      verdictData.proof = {
        cid: proofResult.cid,
        url: `https://gateway.pinata.cloud/ipfs/${proofResult.cid}`,
        verdict_hash: proofResult.verdict_hash,
        method_id: proofResult.method_id,
      };

      // Add proof hash to contract for RNG
      try {
        console.log("📝 Adding proof hash to RNG contract...");
        const txHash = await addProofHashToContract(proofResult.verdict_hash);
        console.log(`✅ Proof hash added to contract. Tx: ${txHash}`);
        verdictData.proof.contract_tx = txHash;
      } catch (contractError) {
        console.error("Failed to add proof hash to contract:", contractError);
        verdictData.proof.contract_error = contractError.message;
      }
    } catch (proofError) {
      console.error("Failed to generate ZK proof:", proofError);
      verdictData.proof_error = proofError.message;
    }

    res.json({
      ...verdictData,
      fee_charged: 0,
    });
  } catch (error) {
    console.error("Verdict error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's past reports (free)
app.get("/api/reports/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    console.log(`\n📋 Reports Request: ${wallet_address} (FREE)`);
    res.json({ reports: [], fee_charged: 0 });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Delete session endpoint (free)
app.delete("/api/session/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    console.log(`\n🗑️ Delete Session Request: ${wallet_address} (FREE)`);
    await axios.delete(`${FASTAPI_URL}/session/${wallet_address}`);
    res.json({ success: true, fee_charged: 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete session" });
  }
});

const PORT = process.env.PORT || 4021;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   Courtney AI - Thirdweb X402 Payment Gateway                  ║
║   Server running on http://localhost:${PORT}                      ║
║                                                                ║
║   PAID Endpoints (via Thirdweb X402):                          ║
║   POST /api/base-prompt/:wallet ($${calculateBasePromptFee().toFixed(
    2
  )} USDC)               ║
║   POST /api/discuss/:wallet ($${calculateDiscussionRoundFee().toFixed(
    2
  )} USDC + boost)          ║
║                                                                ║
║   FREE Endpoints:                                              ║
║   POST /api/verdict/:wallet                                    ║
║   GET  /api/fees                                               ║
║   GET  /api/reports/:wallet                                    ║
║   GET  /health                                                 ║
║                                                                ║
║   Network: Monad Testnet (eip155:10413)                         ║
║   Recipient: ${payTo}        ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
