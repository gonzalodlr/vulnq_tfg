import os
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

SERVER_IP = os.getenv("SERVER_IP", "127.0.0.1")
SERVER_PORT = int(os.getenv("SERVER_PORT", 8000))
TOKEN = os.getenv("TOKEN", "default_token")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")