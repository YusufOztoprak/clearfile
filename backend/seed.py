import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Document, ExtractedField, AuditLog, User

engine = create_engine(settings.database_url)

with Session(engine) as session:
    # Test user
    user = User(id=uuid.uuid4(), email="test@clearfile.dev", name="Test User")
    session.add(user)

    # Test document
    doc = Document(
        id=uuid.uuid4(),
        filename="sample-invoice.pdf",
        status="pending",
        uploaded_at=datetime.now(timezone.utc),
    )
    session.add(doc)
    session.flush()

    # Test extracted fields
    fields = [
        ExtractedField(id=uuid.uuid4(), document_id=doc.id, field_name="invoice_number", value="INV-005", confidence_score=0.95),
        ExtractedField(id=uuid.uuid4(), document_id=doc.id, field_name="total_amount", value="1564.00", confidence_score=0.60),
        ExtractedField(id=uuid.uuid4(), document_id=doc.id, field_name="vendor_name", value="Ad4tech Material LLC", confidence_score=0.98),
    ]
    session.add_all(fields)

    # Test audit log
    log = AuditLog(id=uuid.uuid4(), document_id=doc.id, action="uploaded", actor="system", timestamp=datetime.now(timezone.utc))
    session.add(log)

    session.commit()
    print(f"Seeded document: {doc.id}")