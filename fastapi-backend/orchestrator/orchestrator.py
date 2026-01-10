import asyncio
from agents.gpt_agent import run_gpt
from agents.grok_agent import run_grok
from agents.gemini_agent import run_gemini
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
import uuid
from math import exp,sqrt

# Helper to create or load a ChromaDB collection
def get_chroma_collection(collection_name):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    return Chroma(collection_name=collection_name, embedding_function=embeddings)

# Store a new document (prompt + responses) in ChromaDB
def store_round_in_chroma(collection, prompt, responses, round_no):
    doc = f"Round {round_no}\nPrompt:\n{prompt}\nResponses:\n{responses}"
    collection.add_texts([doc], ids=[str(uuid.uuid4())])

# Retrieve relevant history (all docs for now, or use similarity search)
def retrieve_history_from_chroma(collection, k=5):
    # For now, just return all docs as context
    docs = collection.get()["documents"]
    return "\n\n".join(docs[-k:]) if docs else ""

# parallel execution
async def run_all_agents(prompt: str, collection_name, round_no: int):
    # Define identities for each agent
    gpt_identity = "You are GPT, an expert advisor."
    grok_identity = "You are Grok, an expert advisor."
    gemini_identity = "You are Gemini, an expert advisor."

     # If collection_name is None, create a new one
    if collection_name is None:
        collection_name = str(uuid.uuid4())
        collection = get_chroma_collection(collection_name)
        context = ""
    else:
        collection = get_chroma_collection(collection_name)
        context = retrieve_history_from_chroma(collection)

    # Add context to prompt for discuss rounds
    full_prompt = f"{context}\n\n{prompt}" if context else prompt

    # Concatenate identity with the prompt for each agent
    gpt_prompt = f"{gpt_identity}\n{full_prompt}"
    grok_prompt = f"{grok_identity}\n{full_prompt}"
    gemini_prompt = f"{gemini_identity}\n{full_prompt}"

    gpt, grok, gemini = await asyncio.gather(
        run_gpt(gpt_prompt),
        run_grok(grok_prompt),
        run_gemini(gemini_prompt)
    )

    # Handle both Pydantic models and dict responses
    def extract_response(response):
        if isinstance(response, dict):
            return response
        else:
            return {
                "content": response.content,
                "confidence_score": response.confidence_score,
                "reason": response.Reason
            }

    responses = {
        "gpt": extract_response(gpt),
        "grok": extract_response(grok),
        "gemini": extract_response(gemini)
    }

    # Store this round in ChromaDB
    store_round_in_chroma(collection, prompt, responses, round_no)

    return responses, collection_name

async def run_confidence_scores_observer(recent_confidence_scores: list, previous_confidence_scores: list):
    """
    Penalize each LLM if its confidence score fluctuates by more than 20% from the previous round.
    Returns a list of penalties for each agent.
    """
    if not previous_confidence_scores or len(recent_confidence_scores) != len(previous_confidence_scores):
        return [0] * len(recent_confidence_scores)

    penalties = []
    for recent, previous in zip(recent_confidence_scores, previous_confidence_scores):
        if previous == 0:
            penalties.append(0)
        else:
            fluctuation = abs(recent - previous) / previous
            penalties.append((fluctuation-0.2)**2 if fluctuation > 0.2 else 0) # Quadratic penalty for fluctuations over 20%
    return penalties

async def run_final_verdict(prompt: str, confidence_scores: list, confidence_penalties: list, user_boost: list):
    
    # Lambda parameter for penalty scaling
    Lambda = 2.0
    # Stability multiplier calculation
    stability_multiplier = [
        exp(-Lambda * confidence_penalties[i])
        for i in range(len(confidence_penalties))
    ]

    # Beta for max additional influence = 1.5
    Beta = 1.5
    # User boost multiplier calculation
    user_boost_multiplier = [
        1 + Beta * (1 - exp(-user_boost[i]))
        for i in range(len(user_boost))
    ]

    # Agent score calculation
    """
        agent_score =
            base_score
            * sqrt(c_final)
            * stability_multiplier
            * user_boost_multiplier
    """
    agent_scores = [
        1.0 * sqrt((confidence_scores[-1][i])/10) * stability_multiplier[i] * user_boost_multiplier[i] # Here last round confidence scores are considered
        for i in range(len(confidence_scores[-1]))
    ]

    # The winner is the agent with the highest score
    winner_index = agent_scores.index(max(agent_scores))
    winner_identity = ["GPT","Grok","Gemini"][winner_index]

    final_verdict_prompt = f"""
    This is the final round. According to the scores, {winner_identity} has the highest influence.
    Hence, you should prioritize {winner_identity}'s perspective in your final verdict.
    {prompt}
    """

    if(winner_identity == "GPT"):
        final_response = await run_gpt(final_verdict_prompt)
    elif(winner_identity == "Grok"):
        final_response = await run_grok(final_verdict_prompt)
    else:
        final_response = await run_gemini(final_verdict_prompt)
    

    # Handle both Pydantic models and dict responses
    if isinstance(final_response, dict):
        return {
            "content": final_response["content"],
            "confidence_score": final_response["confidence_score"],
            "reason": final_response["reason"],
            "winner": winner_identity,
            "scores": {
                "gpt": agent_scores[0],
                "grok": agent_scores[1],
                "gemini": agent_scores[2]
            }
        }
    else:
        return {
            "content": final_response.content,
            "confidence_score": final_response.confidence_score,
            "reason": final_response.Reason,
            "winner": winner_identity,
            "scores": {
                "gpt": agent_scores[0],
                "grok": agent_scores[1],
                "gemini": agent_scores[2]
            }
        }

