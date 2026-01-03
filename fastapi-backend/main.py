from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from orchestrator.orchestrator import run_all_agents,run_final_verdict, run_confidence_scores_observer
from redisdb.redis_client import redis_client
import time, json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Courtney AI Backend",
    description="Backend API for Courtney AI application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BasePromptRequest(BaseModel):
    prompt: str

class DiscussionRequest(BaseModel):
    round_no: int
    user_boost: list # List of user boost [0,1] for each agent

@app.get("/", include_in_schema=False)
def read_root():
    return {"Message": "This is a private API",
            "Routes":   """
                        /health - Health Check
                        /base-prompt/user_wallet_address - Base Prompt Endpoint
                        /discuss/round_no - Discussion with round no Endpoint
                        /verdict/user_wallet_address- Final decision Endpoint
                        """
            }

@app.get("/health")
def read_health():
    return {"status": "ok"}


@app.post("/base-prompt/{wallet_address}")
async def base_prompt(wallet_address: str, body: BasePromptRequest):
    key = f"session:{wallet_address}"

    if await redis_client.exists(key):
        raise HTTPException(status_code=400, detail="Session already exists")

    responses, vector_store = await run_all_agents(body.prompt, None, 1)

    # Extract confidence scores from each agent's response
    confidence_scores = [
        responses["gpt"].get("confidence_score"),
        responses["grok"].get("confidence_score"),
        responses["gemini"].get("confidence_score")
    ]

    session = {
        "wallet": wallet_address,
        "base_prompt": body.prompt,
        "round": 1,
        "agents": responses,
        "confidence_scores": [confidence_scores],
        "confidence_penalties": [0,0,0],
        "user_boost": [0,0,0],
        "vector_store_name": vector_store,
        "sealed": False,
        "created_at": int(time.time())
    }

    await redis_client.set(
        key,
        json.dumps(session),
        ex=86400  # 1 day TTL
    )

    return {
        "round": 1,
        "responses": responses,
        "confidence_scores": [confidence_scores]
    }

@app.post("/discuss/{wallet_address}")
async def discuss(wallet_address: str, body: DiscussionRequest):
    key = f"session:{wallet_address}"
    data = await redis_client.get(key)

    if not data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = json.loads(data)

    if session["sealed"]:
        raise HTTPException(status_code=403, detail="Session sealed")

    # Construct discussion prompt
    discussion_prompt = f"""
    here are the details for the discussion round {body.round_no}, provide your analysis accordingly :
Base prompt:
{session['base_prompt']}

Previous responses:
{session['agents']}

Caution : Your confidence score affects your credibility in the final verdict.
"""

    responses, vector_store = await run_all_agents(discussion_prompt, session['vector_store'], body.round_no)

    # Extract confidence scores from each agent's response
    recent_confidence_scores = [
        responses["gpt"].get("confidence_score"),
        responses["grok"].get("confidence_score"),
        responses["gemini"].get("confidence_score"),
    ]

    #confidence penalty calculation by orchestrator
    confidence_penalty = await run_confidence_scores_observer(recent_confidence_scores, session["confidence_scores"][body.round_no - 2])

    session["round"] = body.round_no
    session["agents"] = responses
    session["vector_store_name"] = vector_store

    #Summoing up the user boosts
    session["user_boost"] = [
        session["user_boost"][i] + body.user_boost[i]
        for i in range(len(session["user_boost"]))
    ]

    #summing up the penalties
    session["confidence_penalties"] = [
        session["confidence_penalties"][i] + confidence_penalty[i] # exponential penalty accumulation
        for i in range(len(confidence_penalty))
    ]

    if "confidence_scores" not in session or not isinstance(session["confidence_scores"], list):
        session["confidence_scores"] = []
    session["confidence_scores"].append(recent_confidence_scores)

    await redis_client.set(key, json.dumps(session), ex=86400)

    return {
        "round": body.round_no,
        "responses": responses,
        "confidence_scores": session["confidence_scores"]
    }

@app.post("/verdict/{wallet_address}")
async def verdict(wallet_address: str):
    key = f"session:{wallet_address}"
    data = await redis_client.get(key)

    if not data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = json.loads(data)

    if session["sealed"]:
        return {"verdict": "Already finalized"}

    final_verdict_prompt = f"""
Base prompt:
{session['base_prompt']}

Final agent responses:
{session['agents']}

Produce final verdict.
"""

    verdict = await run_final_verdict(final_verdict_prompt, session["confidence_scores"], session["confidence_penalties"], session["user_boost"])

    session["sealed"] = True
    session["final_verdict"] = verdict

    await redis_client.set(key, json.dumps(session), ex=86400)

    return {
        "wallet": wallet_address,
        "verdict": verdict,
        "sealed": True
    }


@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Courtney AI Analysis API v1.0 Starting...")
    logger.info("Advanced Backend - All services in one place")
    logger.info(f"AI Models: Gemini, Grok, GPT")
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down API...")
    logger.info("All caches and sessions cleared. Goodbye!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True, log_level="info")