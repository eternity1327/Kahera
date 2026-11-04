from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from audit import log
from auth import get_current_user, require_roles
from database import get_db
from models import Supplier, User
from schemas import SupplierIn, SupplierOut

router = APIRouter(prefix="/suppliers", tags=["suppliers"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[SupplierOut])
def list_suppliers(db: Session = Depends(get_db)):
    return db.scalars(select(Supplier).order_by(Supplier.name)).all()


@router.post("", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
def create_supplier(data: SupplierIn, db: Session = Depends(get_db), user: User = Depends(require_roles("owner"))):
    supplier = Supplier(**data.model_dump())
    db.add(supplier)
    db.flush()
    log(db, user, "create", "supplier", supplier.id, supplier.name)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(supplier_id: int, data: SupplierIn, db: Session = Depends(get_db), user: User = Depends(require_roles("owner"))):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Supplier not found")
    for key, value in data.model_dump().items():
        setattr(supplier, key, value)
    log(db, user, "update", "supplier", supplier.id, supplier.name)
    db.commit()
    db.refresh(supplier)
    return supplier
