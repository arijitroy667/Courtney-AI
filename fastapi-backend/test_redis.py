import asyncio
import redis.asyncio as redis
import os
from dotenv import load_dotenv
import socket

load_dotenv()

async def test_connection():
    HOST = os.getenv("REDIS_HOST")
    PASSWORD = os.getenv("REDIS_PASSWORD")
    PORT = int(os.getenv("REDIS_PORT", 15392))
    
    print(f"Host: {HOST}")
    print(f"Port: {PORT}")
    print(f"Password: {'*' * len(PASSWORD) if PASSWORD else 'None'}")
    
    # Test basic TCP connectivity first
    print("\n=== Testing TCP Connectivity ===")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((HOST, PORT))
        sock.close()
        if result == 0:
            print(f"✓ TCP connection successful to {HOST}:{PORT}")
        else:
            print(f"✗ TCP connection failed to {HOST}:{PORT} (error code: {result})")
            print("  → Check if Redis service is running and accessible")
            return
    except socket.gaierror as e:
        print(f"✗ DNS resolution failed: {e}")
        print("  → Check if the hostname is correct")
        return
    except Exception as e:
        print(f"✗ TCP test error: {type(e).__name__}: {e}")
        return
    
    # Test WITHOUT SSL first
    print("\n=== Testing WITHOUT SSL ===")
    client_no_ssl = redis.Redis(
        host=HOST,
        port=PORT,
        decode_responses=True,
        username="default",
        password=PASSWORD,
        socket_timeout=5,
        socket_connect_timeout=5,
        retry_on_timeout=False
    )
    
    try:
        result = await client_no_ssl.ping()
        print(f"✓ Connection successful (no SSL): {result}")
        
        await client_no_ssl.set("test", "hello", ex=10)
        value = await client_no_ssl.get("test")
        print(f"✓ Set/Get test: {value}")
        
        await client_no_ssl.delete("test")
        print("✓ All tests passed!")
        
        await client_no_ssl.close()
        return
    except Exception as e:
        print(f"✗ Error (no SSL): {type(e).__name__}: {e}")
        await client_no_ssl.close()
    
    # Test WITH SSL if no SSL failed
    print("\n=== Testing WITH SSL ===")
    client_ssl = redis.Redis(
        host=HOST,
        port=PORT,
        decode_responses=True,
        username="default",
        password=PASSWORD,
        ssl=True,
        ssl_cert_reqs=None,
        socket_timeout=5,
        socket_connect_timeout=5,
        retry_on_timeout=False
    )
    
    try:
        result = await client_ssl.ping()
        print(f"✓ Connection successful (SSL): {result}")
        
        await client_ssl.set("test", "hello", ex=10)
        value = await client_ssl.get("test")
        print(f"✓ Set/Get test: {value}")
        
        await client_ssl.delete("test")
        print("✓ All tests passed!")
        
        await client_ssl.close()
    except Exception as e:
        print(f"✗ Error (SSL): {type(e).__name__}: {e}")
        await client_ssl.close()

if __name__ == "__main__":
    asyncio.run(test_connection())