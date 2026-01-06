import sqlite3
import json
import time
from typing import Optional, Dict, Any
import logging
from contextlib import asynccontextmanager
import aiosqlite

logger = logging.getLogger(__name__)

DATABASE_PATH = "courtroom_sessions.db"

async def init_db():
    """Initialize the database with the sessions table"""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                wallet_address TEXT PRIMARY KEY,
                base_prompt TEXT NOT NULL,
                round INTEGER NOT NULL,
                agents TEXT NOT NULL,
                confidence_scores TEXT NOT NULL,
                confidence_penalties TEXT NOT NULL,
                user_boost TEXT NOT NULL,
                vector_store_name TEXT,
                sealed BOOLEAN NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            )
        """)
        await db.commit()
        logger.info("✓ Database initialized successfully")

async def create_session(wallet_address: str, session_data: Dict[str, Any]) -> bool:
    """Create a new session for a wallet address"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            await db.execute("""
                INSERT INTO sessions (
                    wallet_address, base_prompt, round, agents, 
                    confidence_scores, confidence_penalties, user_boost,
                    vector_store_name, sealed, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                wallet_address,
                session_data["base_prompt"],
                session_data["round"],
                json.dumps(session_data["agents"]),
                json.dumps(session_data["confidence_scores"]),
                json.dumps(session_data["confidence_penalties"]),
                json.dumps(session_data["user_boost"]),
                session_data["vector_store_name"],
                session_data["sealed"],
                session_data["created_at"]
            ))
            await db.commit()
            return True
    except sqlite3.IntegrityError:
        logger.warning(f"Session already exists for wallet: {wallet_address}")
        return False
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        return False

async def get_session(wallet_address: str) -> Optional[Dict[str, Any]]:
    """Get session data for a wallet address"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM sessions WHERE wallet_address = ?", 
                (wallet_address,)
            ) as cursor:
                row = await cursor.fetchone()
                if row:
                    return {
                        "wallet": row["wallet_address"],
                        "base_prompt": row["base_prompt"],
                        "round": row["round"],
                        "agents": json.loads(row["agents"]),
                        "confidence_scores": json.loads(row["confidence_scores"]),
                        "confidence_penalties": json.loads(row["confidence_penalties"]),
                        "user_boost": json.loads(row["user_boost"]),
                        "vector_store_name": row["vector_store_name"],
                        "sealed": bool(row["sealed"]),
                        "created_at": row["created_at"]
                    }
                return None
    except Exception as e:
        logger.error(f"Error getting session: {e}")
        return None

async def update_session(wallet_address: str, session_data: Dict[str, Any]) -> bool:
    """Update an existing session"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            await db.execute("""
                UPDATE sessions SET
                    base_prompt = ?,
                    round = ?,
                    agents = ?,
                    confidence_scores = ?,
                    confidence_penalties = ?,
                    user_boost = ?,
                    vector_store_name = ?,
                    sealed = ?
                WHERE wallet_address = ?
            """, (
                session_data["base_prompt"],
                session_data["round"],
                json.dumps(session_data["agents"]),
                json.dumps(session_data["confidence_scores"]),
                json.dumps(session_data["confidence_penalties"]),
                json.dumps(session_data["user_boost"]),
                session_data["vector_store_name"],
                session_data["sealed"],
                wallet_address
            ))
            await db.commit()
            return True
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        return False

async def delete_session(wallet_address: str) -> bool:
    """Delete a session"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            await db.execute(
                "DELETE FROM sessions WHERE wallet_address = ?", 
                (wallet_address,)
            )
            await db.commit()
            return True
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        return False

async def session_exists(wallet_address: str) -> bool:
    """Check if a session exists"""
    try:
        async with aiosqlite.connect(DATABASE_PATH) as db:
            async with db.execute(
                "SELECT 1 FROM sessions WHERE wallet_address = ? LIMIT 1", 
                (wallet_address,)
            ) as cursor:
                row = await cursor.fetchone()
                return row is not None
    except Exception as e:
        logger.error(f"Error checking session existence: {e}")
        return False

async def cleanup_old_sessions(max_age_seconds: int = 86400):
    """Delete sessions older than max_age_seconds (default: 24 hours)"""
    try:
        cutoff_time = int(time.time()) - max_age_seconds
        async with aiosqlite.connect(DATABASE_PATH) as db:
            result = await db.execute(
                "DELETE FROM sessions WHERE created_at < ?", 
                (cutoff_time,)
            )
            await db.commit()
            deleted_count = result.rowcount
            logger.info(f"Cleaned up {deleted_count} old sessions")
            return deleted_count
    except Exception as e:
        logger.error(f"Error cleaning up old sessions: {e}")
        return 0