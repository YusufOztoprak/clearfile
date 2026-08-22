import asyncio
from nutrient_dws import NutrientClient
from app.core.config import settings


async def main():
    client = NutrientClient(
        api_key=settings.nutrient_processor_api_key,
        extract_api_key=settings.nutrient_extraction_api_key,
    )

    response = await client.extract_key_value_pairs("test-invoice.png")
    print(response)


asyncio.run(main())