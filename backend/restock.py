import math
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import get_current_user
from config import COVER_DAYS, SALES_WINDOW_DAYS
from database import get_db
from models import Product, Sale, SaleItem
from schemas import ProductOut, Suggestion, SuggestionsOut

router = APIRouter(prefix="/restock", tags=["restock"], dependencies=[Depends(get_current_user)])


def avg_daily_sales(db: Session) -> dict[int, float]:
    since = datetime.now() - timedelta(days=SALES_WINDOW_DAYS)
    rows = db.execute(
        select(SaleItem.product_id, func.sum(SaleItem.quantity))
        .join(Sale, Sale.id == SaleItem.sale_id)
        .where(Sale.created_at >= since)
        .group_by(SaleItem.product_id)
    ).all()
    return {product_id: float(total) / SALES_WINDOW_DAYS for product_id, total in rows}


def lead_time(product: Product) -> int:
    return product.supplier.lead_time_days if product.supplier else 0


def reorder_point(product: Product, avg: float) -> int:
    return math.ceil(avg * (lead_time(product) + product.safety_days))


def product_out(product: Product, averages: dict[int, float]) -> ProductOut:
    avg = averages.get(product.id, 0.0)
    point = reorder_point(product, avg)
    out = ProductOut.model_validate(product)
    out.avg_daily_sales = round(avg, 2)
    out.reorder_point = point
    out.low_stock = product.on_hand_units <= point
    return out


def suggestion(product: Product, avg: float, packs: int) -> Suggestion:
    return Suggestion(
        product_id=product.id,
        product_name=product.name,
        supplier_id=product.supplier_id,
        supplier_name=product.supplier.name if product.supplier else None,
        on_hand_units=product.on_hand_units,
        avg_daily_sales=round(avg, 2),
        lead_time_days=lead_time(product),
        safety_days=product.safety_days,
        reorder_point=reorder_point(product, avg),
        days_left=round(product.on_hand_units / avg, 1) if avg else None,
        pack_size=product.pack_size,
        cost_per_pack=product.cost_per_pack,
        packs=packs,
        line_total=product.cost_per_pack * packs,
    )


def needed_packs(product: Product, avg: float) -> int:
    target = reorder_point(product, avg) + math.ceil(avg * COVER_DAYS)
    return math.ceil(max(target - product.on_hand_units, 0) / product.pack_size)


def build_suggestions(db: Session, budget: Decimal | None) -> SuggestionsOut:
    averages = avg_daily_sales(db)
    candidates = []
    for product in db.scalars(select(Product)).all():
        avg = averages.get(product.id, 0.0)
        packs = needed_packs(product, avg)
        if avg and packs and product.on_hand_units <= reorder_point(product, avg):
            candidates.append((product.on_hand_units / avg, product, avg, packs))
    candidates.sort(key=lambda row: row[0])

    items, skipped, total = [], [], Decimal(0)
    for _, product, avg, packs in candidates:
        if budget is not None and product.cost_per_pack:
            packs = min(packs, int((budget - total) // product.cost_per_pack))
        if packs < 1:
            skipped.append(suggestion(product, avg, needed_packs(product, avg)))
            continue
        line = suggestion(product, avg, packs)
        items.append(line)
        total += line.line_total
    return SuggestionsOut(budget=budget, total=total, items=items, skipped=skipped)


@router.get("/suggestions", response_model=SuggestionsOut)
def get_suggestions(budget: Decimal | None = Query(default=None, ge=0), db: Session = Depends(get_db)):
    return build_suggestions(db, budget)
