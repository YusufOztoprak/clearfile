import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models import Document, AuditLog

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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
    return {"id": str(doc.id), "filename": doc.filename, "status": doc.status, "uploaded_at": doc.uploaded_at}


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