import redis.asyncio as redis
import os
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env

HOST = os.getenv("REDIS_HOST")
PASSWORD = os.getenv("REDIS_PASSWORD")
PORT = int(os.getenv("REDIS_PORT", 15392))

# Validate environment variables
if not HOST:
    raise ValueError("REDIS_HOST environment variable is not set")
if not PASSWORD:
    raise ValueError("REDIS_PASSWORD environment variable is not set")

print(f"Connecting to Redis at {HOST}:{PORT} (no SSL)")

redis_client = redis.Redis(
    host=HOST,
    port=PORT,
    decode_responses=True,
    username="default",
    password=PASSWORD,
    socket_timeout=10,
    socket_connect_timeout=10,
    retry_on_timeout=True,
    health_check_interval=30
)

async def ping_redis():
    """Test Redis connection"""
    try:
        result = await redis_client.ping()
        print(f"Redis ping successful: {result}")
        return result
    except redis.ConnectionError as e:
        print(f"Redis ConnectionError: {e}")
        return False
    except redis.TimeoutError as e:
        print(f"Redis TimeoutError: {e}")
        return False
    except Exception as e:
        print(f"Redis connection failed: {type(e).__name__}: {e}")
        return False