import { PinataSDK } from "pinata";
import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Pinata-IPFS
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

export async function generateZkProofAndStore(transcriptPath) {
  // 1. Copy transcript to prover directory as transcript.bin
  const proverDir = path.resolve(
    __dirname,
    "../../agent-courtroom-proof/host"
  );
  const proverTranscriptPath = path.join(proverDir, "transcript.bin");
  await fs.copyFile(transcriptPath, proverTranscriptPath);

  // 2. Call the Rust prover
  await new Promise((resolve, reject) => {
    execFile(
      "cargo",
      ["run", "--release"],
      { cwd: proverDir },
      (error, stdout, stderr) => {
        if (error) {
          console.error("RISC0 prover error:", stderr);
          return reject(error);
        }
        console.log("RISC0 prover output:", stdout);
        resolve();
      }
    );
  });

  // 3. Read the generated proof
  const proofPath = path.join(proverDir, "receipt.bin");
  const proofBuffer = await fs.readFile(proofPath);

  // 4. Upload to IPFS via Pinata
  const blob = new Blob([proofBuffer]);
  const file = new File([blob], "receipt.bin", { type: "application/octet-stream" });
  const upload = await pinata.upload.file(file);

  // 5. Return the CID
  return upload.cid;
}