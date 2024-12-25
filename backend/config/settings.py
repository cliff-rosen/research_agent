from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv, find_dotenv

# Force reload of environment variables
load_dotenv(override=True)


class Settings(BaseSettings):
    APP_NAME: str = "Research Agent"
    SETTING_VERSION: str = "0.0.1"

    # Database settings
    DB_HOST: str = os.getenv("DB_HOST")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_USER: str = os.getenv("DB_USER")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD")
    DB_NAME: str = os.getenv("DB_NAME")

    # Authentication settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # API settings
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL: str = "claude-3-sonnet-20240229"
    GOOGLE_SEARCH_API_KEY: str = os.getenv("GOOGLE_SEARCH_API_KEY")
    GOOGLE_SEARCH_ENGINE_ID: str = os.getenv("GOOGLE_SEARCH_ENGINE_ID")
    GOOGLE_SEARCH_NUM_RESULTS: int = 10
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")

    # CORS settings
    CORS_ORIGINS: list[str] = ["*"]  # In production, specify exact origins
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*", "Authorization"]
    CORS_EXPOSE_HEADERS: list[str] = ["Authorization"]

    # Logging settings
    # LOG_LEVEL: str = "DEBUG"
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"
    LOG_FILENAME_PREFIX: str = "app"
    LOG_MAX_BYTES: int = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT: int = 5

    # Neo4j Settings
    NEO4J_URI: str = os.getenv(
        "NEO4J_URI", "neo4j+s://801e8074.databases.neo4j.io")
    NEO4J_API_KEY: str = os.getenv("NEO4J_API_KEY", "")
    NEO4J_DATABASE: str = os.getenv("NEO4J_DATABASE", "neo4j")

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def anthropic_model(self) -> str:
        """Get the default Anthropic model"""
        return "claude-3-sonnet-20240229"

    @property
    def anthropic_api_key(self) -> str:
        """Get the Anthropic API key"""
        return self.ANTHROPIC_API_KEY

    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = 'utf-8'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure API keys are set
        if not self.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY not found in environment variables")
        if not self.GOOGLE_SEARCH_API_KEY:
            raise ValueError(
                "GOOGLE_SEARCH_API_KEY not found in environment variables")
        if not self.GOOGLE_SEARCH_ENGINE_ID:
            raise ValueError(
                "GOOGLE_SEARCH_ENGINE_ID not found in environment variables")

        # Set environment variables
        os.environ["OPENAI_API_KEY"] = self.OPENAI_API_KEY
        os.environ["GOOGLE_API_KEY"] = self.GOOGLE_SEARCH_API_KEY
        os.environ["GOOGLE_CSE_ID"] = self.GOOGLE_SEARCH_ENGINE_ID

        # Add Neo4j validation
        if not self.NEO4J_API_KEY:
            raise ValueError(
                "NEO4J_API_KEY not found in environment variables")


settings = Settings()

# Debug print to verify API keys are loaded
if __name__ == "__main__":
    print(f"OpenAI API Key loaded: {bool(settings.OPENAI_API_KEY)}")
    print(f"Google API Key loaded: {bool(settings.GOOGLE_SEARCH_API_KEY)}")
    print(f"Google CSE ID loaded: {bool(settings.GOOGLE_SEARCH_ENGINE_ID)}")
    print(
        f"First few chars of OpenAI key: {settings.OPENAI_API_KEY[:10] if settings.OPENAI_API_KEY else 'No key found'}")
    print(
        f"First few chars of Google key: {settings.GOOGLE_SEARCH_API_KEY[:10] if settings.GOOGLE_SEARCH_API_KEY else 'No key found'}")
