from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from orchestrator.orchestrator import run_all_agents,run_final_verdict, run_confidence_scores_observer
from redisdb.redis_client import redis_client,ping_redis
import time, json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

app = FastAPI(
    title="Courtney AI Backend",
    description="Backend API for Courtney AI application",
    version="1.0.0"
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class BasePromptRequest(BaseModel):
    prompt: str

class DiscussionRequest(BaseModel):
    round_no: int
    user_boost: list # List of user boost [0,1] for each agent

@router.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
async def read_root():
    return {"Message": "This is a private API",
            "Routes":   """
                        /health - Health Check
                        /base-prompt/user_wallet_address - Base Prompt Endpoint
                        /discuss/round_no - Discussion with round no Endpoint
                        /verdict/user_wallet_address- Final decision Endpoint
                        """
            }

app.include_router(router)

@app.get("/health")
def read_health():
    redis_status = "connected"
    try:
        redis_client.ping()
    except Exception as e:
        redis_status = f"disconnected: {str(e)}"
    
    return {
        "status": "ok",
        "redis": redis_status
    }


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
{json.dumps(session['agents'], indent=2)}

Caution : Your confidence score affects your credibility in the final verdict.
"""

    responses, vector_store = await run_all_agents(discussion_prompt, session['vector_store_name'], body.round_no)

    # Extract confidence scores from each agent's response
    recent_confidence_scores = [
        responses["gpt"].get("confidence_score"),
        responses["grok"].get("confidence_score"),
        responses["gemini"].get("confidence_score"),
    ]

    #confidence penalty calculation by orchestrator
    confidence_penalty = await run_confidence_scores_observer(
        recent_confidence_scores, 
        session["confidence_scores"][body.round_no - 2]
    )

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
        # Return cached verdict and delete session
        verdict_result = session.get("final_verdict")
        await redis_client.delete(key)
        logger.info(f"✓ Redis session cleared for wallet: {wallet_address}")
        
        return {
            "wallet": wallet_address,
            "verdict": verdict_result,  # Make sure this has the expected structure
            "sealed": True
        }

    final_verdict_prompt = f"""
Base prompt:
{session['base_prompt']}

Final agent responses:
{json.dumps(session['agents'], indent=2)}

Produce final verdict.
"""

    verdict_result = await run_final_verdict(
        final_verdict_prompt, 
        session["confidence_scores"], 
        session["confidence_penalties"], 
        session["user_boost"]
    )

    logger.info(f"✓ Verdict generated for wallet: {wallet_address}")
    logger.info(f"Verdict structure: {verdict_result}")  # Debug log
    
    # Delete the Redis session immediately after generating verdict
    await redis_client.delete(key)
    logger.info(f"✓ Redis session cleared for wallet: {wallet_address}")

    return {
        "wallet": wallet_address,
        "verdict": verdict_result,
        "sealed": True
    }


@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Courtney AI Analysis API v1.0 Starting...")
    logger.info("Advanced Backend - All services in one place")
    logger.info(f"AI Models: Gemini, Grok, GPT")
    logger.info("=" * 60)
    
    # Test Redis connection
    try:
        logger.info("Testing Redis connection...")
        is_connected = await ping_redis()
        if is_connected:
            logger.info("✓ Redis connected successfully")
            # Test set/get
            await redis_client.set("test_key", "test_value", ex=10)
            result = await redis_client.get("test_key")
            logger.info(f"✓ Redis test successful: {result}")
            await redis_client.delete("test_key")
        else:
            logger.warning("✗ Redis connection failed - Application will continue but sessions won't persist")
    except Exception as e:
        logger.error(f"✗ Redis connection error: {type(e).__name__}: {e}")
        logger.warning("Application will continue but Redis features will be unavailable")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down API...")
    try:
        await redis_client.close()
        logger.info("Redis connection closed")
    except Exception as e:
        logger.warning(f"Error closing Redis connection: {e}")
    logger.info("Shutdown complete. Goodbye!")


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT",8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False, log_level="info")