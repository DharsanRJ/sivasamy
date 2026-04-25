import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from backend.tasks import process_resume_task

try:
    print("Testing delay...")
    res = process_resume_task.delay("test_id", "test_path", "test_token")
    print("Success:", res.id)
except Exception as e:
    print("Failed:", repr(e))
