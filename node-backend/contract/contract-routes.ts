import express from "express";
import RandomnessContractClient from "./contract-client";

const router = express.Router();

const CONTRACT_ADDRESS = process.env.RANDOMNESS_CONTRACT_ADDRESS || "";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY || "";

const client = new RandomnessContractClient({
  rpcUrl: RPC_URL,
  privateKey: PRIVATE_KEY,
  contractAddress: CONTRACT_ADDRESS,
});

// POST /api/contract/add-proof
// body: { proofHash: "0x..." }
router.post("/api/contract/add-proof", async (req, res) => {
  try {
    const { proofHash } = req.body;
    if (!proofHash) return res.status(400).json({ error: "proofHash required" });

    const result = await client.addProofHash(proofHash);
    res.json({ ok: true, txHash: result.txHash });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// POST /api/contract/get-random
// no body required (server wallet will call)
router.post("/api/contract/get-random", async (req, res) => {
  try {
    const result = await client.getRandomNumber();
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;