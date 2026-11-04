from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from audit import log
from auth import get_current_user, require_roles
from database import get_db
from models import PO_STATUSES, POItem, Product, PurchaseOrder, Supplier, User
from restock import build_suggestions
from schemas import POCreate, POItemIn, POItemOut, POOut, POUpdate

router = APIRouter(prefix="/purchase-orders", tags=["purchase orders"], dependencies=[Depends(get_current_user)])
drafters = require_roles("owner", "cashier", "agent")
staff = require_roles("owner", "cashier")
owner = require_roles("owner")


def po_out(po: PurchaseOrder) -> POOut:
    return POOut(
        id=po.id,
        status=po.status,
        supplier_id=po.supplier_id,
        supplier_name=po.supplier.name,
        budget=po.budget,
        total=po.total,
        created_by=po.creator.username,
        created_by_role=po.creator.role,
        created_at=po.created_at,
        items=[
            POItemOut(
                product_id=item.product_id,
                product_name=item.product.name,
                packs=item.packs,
                pack_size=item.pack_size,
                cost_per_pack=item.cost_per_pack,
                line_total=item.cost_per_pack * item.packs,
            )
            for item in po.items
        ],
    )


def find_po(po_id: int, db: Session) -> PurchaseOrder:
    po = db.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Purchase order not found")
    return po


def set_items(po: PurchaseOrder, items: list[POItemIn], db: Session):
    po.items.clear()
    for item in items:
        product = db.get(Product, item.product_id)
        if not product:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Product {item.product_id} not found")
        if product.supplier_id != po.supplier_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{product.name} is not from this supplier")
        po.items.append(POItem(product_id=product.id, packs=item.packs, pack_size=product.pack_size, cost_per_pack=product.cost_per_pack))
    po.total = sum((Decimal(item.cost_per_pack) * item.packs for item in po.items), Decimal(0))


def create_draft(db: Session, user: User, supplier_id: int, items: list[POItemIn], budget: Decimal | None) -> PurchaseOrder:
    if not db.get(Supplier, supplier_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Supplier not found")
    po = PurchaseOrder(supplier_id=supplier_id, budget=budget, created_by=user.id)
    db.add(po)
    set_items(po, items, db)
    db.flush()
    log(db, user, "create", "purchase_order", po.id, f"draft {po.total}")
    return po


def move(po_id: int, db: Session, user: User, current: str, target: str) -> POOut:
    po = find_po(po_id, db)
    if po.status != current:
        raise HTTPException(status.HTTP_409_CONFLICT, f"PO #{po.id} is {po.status}, needs to be {current}")
    po.status = target
    if target == "received":
        for item in po.items:
            item.product.on_hand_units += item.packs * item.pack_size
    log(db, user, target, "purchase_order", po.id, f"{current} -> {target}")
    db.commit()
    db.refresh(po)
    return po_out(po)


@router.get("", response_model=list[POOut])
def list_pos(status_filter: Literal[PO_STATUSES] | None = Query(default=None, alias="status"), db: Session = Depends(get_db)):
    query = select(PurchaseOrder).order_by(PurchaseOrder.id.desc())
    if status_filter:
        query = query.where(PurchaseOrder.status == status_filter)
    return [po_out(po) for po in db.scalars(query).all()]


@router.get("/{po_id}", response_model=POOut)
def get_po(po_id: int, db: Session = Depends(get_db)):
    return po_out(find_po(po_id, db))


@router.post("", response_model=POOut, status_code=status.HTTP_201_CREATED)
def create_po(data: POCreate, db: Session = Depends(get_db), user: User = Depends(drafters)):
    po = create_draft(db, user, data.supplier_id, data.items, data.budget)
    db.commit()
    db.refresh(po)
    return po_out(po)


@router.post("/from-suggestions", response_model=list[POOut], status_code=status.HTTP_201_CREATED)
def create_from_suggestions(budget: Decimal | None = Query(default=None, ge=0), db: Session = Depends(get_db), user: User = Depends(drafters)):
    by_supplier: dict[int, list[POItemIn]] = {}
    for line in build_suggestions(db, budget).items:
        if line.supplier_id:
            by_supplier.setdefault(line.supplier_id, []).append(POItemIn(product_id=line.product_id, packs=line.packs))
    if not by_supplier:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing needs restocking")
    pos = [create_draft(db, user, supplier_id, items, budget) for supplier_id, items in by_supplier.items()]
    db.commit()
    return [po_out(po) for po in pos]


@router.put("/{po_id}", response_model=POOut)
def update_po(po_id: int, data: POUpdate, db: Session = Depends(get_db), user: User = Depends(drafters)):
    po = find_po(po_id, db)
    if po.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, f"PO #{po.id} is {po.status}; only drafts can be edited")
    set_items(po, data.items, db)
    po.budget = data.budget if data.budget is not None else po.budget
    log(db, user, "update", "purchase_order", po.id, f"total {po.total}")
    db.commit()
    db.refresh(po)
    return po_out(po)


@router.post("/{po_id}/submit", response_model=POOut)
def submit_po(po_id: int, db: Session = Depends(get_db), user: User = Depends(staff)):
    return move(po_id, db, user, "draft", "pending_approval")


@router.post("/{po_id}/approve", response_model=POOut)
def approve_po(po_id: int, db: Session = Depends(get_db), user: User = Depends(owner)):
    return move(po_id, db, user, "pending_approval", "approved")


@router.post("/{po_id}/send", response_model=POOut)
def send_po(po_id: int, db: Session = Depends(get_db), user: User = Depends(owner)):
    return move(po_id, db, user, "approved", "sent")


@router.post("/{po_id}/receive", response_model=POOut)
def receive_po(po_id: int, db: Session = Depends(get_db), user: User = Depends(staff)):
    return move(po_id, db, user, "sent", "received")
