import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from openai import AsyncOpenAI

from app.core.database import get_db
from app.models import Document, AuditLog, ExtractedField
from nutrient_dws import NutrientClient
from app.core.config import settings

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)


async def generate_review_note(field_name: str, value: str, confidence: float) -> str:
    prompt = (
        f"An invoice field was extracted with low confidence.\n"
        f"Field: {field_name}\nExtracted value: {value}\nConfidence: {confidence:.0%}\n\n"
        f"In one short sentence, explain to a human reviewer what to double-check about this field."
    )
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=60,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI call failed: {e}")
        return "Low confidence extraction — please verify this value manually."



router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

nutrient_client = NutrientClient(
    api_key=settings.nutrient_processor_api_key,
    extract_api_key=settings.nutrient_extraction_api_key,
)


class StatusUpdate(BaseModel):
    status: str


@router.post("/upload")
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    doc_id = uuid.uuid4()
    file_path = UPLOAD_DIR / f"{doc_id}_{file.filename}"

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(id=doc_id, filename=file.filename, status="pending")
    db.add(doc)
    db.flush()

    log = AuditLog(id=uuid.uuid4(), document_id=doc.id, action="uploaded", actor="system")
    db.add(log)

    db.commit()
    db.refresh(doc)

    return {"id": str(doc.id), "filename": doc.filename, "status": doc.status}


@router.get("")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return [
        {"id": str(d.id), "filename": d.filename, "status": d.status, "uploaded_at": d.uploaded_at}
        for d in docs
    ]


@router.get("/{document_id}")
def get_document(document_id: uuid.UUID, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    fields = db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).all()

    return {
        "id": str(doc.id),
        "filename": doc.filename,
        "status": doc.status,
        "uploaded_at": doc.uploaded_at,
        "extracted_fields": [
            {
                "id": str(f.id),
                "field_name": f.field_name,
                "value": f.value,
                "confidence_score": f.confidence_score,
                "approved": f.approved,
                "review_note": f.review_note,
            }
            for f in fields
        ],
    }

@router.get("/{document_id}/status")
def get_document_status(document_id: uuid.UUID, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"id": str(doc.id), "status": doc.status}


@router.patch("/{document_id}/status")
def update_document_status(document_id: uuid.UUID, payload: StatusUpdate, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    valid_statuses = {"pending", "processing", "needs_review", "signed"}
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    doc.status = payload.status
    db.add(AuditLog(id=uuid.uuid4(), document_id=doc.id, action=f"status_changed_to_{payload.status}", actor="system"))
    db.commit()
    db.refresh(doc)

    return {"id": str(doc.id), "status": doc.status}


@router.post("/{document_id}/extract")
async def extract_document(document_id: uuid.UUID, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = next(UPLOAD_DIR.glob(f"{document_id}_*"), None)
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found on disk")

    try:
        response = await nutrient_client.extract_key_value_pairs(str(file_path))
    except Exception as e:
        doc.status = "extraction_failed"
        db.add(AuditLog(id=uuid.uuid4(), document_id=doc.id, action="extraction_failed", actor="system"))
        db.commit()
        raise HTTPException(status_code=502, detail=f"Extraction failed: {str(e)}")

    pairs = response.get("data", {}).get("pages", [{}])[0].get("keyValuePairs", [])

    saved_fields = []
    for pair in pairs:
        field_name = pair.get("key", {}).get("content", "").strip()
        value = pair.get("value", {}).get("content", "").strip()
        confidence = pair.get("confidence", 0) / 100

        if not field_name:
            continue

        needs_review = confidence < settings.confidence_threshold
        note = None
        if needs_review:
            note = await generate_review_note(field_name, value, confidence)

        field = ExtractedField(
            id=uuid.uuid4(),
            document_id=doc.id,
            field_name=field_name,
            value=value,
            confidence_score=confidence,
            approved=not needs_review,
            review_note=note,
        )
        db.add(field)
        saved_fields.append({
            "field_name": field_name,
            "value": value,
            "confidence_score": confidence,
            "needs_review": needs_review,
            "review_note": note,
        })

    doc.status = "needs_review"
    db.add(AuditLog(id=uuid.uuid4(), document_id=doc.id, action="extracted", actor="system"))
    db.commit()

    return {"id": str(doc.id), "status": doc.status, "extracted_fields": saved_fields}