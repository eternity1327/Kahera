from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Role = Literal["owner", "cashier", "agent"]


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)


class StaffCreate(UserCreate):
    role: Role = "cashier"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SupplierIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    contact: str | None = None
    lead_time_days: int = Field(default=2, ge=0)


class SupplierOut(SupplierIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    barcode: str | None = None
    price: Decimal = Field(ge=0)
    on_hand_units: int = Field(default=0, ge=0)
    pack_size: int = Field(default=1, ge=1)
    cost_per_pack: Decimal = Field(default=0, ge=0)
    safety_days: int = Field(default=2, ge=0)
    supplier_id: int | None = None


class ProductOut(ProductIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    avg_daily_sales: float = 0
    reorder_point: int = 0
    low_stock: bool = False


class SaleItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class SaleIn(BaseModel):
    items: list[SaleItemIn] = Field(min_length=1)


class SaleItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    quantity: int
    price: Decimal


class SaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total: Decimal
    created_at: datetime
    items: list[SaleItemOut]


class Suggestion(BaseModel):
    product_id: int
    product_name: str
    supplier_id: int | None
    supplier_name: str | None
    on_hand_units: int
    avg_daily_sales: float
    lead_time_days: int
    safety_days: int
    reorder_point: int
    days_left: float | None
    pack_size: int
    cost_per_pack: Decimal
    packs: int
    line_total: Decimal


class SuggestionsOut(BaseModel):
    budget: Decimal | None
    total: Decimal
    items: list[Suggestion]
    skipped: list[Suggestion]


class POItemIn(BaseModel):
    product_id: int
    packs: int = Field(gt=0)


class POCreate(BaseModel):
    supplier_id: int
    budget: Decimal | None = Field(default=None, ge=0)
    items: list[POItemIn] = Field(min_length=1)


class POUpdate(BaseModel):
    budget: Decimal | None = Field(default=None, ge=0)
    items: list[POItemIn] = Field(min_length=1)


class POItemOut(BaseModel):
    product_id: int
    product_name: str
    packs: int
    pack_size: int
    cost_per_pack: Decimal
    line_total: Decimal


class POOut(BaseModel):
    id: int
    status: str
    supplier_id: int
    supplier_name: str
    budget: Decimal | None
    total: Decimal
    created_by: str
    created_by_role: str
    created_at: datetime
    items: list[POItemOut]


class AuditOut(BaseModel):
    id: int
    username: str
    action: str
    entity: str
    entity_id: int
    detail: str | None
    created_at: datetime
