from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import require_roles
from database import get_db
from models import AuditLog, User
from schemas import AuditOut

router = APIRouter(prefix="/audit-log", tags=["audit"])


def log(db: Session, user: User, action: str, entity: str, entity_id: int, detail: str | None = None):
    db.add(AuditLog(user_id=user.id, action=action, entity=entity, entity_id=entity_id, detail=detail))


@router.get("", response_model=list[AuditOut])
def list_audit(limit: int = Query(default=50, le=500), db: Session = Depends(get_db), _: User = Depends(require_roles("owner"))):
    rows = db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(limit)).all()
    return [
        AuditOut(
            id=row.id,
            username=row.user.username,
            action=row.action,
            entity=row.entity,
            entity_id=row.entity_id,
            detail=row.detail,
            created_at=row.created_at,
        )
        for row in rows
    ]
