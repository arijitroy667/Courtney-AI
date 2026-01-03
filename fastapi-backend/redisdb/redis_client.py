import redis as redis
import os
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env

HOST = os.getenv("REDIS_HOST")
PASSWORD = os.getenv("REDIS_PASSWORD")

redis_client = redis.Redis(
    host=HOST,
    port=11785,
    decode_responses=True,
    username="default",
    password=PASSWORD,
)

