from fastapi import FastAPI

app = FastAPI(title="ClearFile API")


@app.get("/")
def read_root():
    return {"status": "ok", "service": "ClearFile API"}