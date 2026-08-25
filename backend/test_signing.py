import asyncio
from nutrient_dws import NutrientClient
from app.core.config import settings


async def main():
    client = NutrientClient(
        api_key=settings.nutrient_processor_api_key,
        extract_api_key=settings.nutrient_extraction_api_key,
    )

    html = "<html><body><h1>Test Invoice</h1><p>Amount: $100</p></body></html>"
    html_path = "test_invoice.html"
    with open(html_path, "w") as f:
        f.write(html)

    convert_result = await (
        client.workflow()
        .add_html_part(html_path)
        .output_pdf()
        .execute()
    )

    pdf_bytes = convert_result["output"]["buffer"]
    with open("test_output.pdf", "wb") as f:
        f.write(pdf_bytes)
    print("PDF saved, size:", len(pdf_bytes))

    try:
        sign_result = await client.sign("test_output.pdf")
        print("SIGN SUCCESS")
        print("SIGN RESULT TYPE:", type(sign_result))
        if isinstance(sign_result, dict) and "buffer" in sign_result:
            with open("test_signed.pdf", "wb") as f:
                f.write(sign_result["buffer"])
            print("Signed PDF saved")
    except Exception as e:
        print("SIGN ERROR:", e)
        if hasattr(e, "details"):
            print("SIGN ERROR DETAILS:", e.details)


asyncio.run(main())