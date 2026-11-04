import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/kahera")
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("Set SECRET_KEY in backend/.env")
ALGORITHM = "HS256"
TOKEN_MINUTES = int(os.getenv("TOKEN_MINUTES", "60"))
AGENT_TOKEN_MINUTES = int(os.getenv("AGENT_TOKEN_MINUTES", "10080"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SALES_WINDOW_DAYS = 30
COVER_DAYS = 7
