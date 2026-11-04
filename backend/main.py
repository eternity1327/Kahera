from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import audit
import auth
import products
import purchase_orders
import restock
import sales
import suppliers
from config import FRONTEND_URL
from database import Base, engine

Base.metadata.create_all(engine)

app = FastAPI(title="Kahera API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(restock.router)
app.include_router(purchase_orders.router)
app.include_router(audit.router)


@app.get("/")
def health():
    return {"status": "ok"}
