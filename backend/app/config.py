from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "M&A Intelligence Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # External APIs
    OPENAI_API_KEY: Optional[str] = None
    PAPPERS_API_KEY: Optional[str] = None
    
    # Scraping
    HEADLESS: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()