
---

# Agent Courtroom

**Verifiable Multi-Agent Reasoning Framework for Trustless AI Judgments**

Agent Courtroom is a **developer-first, research-grade platform** for building, simulating, and *cryptographically verifying* multi-agent AI reasoning workflows. While it ships with a courtroom metaphor (Judge, Prosecutor, Defense), the system is intentionally designed as **general-purpose agentic infrastructure** for high-stakes decision-making, audits, and AI research.

At its core, Agent Courtroom answers one uncomfortable question the AI world keeps dodging:

> *“How do you prove an AI actually reasoned the way it claims it did?”*

Short answer: **Zero-Knowledge proofs over agent execution.**

Long answer: keep reading.

---

## 1. System Overview

Agent Courtroom orchestrates multiple specialized AI agents, enforces deterministic reasoning pipelines, and generates **ZK proofs** that attest to:

* The **exact inputs** provided
* The **exact agent logic** executed
* The **exact outputs** produced
* Without revealing private prompts, intermediate thoughts, or proprietary logic

This makes it suitable for:

* AI governance
* Dispute resolution
* Research on agent collaboration
* Verifiable inference pipelines
* On-chain AI-triggered execution

The courtroom is a *skin*. The engine underneath is a **verifiable agent execution framework**.

---

## 2. Architectural Philosophy

### Why Multi-Agent?

Single-agent systems collapse under:

* Bias amplification
* Prompt injection
* Overconfidence
* No internal adversarial pressure

Agent Courtroom enforces **structured disagreement**:

* Prosecutor attacks claims
* Defense defends assumptions
* Judge aggregates reasoning under constraints

This mirrors adversarial systems used in:

* Formal verification
* Red teaming
* Distributed consensus

### Why ZK Proofs?

Logs can be faked. Hashes can be replayed. Screenshots are a joke.

ZK proofs give:

* **Non-interactive verification**
* **Tamper resistance**
* **On-chain compatibility**
* **Privacy preservation**

If it isn’t provable, it’s just vibes.

---

## 3. High-Level Architecture

```
User
 │
 │  (Case, Evidence, Payment)
 ▼
Frontend (Next.js)
 │
 │  API Calls
 ▼
Node Backend ────────► IPFS (Case Data, Verdicts)
 │        │
 │        └─────────► Blockchain (Payments, Anchors)
 │
 ▼
FastAPI AI Orchestrator
 │
 │  Agent Execution Trace
 ▼
RISC Zero zkVM
 │
 │  ZK Proof
 ▼
On-chain / Off-chain Verifier
```

---

## 4. Repository Structure (Explained Like You Care)

### `ai-courtroom/` — Frontend

A production-grade Web3 UI, not a demo page.

Responsibilities:

* Wallet authentication
* Case submission
* Live agent debate visualization
* Proof status tracking
* Verdict rendering

Design goals:

* Deterministic inputs
* Human-readable agent reasoning
* Minimal trust in backend claims

---

### `fastapi-backend/` — Agent Orchestration Engine

This is the **brain**.

Key responsibilities:

* Agent role assignment
* Prompt templating with strict schemas
* Debate turn ordering
* Scoring and aggregation logic
* Generating deterministic execution traces

Agents are not free-roaming chatbots.
They operate under **hard constraints**.

---

### `node-backend/` — Core API & Blockchain Bridge

This layer exists to keep AI engineers and blockchain engineers from hurting each other.

Responsibilities:

* Case lifecycle management
* User sessions
* Payment validation
* IPFS uploads (Pinata)
* Proof anchoring on-chain

No AI logic here. Just plumbing. Clean, boring, reliable.

---

### `agent-courtroom-proof/` — ZK Execution Verifier

This is where trust goes to die.

Responsibilities:

* Replay agent execution deterministically
* Hash inputs, prompts, and outputs
* Generate RISC Zero proofs
* Output succinct receipts verifiable on-chain

If this layer disagrees with the backend, the backend loses. Period.

---

## 5. Agent Execution Model

### Agent Roles

| Agent      | Responsibility                                    |
| ---------- | ------------------------------------------------- |
| Prosecutor | Identify contradictions, risks, and failure modes |
| Defense    | Justify assumptions, mitigate risks               |
| Judge      | Aggregate reasoning and issue verdict             |

### Turn-Based Execution

Agents execute in a **fixed, deterministic order**:

1. Evidence ingestion
2. Prosecutor analysis
3. Defense rebuttal
4. Judge synthesis
5. Verdict normalization

This ordering is **hard-coded** to ensure reproducibility.

---

## 6. Verdict Calculation Logic (Actual Math)

### Confidence Scoring

Each agent produces:

* `confidence_score ∈ [0, 1]`
* `penalty_score ∈ [0, 1]`

Stability multiplier:

```
stability_i = exp(-λ * penalty_i)
```

Final weighted confidence:

```
final_score = Σ(confidence_i * stability_i) / Σ(stability_i)
```

Where:

* λ controls penalty sensitivity (default = 2.0)
* High penalties exponentially reduce influence

This prevents:

* Loud but weak agents dominating
* Overconfident hallucinations

---

### Verdict Thresholding

```
if final_score ≥ 0.75 → ACCEPT
if 0.4 ≤ final_score < 0.75 → REVIEW
if final_score < 0.4 → REJECT
```

These thresholds are configurable per deployment.

---

## 7. Zero-Knowledge Proof Model

### What Is Proven

* Input hash
* Agent prompts
* Execution order
* Output hash
* Scoring math

### What Is Hidden

* Raw prompt text
* Chain-of-thought
* Intermediate embeddings
* Proprietary agent logic

This enables **verifiable inference without data leakage**.

---

## 8. User Onboarding Flow

### End User

1. Connect wallet
2. Submit case + evidence
3. Pay arbitration fee
4. Observe agent debate
5. Receive verdict + proof
6. Verify independently

### Developer / Researcher

1. Fork repository
2. Modify agent logic
3. Tune scoring functions
4. Run local ZK proofs
5. Benchmark agent behavior
6. Publish verifiable results

---

## 9. Use Cases Beyond “Courtroom”

This is the part people usually miss.

### Research Tooling

* Study agent disagreement patterns
* Benchmark LLM alignment strategies
* Analyze adversarial prompting resistance

### AI Governance

* Verifiable AI compliance reports
* Audit trails for automated decisions
* Regulator-friendly inference proofs

### Web3 Native AI

* AI-triggered smart contract execution
* On-chain randomness derived from ZK proofs
* Trust-minimized arbitration protocols

### Enterprise

* Policy enforcement engines
* Internal dispute resolution
* Decision justification systems

---

## 10. Security Model

| Threat           | Mitigation                      |
| ---------------- | ------------------------------- |
| Prompt injection | Strict schemas + role isolation |
| Model tampering  | ZK proof verification           |
| Backend lies     | zkVM replay                     |
| Data leakage     | ZK privacy guarantees           |
| Sybil users      | Wallet-based identity           |

---

## 11. Installation & Running (Reality Version)

### Frontend

```bash
cd ai-courtroom
npm install
npm run dev
```

### Node Backend

```bash
cd node-backend
npm install
cp .env.example .env
npm start
```

### AI Orchestrator

```bash
cd fastapi-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### ZK Proof Engine

```bash
cd agent-courtroom-proof
cargo build --release
```

---

## 12. Roadmap (The Serious One)

* Modular agent plugins
* On-chain verifier contracts
* ERC-based arbitration NFTs
* Formal verification of scoring math
* Multi-model agent ensembles
* zkML acceleration paths

---

## 13. Final Note

Agent Courtroom is not trying to replace judges, lawyers, or humans with opinions. It’s trying to replace **unverifiable AI decisions** with **provable reasoning systems**.

If your AI cannot explain itself *and* prove it behaved correctly, it shouldn’t be making decisions that matter.

This system exists because trust is expensive and vibes don’t scale.

---

