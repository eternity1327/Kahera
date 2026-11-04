import json
import sys
import urllib.parse
import urllib.request

from sqlalchemy import select

from config import RESTOCK_BUDGET, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
from database import SessionLocal
from models import Product
from restock import avg_daily_sales, reorder_point


def send(text: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False
    data = urllib.parse.urlencode({"chat_id": TELEGRAM_CHAT_ID, "text": text}).encode()
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        with urllib.request.urlopen(url, data=data, timeout=10) as res:
            return json.load(res).get("ok", False)
    except OSError as error:
        print(f"Telegram alert failed: {error}")
        return False


def line(product: Product) -> str:
    return f"• {product.name}: {product.on_hand_units} left"


def ask_restock() -> str:
    return f'Reply "@restock ano kulang? budget {RESTOCK_BUDGET}" to draft orders.'


def alert_after_sale(sold: dict[int, int]):
    db = SessionLocal()
    try:
        averages = avg_daily_sales(db)
        crossed = []
        for product in db.scalars(select(Product).where(Product.id.in_(sold))).all():
            point = reorder_point(product, averages.get(product.id, 0.0))
            if product.on_hand_units <= point < product.on_hand_units + sold[product.id]:
                crossed.append(product)
        if crossed:
            send("⚠️ Paubos na:\n" + "\n".join(line(p) for p in crossed) + "\n\n" + ask_restock())
    finally:
        db.close()


def daily_report():
    db = SessionLocal()
    try:
        averages = avg_daily_sales(db)
        low = [
            p
            for p in db.scalars(select(Product).order_by(Product.on_hand_units)).all()
            if p.on_hand_units <= reorder_point(p, averages.get(p.id, 0.0))
        ]
        if low:
            send("☀️ Magandang umaga! Paubos ngayon:\n" + "\n".join(line(p) for p in low) + "\n\n" + ask_restock())
        else:
            send("☀️ Magandang umaga! Walang paubos ngayon.")
    finally:
        db.close()


if __name__ == "__main__":
    if sys.argv[1:] == ["test"]:
        print("sent" if send("✅ Kahera alerts are connected.") else "not sent")
    else:
        daily_report()
