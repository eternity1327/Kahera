import os
import random
import sys
from datetime import datetime, timedelta
from decimal import Decimal

from auth import hash_password
from database import Base, SessionLocal, engine
from models import Product, Sale, SaleItem, Supplier, User

SUPPLIERS = [
    ("Bulacan Grocery Distributors", "0917 555 0101", 2),
    ("Metro Beverage Supply", "0918 555 0202", 1),
    ("Aling Nena Wholesale", "0919 555 0303", 3),
]

PRODUCTS = [
    ("Pancit canton (original)", "4800000000011", "16.00", 72, "480.00", 0, 30, 9.0),
    ("Instant noodles (beef)", "4800000000028", "12.00", 72, "360.00", 0, 140, 6.0),
    ("3-in-1 coffee sachet", "4800000000035", "8.00", 100, "450.00", 2, 25, 14.0),
    ("Sardines 155g", "4800000000042", "28.00", 48, "1056.00", 0, 60, 3.0),
    ("Corned beef 150g", "4800000000059", "42.00", 48, "1680.00", 0, 50, 1.5),
    ("Cola 290ml", "4800000000066", "18.00", 24, "336.00", 1, 12, 8.0),
    ("Mineral water 500ml", "4800000000073", "15.00", 24, "264.00", 1, 90, 5.0),
    ("Orange juice drink 250ml", "4800000000080", "14.00", 24, "240.00", 1, 70, 2.5),
    ("Laundry bar soap", "4800000000097", "25.00", 36, "720.00", 2, 15, 3.5),
    ("Shampoo sachet", "4800000000103", "7.00", 144, "792.00", 2, 300, 7.0),
    ("Cooking oil 250ml", "4800000000110", "35.00", 24, "672.00", 2, 40, 1.5),
    ("Bread pandesal pack", "4800000000127", "45.00", 10, "380.00", 0, 8, 4.0),
]

USERS = [("owner", "owner"), ("cashier", "cashier"), ("restock", "agent")]


def day_factor(day: datetime) -> float:
    payday = 1.6 if day.day in (15, 16, 30, 31, 1) else 1.0
    weekend = 1.2 if day.weekday() >= 5 else 1.0
    return payday * weekend


def seed(days: int):
    rng = random.Random(42)
    password = os.getenv("SEED_PASSWORD", "kahera123")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()

    users = [User(username=name, password_hash=hash_password(password), role=role) for name, role in USERS]
    suppliers = [Supplier(name=name, contact=contact, lead_time_days=lead) for name, contact, lead in SUPPLIERS]
    db.add_all(users + suppliers)
    db.flush()

    products = []
    for name, barcode, price, pack, cost, supplier, on_hand, rate in PRODUCTS:
        product = Product(
            name=name,
            barcode=barcode,
            price=Decimal(price),
            on_hand_units=on_hand,
            pack_size=pack,
            cost_per_pack=Decimal(cost),
            safety_days=2,
            supplier_id=suppliers[supplier].id,
        )
        products.append((product, rate))
    db.add_all(product for product, _ in products)
    db.flush()

    cashier = users[1]
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    for offset in range(days, 0, -1):
        day = today - timedelta(days=offset)
        for hour in (7, 10, 13, 16, 19):
            sale = Sale(user_id=cashier.id, total=Decimal(0), created_at=day + timedelta(hours=hour, minutes=rng.randint(0, 59)))
            for product, rate in products:
                quantity = round(rng.gauss(rate * day_factor(day) / 5, rate / 10))
                if quantity > 0:
                    sale.items.append(SaleItem(product_id=product.id, quantity=quantity, price=product.price))
                    sale.total += product.price * quantity
            if sale.items:
                db.add(sale)

    db.commit()
    db.close()
    print(f"Seeded {days} days of sales, {len(products)} products, {len(suppliers)} suppliers")
    print(f"Logins (password '{password}'): " + ", ".join(f"{name} ({role})" for name, role in USERS))


if __name__ == "__main__":
    seed(int(sys.argv[1]) if len(sys.argv) > 1 else 45)
