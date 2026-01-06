use axum::{
    extract::Json,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use methods::{METHOD_ELF, METHOD_ID};
use risc0_zkvm::{default_prover, ExecutorEnv};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

#[derive(Debug, Deserialize)]
struct VerdictRequest {
    verdict: VerdictInfo,
    wallet: String,
}

#[derive(Debug, Deserialize)]
struct VerdictInfo {
    content: String,
    confidence_score: f64,
    reason: String,
    winner: String,
    scores: AgentScores,
}

#[derive(Debug, Deserialize)]
struct AgentScores {
    gpt: f64,
    grok: f64,
    gemini: f64,
}

#[derive(Debug, Serialize)]
struct ProofResponse {
    success: bool,
    proof_hex: Option<String>,
    journal_hex: Option<String>,
    method_id: Option<String>,
    verdict_hash: Option<String>,
    error: Option<String>,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
    service: String,
    risc0_dev_mode: bool,
}

#[tokio::main]
async fn main() {
    println!("🚀 Starting RISC Zero Prover API...");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/prove", post(generate_proof))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3030));
    println!("✅ Prover API listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> impl IntoResponse {
    let dev_mode = std::env::var("RISC0_DEV_MODE")
        .map(|v| v == "1")
        .unwrap_or(false);

    Json(HealthResponse {
        status: "ok".to_string(),
        service: "risc0-prover-api".to_string(),
        risc0_dev_mode: dev_mode,
    })
}

async fn generate_proof(Json(payload): Json<VerdictRequest>) -> impl IntoResponse {
    println!("📝 Received proof request for wallet: {}", payload.wallet);

    // Create transcript buffer from verdict data
    let transcript = create_transcript(&payload);
    println!("✓ Transcript created ({} bytes)", transcript.len());

    // Generate proof
    match generate_zk_proof(&transcript) {
        Ok((receipt_bytes, journal_bytes)) => {
            // Create verdict hash for verification
            let mut hasher = Sha256::new();
            hasher.update(&transcript);
            let verdict_hash = hex::encode(hasher.finalize());

            // Convert METHOD_ID ([u32; 8]) to bytes for hex encoding
            let method_id_bytes: Vec<u8> = METHOD_ID
                .iter()
                .flat_map(|&x| x.to_le_bytes())
                .collect();

            println!("✅ Proof generated successfully!");
            println!("   Receipt size: {} bytes", receipt_bytes.len());
            println!("   Journal size: {} bytes", journal_bytes.len());

            (
                StatusCode::OK,
                Json(ProofResponse {
                    success: true,
                    proof_hex: Some(hex::encode(&receipt_bytes)),
                    journal_hex: Some(hex::encode(&journal_bytes)),
                    method_id: Some(hex::encode(&method_id_bytes)),
                    verdict_hash: Some(verdict_hash),
                    error: None,
                }),
            )
        }
        Err(e) => {
            eprintln!("❌ Proof generation failed: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ProofResponse {
                    success: false,
                    proof_hex: None,
                    journal_hex: None,
                    method_id: None,
                    verdict_hash: None,
                    error: Some(e.to_string()),
                }),
            )
        }
    }
}

fn create_transcript(payload: &VerdictRequest) -> Vec<u8> {
    let mut buffer = vec![0u8; 17];

    // Verdict: 0 = guilty, 1 = innocent
    let verdict: u8 = if payload.verdict.winner.to_lowercase() == "innocent" {
        1
    } else {
        0
    };
    buffer[0] = verdict;

    // Confidence score (scaled by 100)
    let confidence = (payload.verdict.confidence_score * 100.0) as u32;
    buffer[1..5].copy_from_slice(&confidence.to_le_bytes());

    // Agent scores (scaled by 1000)
    let gpt_score = (payload.verdict.scores.gpt * 1000.0) as u32;
    let grok_score = (payload.verdict.scores.grok * 1000.0) as u32;
    let gemini_score = (payload.verdict.scores.gemini * 1000.0) as u32;

    buffer[5..9].copy_from_slice(&gpt_score.to_le_bytes());
    buffer[9..13].copy_from_slice(&grok_score.to_le_bytes());
    buffer[13..17].copy_from_slice(&gemini_score.to_le_bytes());

    buffer
}

fn generate_zk_proof(transcript: &[u8]) -> Result<(Vec<u8>, Vec<u8>), Box<dyn std::error::Error>> {
    println!("🔧 Building execution environment...");

    // Convert slice to Vec<u8> for serialization
    let transcript_vec: Vec<u8> = transcript.to_vec();

    let env = ExecutorEnv::builder()
        .write(&transcript_vec)?
        .build()?;

    println!("🔧 Running zkVM prover (this may take a while)...");

    let prover = default_prover();
    let prove_info = prover.prove(env, METHOD_ELF)?;

    let receipt = prove_info.receipt;
    let journal = receipt.journal.bytes.clone();

    // Verify proof locally
    println!("🔍 Verifying proof...");
    receipt.verify(METHOD_ID)?;
    println!("✓ Proof verified successfully!");

    // Serialize receipt
    let receipt_bytes = bincode::serialize(&receipt)?;

    Ok((receipt_bytes, journal))
}