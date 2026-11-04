from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from audit import log
from auth import get_current_user, require_roles
from database import get_db
from models import Product, User
from restock import avg_daily_sales, product_out
from schemas import ProductIn, ProductOut

router = APIRouter(prefix="/products", tags=["products"], dependencies=[Depends(get_current_user)])
can_edit = require_roles("owner", "cashier")


def find_product(product_id: int, db: Session) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product


def commit(db: Session, error: str):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, error)


def save(product: Product, db: Session) -> ProductOut:
    commit(db, "Barcode already used or supplier not found")
    db.refresh(product)
    return product_out(product, avg_daily_sales(db))


@router.get("", response_model=list[ProductOut])
def list_products(low_only: bool = Query(default=False), db: Session = Depends(get_db)):
    averages = avg_daily_sales(db)
    products = [product_out(p, averages) for p in db.scalars(select(Product).order_by(Product.name)).all()]
    return [p for p in products if p.low_stock or not low_only]


@router.get("/barcode/{barcode}", response_model=ProductOut)
def get_by_barcode(barcode: str, db: Session = Depends(get_db)):
    product = db.scalar(select(Product).where(Product.barcode == barcode))
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product_out(product, avg_daily_sales(db))


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductIn, db: Session = Depends(get_db), user: User = Depends(can_edit)):
    product = Product(**data.model_dump())
    db.add(product)
    db.flush()
    log(db, user, "create", "product", product.id, product.name)
    return save(product, db)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductIn, db: Session = Depends(get_db), user: User = Depends(can_edit)):
    product = find_product(product_id, db)
    for key, value in data.model_dump().items():
        setattr(product, key, value)
    log(db, user, "update", "product", product.id, product.name)
    return save(product, db)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles("owner"))):
    product = find_product(product_id, db)
    log(db, user, "delete", "product", product.id, product.name)
    db.delete(product)
    commit(db, "Product already has sales or orders")
