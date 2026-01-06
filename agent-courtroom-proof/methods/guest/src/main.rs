#![no_std]
#![no_main]

use risc0_zkvm::guest::env;
use sha2::{Sha256, Digest};

extern crate alloc;
use alloc::vec::Vec;
use alloc::string::String;

risc0_zkvm::guest::entry!(main);

#[derive(Debug)]
struct VerdictData {
    final_verdict: u8, // 0 = guilty, 1 = innocent
    confidence_score: u32, // scaled by 100 (e.g., 75.5% = 7550)
    gpt_score: u32,
    grok_score: u32,
    gemini_score: u32,
}

pub fn main() {
    // 1. Read transcript bytes from host
    let transcript: Vec<u8> = env::read();
    
    // 2. Parse the verdict data from transcript
    let verdict = parse_verdict(&transcript);
    
    // 3. Verify the verdict computation is correct
    let computed_verdict = compute_verdict(&verdict);
    
    // 4. Create proof output (hash of verdict + metadata)
    let mut hasher = Sha256::new();
    hasher.update(&[computed_verdict.final_verdict]);
    hasher.update(&computed_verdict.confidence_score.to_le_bytes());
    hasher.update(&computed_verdict.gpt_score.to_le_bytes());
    hasher.update(&computed_verdict.grok_score.to_le_bytes());
    hasher.update(&computed_verdict.gemini_score.to_le_bytes());
    let verdict_hash: [u8; 32] = hasher.finalize().into();
    
    // 5. Commit the proof to the journal (this becomes public output)
    env::commit(&verdict_hash);
    env::commit(&computed_verdict.final_verdict);
    env::commit(&computed_verdict.confidence_score);
}

fn parse_verdict(transcript: &[u8]) -> VerdictData {
    // Parse your transcript format
    // This is a placeholder - adjust based on your actual transcript format
    VerdictData {
        final_verdict: transcript[0] % 2,
        confidence_score: u32::from_le_bytes([
            transcript[1], transcript[2], transcript[3], transcript[4]
        ]),
        gpt_score: u32::from_le_bytes([
            transcript[5], transcript[6], transcript[7], transcript[8]
        ]),
        grok_score: u32::from_le_bytes([
            transcript[9], transcript[10], transcript[11], transcript[12]
        ]),
        gemini_score: u32::from_le_bytes([
            transcript[13], transcript[14], transcript[15], transcript[16]
        ]),
    }
}

fn compute_verdict(data: &VerdictData) -> VerdictData {
    // Recompute the verdict using the same logic as your backend
    // This proves the computation was done correctly
    let avg_score = (data.gpt_score + data.grok_score + data.gemini_score) / 3;
    let final_verdict = if avg_score >= 5000 { 1 } else { 0 }; // 50% threshold
    
    VerdictData {
        final_verdict,
        confidence_score: data.confidence_score,
        gpt_score: data.gpt_score,
        grok_score: data.grok_score,
        gemini_score: data.gemini_score,
    }
}