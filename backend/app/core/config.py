from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://clearfile:clearfile@localhost:15432/clearfile"
    openai_api_key: str = ""
    nutrient_processor_api_key: str = ""
    nutrient_extraction_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()