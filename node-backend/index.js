import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { getAddress } from "viem";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import {
  calculateBasePromptFee,
  calculateTotalDiscussionFee,
} from "./functions/fee-calculation.js";
import { generateZkProofAndStore } from "./utils/ipfs-proof-storage.js";
import User from "./models/user.model.js";
import "./utils/mongodb-connect.js";

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your receiving wallet address
const payTo = getAddress("0x27F311887caa22400EDbf6338D917Fbb466CfeB1");

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

console.log("✅ X402 payment middleware loaded");

// Create facilitator client
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

// Create resource server and register EVM scheme for Base Sepolia
const server = new x402ResourceServer(facilitatorClient).register(
  "eip155:84532",
  new ExactEvmScheme()
);

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Payment",
      "X-X402-Payment",
      "Payment",
      "Access-Control-Expose-Headers",
    ],
    exposedHeaders: [
      "X-Payment-Response",
      "X-Payment",
      "X-X402-Payment",
      "X-Payment-Receipt",
    ],
  })
);

// Request logging middleware
// Request logging middleware - ENHANCED
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  console.log("📋 Headers:", {
    "x-payment": req.headers["x-payment"]
      ? `present (${req.headers["x-payment"].length} chars)`
      : "missing",
    "x-x402-payment": req.headers["x-x402-payment"] ? "present" : "missing",
    payment: req.headers["payment"] ? "present" : "missing",
    "content-type": req.headers["content-type"],
  });
  next();
});

// JSON parser - before route handlers
app.use(express.json());

// Apply X402 payment middleware
app.use(
  paymentMiddleware(
    {
      "POST /api/base-prompt/:wallet_address": {
        accepts: [
          {
            scheme: "exact",
            price: "$1.00", // 1 USDC
            network: "eip155:84532", // Base Sepolia
            payTo,
          },
        ],
        description: "Initialize AI courtroom session with base prompt",
        mimeType: "application/json",
      },
      "POST /api/discuss/:wallet_address": {
        accepts: [
          {
            scheme: "exact",
            price: "$1.50", // 1.5 USDC
            network: "eip155:84532",
            payTo,
          },
        ],
        description: "Continue deliberation with discussion round",
        mimeType: "application/json",
      },
    },
    server
  )
);

// Health check (free)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "x402-payment-gateway",
    payment: {
      enabled: true,
      network: "Base Sepolia",
      chainId: 84532,
      recipient: payTo,
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

  res.json({
    base_prompt: calculateBasePromptFee(),
    discussion_round_base: 1.5,
    boost_per_20_percent: 0.2,
    total_discussion_with_boost: calculateTotalDiscussionFee(boosts),
  });
});

// Base Prompt Endpoint (PAID - $1.00 USDC)
app.post("/api/base-prompt/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const { prompt } = req.body;

    console.log(`\n✅ Payment verified for base prompt: ${wallet_address}`);
    console.log("💰 Payment details:", req.payment); // This should be populated by @x402/express

    // Forward to FastAPI
    const response = await axios.post(
      `${FASTAPI_URL}/base-prompt/${wallet_address}`,
      { prompt }
    );

    console.log("✓ FastAPI responded successfully");

    res.json({
      ...response.data,
      fee_charged: calculateBasePromptFee(),
      payment_verified: true,
      payment_receipt: req.payment, // Include payment receipt
    });
  } catch (error) {
    console.error(
      "Error in base prompt:",
      error.response?.data || error.message
    );

    if (error.response?.data?.detail) {
      return res.status(error.response.status || 500).json({
        error: error.response.data.detail,
        details: error.response.data.detail,
      });
    }

    res.status(500).json({
      error: "Failed to process base prompt",
      details: error.message,
    });
  }
});

// Discussion Round Endpoint (PAID - $1.50 USDC)
app.post("/api/discuss/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const { round_no, user_boost } = req.body;

    console.log(
      `\n✅ Payment verified for discussion round: ${wallet_address}`
    );
    console.log("💰 Payment details:", req.payment); // This should be populated by @x402/express

    const totalFee = calculateTotalDiscussionFee(user_boost || [0, 0, 0]);

    const response = await axios.post(
      `${FASTAPI_URL}/discuss/${wallet_address}`,
      { round_no, user_boost }
    );

    console.log("✓ FastAPI responded successfully");

    res.json({
      ...response.data,
      fee_charged: totalFee,
      payment_verified: true,
      payment_receipt: req.payment, // Include payment receipt
    });
  } catch (error) {
    console.error("Error in discuss:", error.response?.data || error.message);

    if (error.response?.data?.detail) {
      return res.status(error.response.status || 500).json({
        error: error.response.data.detail,
        details: error.response.data.detail,
      });
    }

    res.status(500).json({
      error: "Failed to process discussion round",
      details: error.message,
    });
  }
});

// Verdict Endpoint (FREE - no payment required)
app.post("/api/verdict/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const response = await axios.post(
      `${FASTAPI_URL}/verdict/${wallet_address}`
    );

    const verdictData = response.data;

    // 1. Write transcript to temp directory
    const tempDir = path.join(__dirname, "../tmp");
    await fs.mkdir(tempDir, { recursive: true });
    const transcriptPath = path.join(
      tempDir,
      `transcript_${wallet_address}.bin`
    );
    await fs.writeFile(
      transcriptPath,
      Buffer.from(verdictData.transcript, "base64")
    );

    // 2. Generate zk proof and store on IPFS
    const proofCid = await generateZkProofAndStore(transcriptPath);

    // 3. Save to MongoDB
    try {
      let user = await User.findOne({ wallet_address });

      if (!user) {
        user = new User({
          wallet_address,
          courtney_reports: [],
        });
      }

      user.courtney_reports.push({
        content_cid: `ipfs://${proofCid}`,
        payment_receipt: "verdict-no-charge",
      });

      await user.save();
      console.log(`✓ Verdict saved to MongoDB for ${wallet_address}`);
    } catch (dbError) {
      console.error("MongoDB save error:", dbError);
    }

    res.json({
      ...verdictData,
      content_cid: `ipfs://${proofCid}`,
    });
  } catch (error) {
    console.error("Error in verdict:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to generate verdict",
      details: error.message,
    });
  }
});

// Get user's past reports (free)
app.get("/api/reports/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const user = await User.findOne({ wallet_address });

    if (!user) {
      return res.json({ reports: [] });
    }

    res.json({ reports: user.courtney_reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Delete session endpoint (free)
app.delete("/api/session/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    await axios.delete(`${FASTAPI_URL}/session/${wallet_address}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete session" });
  }
});

const PORT = process.env.PORT || 4021;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   Courtney AI - x402 Payment Gateway                           ║
║   Server running on http://localhost:${PORT}                      ║
║                                                                ║
║   PAID Endpoints:                                              ║
║   POST /api/base-prompt/:wallet ($1.00 USDC)                   ║
║   POST /api/discuss/:wallet ($1.50 USDC)                       ║
║                                                                ║
║   FREE Endpoints:                                              ║
║   POST /api/verdict/:wallet                                    ║
║   GET  /api/fees                                               ║
║   GET  /api/reports/:wallet                                    ║
║   GET  /health                                                 ║
║                                                                ║
║   Network: Base Sepolia (Chain ID: 84532)                      ║
║   Recipient: ${payTo}    ║
║   Facilitator: https://x402.org/facilitator                    ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
