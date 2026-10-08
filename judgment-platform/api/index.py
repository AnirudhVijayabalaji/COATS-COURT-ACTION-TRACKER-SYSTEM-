import os
import sys

# Ensure judgment-ai directory is at the top of sys.path for Vercel Python handler
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "judgment-ai-backend", "judgment-ai"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
