from flask import request, jsonify
from functools import wraps
import time
import os
import logging

# Try to import Redis - will use in-memory fallback if not available
try:
    import redis
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'), 
        port=int(os.getenv('REDIS_PORT', 6379)), 
        db=int(os.getenv('REDIS_DB', 0)),
        decode_responses=True
    )
    # Test connection
    redis_client.ping()
    logging.info("Redis connection established for rate limiting")
except Exception as e:
    logging.warning(f"Redis connection failed, using in-memory rate limiting: {str(e)}")
    redis_client = None

# Fallback in-memory storage for rate limits if Redis is unavailable
in_memory_limits = {}

def rate_limit(limit=5, period=3600):
    """
    Rate limiting decorator for routes.
    
    Args:
        limit (int): Maximum number of requests
        period (int): Time period in seconds
        
    Returns:
        Function: Decorated route function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client IP
            client_ip = request.remote_addr
            
            # Create a key for this route and IP
            route = request.path
            key = f"rate_limit:{route}:{client_ip}"
            
            current_time = int(time.time())
            
            # Use Redis if available, otherwise fall back to in-memory
            if redis_client:
                try:
                    # Create or update the rate limit entry
                    pipe = redis_client.pipeline()
                    pipe.zremrangebyscore(key, 0, current_time - period)
                    pipe.zadd(key, {str(current_time): current_time})
                    pipe.zcard(key)
                    pipe.expire(key, period)
                    results = pipe.execute()
                    request_count = results[2]
                    
                except Exception as e:
                    logging.error(f"Redis rate limiting error: {str(e)}")
                    # Fall back to allowing the request on Redis error
                    return f(*args, **kwargs)
            else:
                # In-memory rate limiting (not recommended for production)
                if key not in in_memory_limits:
                    in_memory_limits[key] = []
                
                # Remove expired entries
                in_memory_limits[key] = [t for t in in_memory_limits[key] if t > current_time - period]
                
                # Add current request
                in_memory_limits[key].append(current_time)
                request_count = len(in_memory_limits[key])
            
            # Check if rate limit exceeded
            if request_count > limit:
                logging.warning(f"Rate limit exceeded for {client_ip} on {route}")
                return jsonify({
                    "error": "Rate limit exceeded. Please try again later."
                }), 429
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator