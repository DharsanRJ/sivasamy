import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

# If using Redis Cloud, ensure REDIS_URL is in the .env file
# e.g., redis://default:password@endpoint:port
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "skillstack_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["backend.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
