from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from alerts import alert_after_sale
from auth import get_current_user, require_roles
from database import get_db
from models import Product, Sale, SaleItem, User
from schemas import SaleIn, SaleOut

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("", response_model=list[SaleOut])
def list_sales(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(Sale).order_by(Sale.created_at.desc())).all()


@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
def create_sale(
    data: SaleIn,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("owner", "cashier")),
):
    sale = Sale(user_id=user.id, total=0)
    sold: dict[int, int] = {}
    for item in data.items:
        product = db.get(Product, item.product_id)
        if not product:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Product {item.product_id} not found")
        if product.on_hand_units < item.quantity:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Not enough stock for {product.name}")
        product.on_hand_units -= item.quantity
        sale.items.append(SaleItem(product_id=product.id, quantity=item.quantity, price=product.price))
        sale.total += product.price * item.quantity
        sold[product.id] = sold.get(product.id, 0) + item.quantity
    db.add(sale)
    db.commit()
    db.refresh(sale)
    background.add_task(alert_after_sale, sold)
    return sale
