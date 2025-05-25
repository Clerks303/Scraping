from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: Client = None
    
    @classmethod
    async def init(cls):
        try:
            cls.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Connected to Supabase")
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {e}")
            raise
    
    @classmethod
    def get_client(cls) -> Client:
        if not cls.client:
            raise RuntimeError("Database not initialized")
        return cls.client

async def init_db():
    await Database.init()

def get_db() -> Client:
    return Database.get_client()