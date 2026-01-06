use risc0_zkvm::{default_prover, ExecutorEnv};
use methods::METHOD_ELF;
use methods::METHOD_ID;
use std::fs;

fn main() {
    // 1. Read the transcript file
    let transcript = fs::read("transcript.bin")
        .expect("Failed to read transcript.bin");
    
    println!("📄 Transcript size: {} bytes", transcript.len());
    
    // 2. Build the execution environment with the transcript as input
    let env = ExecutorEnv::builder()
        .write(&transcript)
        .expect("Failed to write transcript to env")
        .build()
        .expect("Failed to build ExecutorEnv");
    
    println!("🔧 Starting zkVM proof generation...");
    
    // 3. Generate the proof
    let prover = default_prover();
    let prove_info = prover.prove(env, METHOD_ELF)
        .expect("Failed to generate proof");
    
    println!("✅ Proof generated successfully!");
    
    // 4. Extract the receipt and journal (public outputs)
    let receipt = prove_info.receipt;
    let journal = &receipt.journal.bytes;
    println!("📋 Journal size: {} bytes", journal.len());
    
    // 5. Verify the proof locally (optional but recommended)
    receipt.verify(METHOD_ID)
        .expect("Proof verification failed");
    println!("✅ Proof verified successfully!");
    
    // 6. Save the receipt (proof + journal)
    let receipt_bytes = bincode::serialize(&receipt)
        .expect("Failed to serialize receipt");
    
    fs::write("receipt.bin", &receipt_bytes)
        .expect("Failed to write receipt.bin");
    
    println!("💾 Receipt saved to receipt.bin ({} bytes)", receipt_bytes.len());
    
    // 7. Optionally save the journal separately for easy access
    fs::write("journal.bin", journal)
        .expect("Failed to write journal");
    
    println!("✅ ZK proof generation complete!");
}