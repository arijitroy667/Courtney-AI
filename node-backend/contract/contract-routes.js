import express from "express";
import { addProofHashToContract, getRandomNumber } from "./contract-client.js";

const router = express.Router();

const CONTRACT_ADDRESS = process.env.RANDOMNESS_CONTRACT_ADDRESS || "";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY || "";

// POST /api/contract/add-proof
// body: { proofHash: "0x..." }
router.post("/api/contract/add-proof", async (req, res) => {
  try {
    const { proofHash } = req.body;
    if (!proofHash)
      return res.status(400).json({ error: "proofHash required" });

    const txHash = await addProofHashToContract(proofHash);
    res.json({ ok: true, txHash });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// POST /api/contract/get-random
// no body required (server wallet will call)
router.post("/api/contract/get-random", async (req, res) => {
  try {
    const { paymentTxHash, userAddress } = req.body;

    const txHash = await getRandomNumber();
    res.json({ ok: true, txHash });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// POST /api/payment/request
router.post("/api/payment/request", async (req, res) => {
  try {
    const serverWallet = process.env.SERVER_WALLET_ADDRESS || account.address;
    res.json({ ok: true, serverWallet });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
