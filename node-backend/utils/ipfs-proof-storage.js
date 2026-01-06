import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import FormData from "form-data";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RISC Zero Prover API URL
const PROVER_API_URL = process.env.PROVER_API_URL || "http://127.0.0.1:3030";
const PINATA_JWT = process.env.PINATA_JWT;

export async function generateZkProofAndStore(verdictData) {
  try {
    console.log("🔐 Calling RISC Zero Prover API...");
    console.log(`   URL: ${PROVER_API_URL}/prove`);

    // 1. Call the Rust prover API
    const response = await fetch(`${PROVER_API_URL}/prove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verdictData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Prover API error (${response.status}): ${errorText}`);
    }

    const proofResult = await response.json();

    if (!proofResult.success) {
      throw new Error(proofResult.error || "Proof generation failed");
    }

    console.log("✓ Proof received from prover API");
    console.log(`  Verdict hash: ${proofResult.verdict_hash}`);

    // 2. Convert hex proof to buffer
    const proofBuffer = Buffer.from(proofResult.proof_hex, "hex");
    console.log(`✓ Proof size: ${proofBuffer.length} bytes`);

    // 3. Upload to IPFS via Pinata v3 API - EXACT FORMAT
    console.log("📤 Uploading proof to IPFS via Pinata v3 API...");
    
    const formData = new FormData();
    
    // Follow exact API format from documentation
    formData.append("file", proofBuffer, {
      filename: `verdict-proof-${verdictData.wallet}-${Date.now()}.bin`,
      contentType: "application/octet-stream",
    });
    
    formData.append("name", `Verdict-Proof-${verdictData.wallet}`);
    
    // Add keyvalues as JSON string (exactly as in docs)
    formData.append("keyvalues", JSON.stringify({
      wallet: verdictData.wallet,
      verdict: verdictData.verdict.winner,
      confidence: verdictData.verdict.confidence_score.toString(),
      timestamp: Date.now().toString(),
      verdict_hash: proofResult.verdict_hash,
    }));

    // Use axios with proper timeout settings
    const uploadResponse = await axios.post(
      "https://uploads.pinata.cloud/v3/files",
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 190000, // 120 second timeout
      }
    );

    const uploadResult = uploadResponse.data;
    console.log(`✓ Proof uploaded to IPFS: ${uploadResult.data.cid}`);
    console.log(`  File ID: ${uploadResult.data.id}`);
    console.log(`  Size: ${uploadResult.data.size} bytes`);

    // 4. Return CID and metadata
    return {
      cid: uploadResult.data.cid,
      file_id: uploadResult.data.id,
      verdict_hash: proofResult.verdict_hash,
      method_id: proofResult.method_id,
      journal_hex: proofResult.journal_hex,
      proof_url: `https://${process.env.PINATA_GATEWAY} || "gateway.pinata.cloud"}/ipfs/${uploadResult.data.cid}`,
      size: uploadResult.data.size,
      created_at: uploadResult.data.created_at,
      is_duplicate: uploadResult.data.is_duplicate,
    };
  } catch (error) {
    console.error("Error generating ZK proof:", error);
    console.error("  Prover URL:", PROVER_API_URL);
    if (error.response) {
      console.error("  Pinata response:", JSON.stringify(error.response.data, null, 2));
      console.error("  Status:", error.response.status);
    }
    console.error("  Error details:", error.cause || error.message);
    throw error;
  }
}