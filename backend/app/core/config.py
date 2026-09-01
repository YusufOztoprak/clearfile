from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://clearfile:clearfile@localhost:15432/clearfile"
    openai_api_key: str = ""
    nutrient_processor_api_key: str = ""
    nutrient_extraction_api_key: str = ""
    next_public_nutrient_license_key: str = ""
    confidence_threshold: float = 0.85

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()