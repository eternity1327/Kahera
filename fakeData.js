/**
 * fakeData.js
 *
 * Static mock data and API schema reference for the Kahera Inventory Management System.
 * Matches the exact endpoint field names from the backend FastAPI models and schemas.
 *
 * API Table Reference:
 * | Method       | Path                                     | Who                     |
 * | ------------ | ---------------------------------------- | ----------------------- |
 * | POST         | /auth/register                           | First user only (owner) |
 * | POST         | /auth/login                              | All                     |
 * | GET          | /auth/me                                 | All                     |
 * | GET, POST    | /auth/users                              | owner                   |
 * | GET          | /suppliers                               | All                     |
 * | POST, PUT    | /suppliers, /suppliers/{id}              | owner                   |
 * | GET          | /products?low_only=true                  | All                     |
 * | POST, PUT    | /products, /products/{id}                | owner, cashier          |
 * | DELETE       | /products/{id}                           | owner                   |
 * | GET          | /sales                                   | All                     |
 * | POST         | /sales                                   | owner, cashier          |
 * | GET          | /restock/suggestions?budget=             | All                     |
 * | GET          | /purchase-orders?status=                 | All                     |
 * | GET          | /purchase-orders/{id}                    | All                     |
 * | POST         | /purchase-orders                         | owner, cashier, agent   |
 * | POST         | /purchase-orders/from-suggestions?budget= | owner, cashier, agent   |
 * | PUT          | /purchase-orders/{id} (drafts only)      | owner, cashier, agent   |
 * | POST         | /purchase-orders/{id}/submit             | owner, cashier          |
 * | POST         | /purchase-orders/{id}/approve            | owner                   |
 * | POST         | /purchase-orders/{id}/send               | owner                   |
 * | POST         | /purchase-orders/{id}/receive            | owner, cashier          |
 * | GET          | /audit-log                               | owner                   |
 */

// 1. AUTH & USERS (POST /auth/register, POST /auth/login, GET /auth/me, GET/POST /auth/users)
export const fakeAuth = {
  // POST /auth/login -> Token
  loginResponse: {
    access_token: "mock-jwt-token-kahera-owner",
    token_type: "bearer"
  },
  // GET /auth/me -> UserOut
  currentUser: {
    id: 1,
    username: "owner",
    role: "owner"
  },
  // GET /auth/users -> list[UserOut]
  users: [
    { id: 1, username: "owner", role: "owner" },
    { id: 2, username: "cashier", role: "cashier" },
    { id: 3, username: "restock", role: "agent" }
  ]
};

// 2. SUPPLIERS (GET /suppliers, POST /suppliers, PUT /suppliers/{id})
// SupplierOut: { id: int, name: str, contact: str | null, lead_time_days: int }
export const fakeSuppliers = [
  {
    id: 1,
    name: "Bulacan Grocery Distributors",
    contact: "0917 555 0101",
    lead_time_days: 2
  },
  {
    id: 2,
    name: "Metro Beverage Supply",
    contact: "0918 555 0202",
    lead_time_days: 1
  },
  {
    id: 3,
    name: "Aling Nena Wholesale",
    contact: "0919 555 0303",
    lead_time_days: 3
  }
];

// 3. PRODUCTS (GET /products?low_only=true, POST /products, PUT /products/{id}, DELETE /products/{id})
// ProductOut: { id, name, barcode, price, on_hand_units, pack_size, cost_per_pack, safety_days, supplier_id, avg_daily_sales, reorder_point, low_stock }
export const fakeProducts = [
  {
    id: 1,
    name: "Pancit canton (original)",
    barcode: "4800000000011",
    price: 16.00,
    on_hand_units: 0,
    pack_size: 72,
    cost_per_pack: 480.00,
    safety_days: 2,
    supplier_id: 1,
    avg_daily_sales: 9.0,
    reorder_point: 36,
    low_stock: true
  },
  {
    id: 2,
    name: "Instant noodles (beef)",
    barcode: "4800000000028",
    price: 12.00,
    on_hand_units: 140,
    pack_size: 72,
    cost_per_pack: 360.00,
    safety_days: 2,
    supplier_id: 1,
    avg_daily_sales: 6.0,
    reorder_point: 24,
    low_stock: false
  },
  {
    id: 3,
    name: "3-in-1 coffee sachet",
    barcode: "4800000000035",
    price: 8.00,
    on_hand_units: 25,
    pack_size: 100,
    cost_per_pack: 450.00,
    safety_days: 2,
    supplier_id: 3,
    avg_daily_sales: 14.0,
    reorder_point: 70,
    low_stock: true
  },
  {
    id: 4,
    name: "Sardines 155g",
    barcode: "4800000000042",
    price: 28.00,
    on_hand_units: 60,
    pack_size: 48,
    cost_per_pack: 1056.00,
    safety_days: 2,
    supplier_id: 1,
    avg_daily_sales: 3.0,
    reorder_point: 12,
    low_stock: false
  },
  {
    id: 5,
    name: "Corned beef 150g",
    barcode: "4800000000059",
    price: 42.00,
    on_hand_units: 50,
    pack_size: 48,
    cost_per_pack: 1680.00,
    safety_days: 2,
    supplier_id: 1,
    avg_daily_sales: 1.5,
    reorder_point: 6,
    low_stock: false
  },
  {
    id: 6,
    name: "Cola 290ml",
    barcode: "4800000000066",
    price: 18.00,
    on_hand_units: 12,
    pack_size: 24,
    cost_per_pack: 336.00,
    safety_days: 2,
    supplier_id: 2,
    avg_daily_sales: 8.0,
    reorder_point: 24,
    low_stock: true
  },
  {
    id: 7,
    name: "Mineral water 500ml",
    barcode: "4800000000073",
    price: 15.00,
    on_hand_units: 90,
    pack_size: 24,
    cost_per_pack: 264.00,
    safety_days: 2,
    supplier_id: 2,
    avg_daily_sales: 5.0,
    reorder_point: 15,
    low_stock: false
  },
  {
    id: 8,
    name: "Orange juice drink 250ml",
    barcode: "4800000000080",
    price: 14.00,
    on_hand_units: 70,
    pack_size: 24,
    cost_per_pack: 240.00,
    safety_days: 2,
    supplier_id: 2,
    avg_daily_sales: 2.5,
    reorder_point: 8,
    low_stock: false
  },
  {
    id: 9,
    name: "Laundry bar soap",
    barcode: "4800000000097",
    price: 25.00,
    on_hand_units: 15,
    pack_size: 36,
    cost_per_pack: 720.00,
    safety_days: 2,
    supplier_id: 3,
    avg_daily_sales: 3.5,
    reorder_point: 18,
    low_stock: true
  },
  {
    id: 10,
    name: "Shampoo sachet",
    barcode: "4800000000103",
    price: 7.00,
    on_hand_units: 300,
    pack_size: 144,
    cost_per_pack: 792.00,
    safety_days: 2,
    supplier_id: 3,
    avg_daily_sales: 7.0,
    reorder_point: 35,
    low_stock: false
  },
  {
    id: 11,
    name: "Cooking oil 250ml",
    barcode: "4800000000110",
    price: 35.00,
    on_hand_units: 40,
    pack_size: 24,
    cost_per_pack: 672.00,
    safety_days: 2,
    supplier_id: 3,
    avg_daily_sales: 1.5,
    reorder_point: 8,
    low_stock: false
  },
  {
    id: 12,
    name: "Bread pandesal pack",
    barcode: "4800000000127",
    price: 45.00,
    on_hand_units: 8,
    pack_size: 10,
    cost_per_pack: 380.00,
    safety_days: 2,
    supplier_id: 1,
    avg_daily_sales: 4.0,
    reorder_point: 16,
    low_stock: true
  }
];

// 4. SALES (GET /sales, POST /sales)
// SaleOut: { id: int, total: Decimal, created_at: datetime, items: list[SaleItemOut { product_id, quantity, price }] }
export const fakeSales = [
  {
    id: 101,
    total: 128.00,
    created_at: "2026-11-04T08:15:20Z",
    items: [
      { product_id: 1, quantity: 4, price: 16.00 },
      { product_id: 3, quantity: 8, price: 8.00 }
    ]
  },
  {
    id: 102,
    total: 215.00,
    created_at: "2026-11-04T09:42:11Z",
    items: [
      { product_id: 6, quantity: 3, price: 18.00 },
      { product_id: 9, quantity: 2, price: 25.00 },
      { product_id: 7, quantity: 3, price: 15.00 },
      { product_id: 10, quantity: 9, price: 7.00 }
    ]
  },
  {
    id: 103,
    total: 84.00,
    created_at: "2026-11-04T10:30:45Z",
    items: [
      { product_id: 4, quantity: 3, price: 28.00 }
    ]
  },
  {
    id: 104,
    total: 172.00,
    created_at: "2026-11-04T11:20:00Z",
    items: [
      { product_id: 5, quantity: 2, price: 42.00 },
      { product_id: 12, quantity: 2, price: 45.00 }
    ]
  }
];

// 5. RESTOCK SUGGESTIONS (GET /restock/suggestions?budget=)
// SuggestionsOut: { budget: Decimal | null, total: Decimal, items: list[Suggestion], skipped: list[Suggestion] }
// Suggestion: { product_id, product_name, supplier_id, supplier_name, on_hand_units, avg_daily_sales, lead_time_days, safety_days, reorder_point, days_left, pack_size, cost_per_pack, packs, line_total }
export const fakeRestockSuggestions = {
  budget: 5000.00,
  total: 2868.00,
  items: [
    {
      product_id: 1,
      product_name: "Pancit canton (original)",
      supplier_id: 1,
      supplier_name: "Bulacan Grocery Distributors",
      on_hand_units: 0,
      avg_daily_sales: 9.0,
      lead_time_days: 2,
      safety_days: 2,
      reorder_point: 36,
      days_left: 0.0,
      pack_size: 72,
      cost_per_pack: 480.00,
      packs: 2,
      line_total: 960.00
    },
    {
      product_id: 6,
      product_name: "Cola 290ml",
      supplier_id: 2,
      supplier_name: "Metro Beverage Supply",
      on_hand_units: 12,
      avg_daily_sales: 8.0,
      lead_time_days: 1,
      safety_days: 2,
      reorder_point: 24,
      days_left: 1.5,
      pack_size: 24,
      cost_per_pack: 336.00,
      packs: 3,
      line_total: 1008.00
    },
    {
      product_id: 3,
      product_name: "3-in-1 coffee sachet",
      supplier_id: 3,
      supplier_name: "Aling Nena Wholesale",
      on_hand_units: 25,
      avg_daily_sales: 14.0,
      lead_time_days: 3,
      safety_days: 2,
      reorder_point: 70,
      days_left: 1.8,
      pack_size: 100,
      cost_per_pack: 450.00,
      packs: 2,
      line_total: 900.00
    }
  ],
  skipped: [
    {
      product_id: 9,
      product_name: "Laundry bar soap",
      supplier_id: 3,
      supplier_name: "Aling Nena Wholesale",
      on_hand_units: 15,
      avg_daily_sales: 3.5,
      lead_time_days: 3,
      safety_days: 2,
      reorder_point: 18,
      days_left: 4.3,
      pack_size: 36,
      cost_per_pack: 720.00,
      packs: 1,
      line_total: 720.00
    }
  ]
};

// 6. PURCHASE ORDERS (GET/POST /purchase-orders, GET/PUT /purchase-orders/{id}, /submit, /approve, /send, /receive)
// POOut: { id, status, supplier_id, supplier_name, budget, total, created_by, created_by_role, created_at, items: list[POItemOut] }
// POItemOut: { product_id, product_name, packs, pack_size, cost_per_pack, line_total }
export const fakePurchaseOrders = [
  {
    id: 1,
    status: "pending_approval",
    supplier_id: 1,
    supplier_name: "Bulacan Grocery Distributors",
    budget: 5000.00,
    total: 2400.00,
    created_by: "cashier",
    created_by_role: "cashier",
    created_at: "2026-11-04T07:30:00Z",
    items: [
      {
        product_id: 1,
        product_name: "Pancit canton (original)",
        packs: 3,
        pack_size: 72,
        cost_per_pack: 480.00,
        line_total: 1440.00
      },
      {
        product_id: 2,
        product_name: "Instant noodles (beef)",
        packs: 2,
        pack_size: 72,
        cost_per_pack: 360.00,
        line_total: 720.00
      },
      {
        product_id: 12,
        product_name: "Bread pandesal pack",
        packs: 1,
        pack_size: 10,
        cost_per_pack: 240.00,
        line_total: 240.00
      }
    ]
  },
  {
    id: 2,
    status: "approved",
    supplier_id: 2,
    supplier_name: "Metro Beverage Supply",
    budget: 3500.00,
    total: 1872.00,
    created_by: "restock",
    created_by_role: "agent",
    created_at: "2026-11-03T14:10:00Z",
    items: [
      {
        product_id: 6,
        product_name: "Cola 290ml",
        packs: 3,
        pack_size: 24,
        cost_per_pack: 336.00,
        line_total: 1008.00
      },
      {
        product_id: 7,
        product_name: "Mineral water 500ml",
        packs: 2,
        pack_size: 24,
        cost_per_pack: 264.00,
        line_total: 528.00
      },
      {
        product_id: 8,
        product_name: "Orange juice drink 250ml",
        packs: 1,
        pack_size: 24,
        cost_per_pack: 336.00,
        line_total: 336.00
      }
    ]
  },
  {
    id: 3,
    status: "draft",
    supplier_id: 3,
    supplier_name: "Aling Nena Wholesale",
    budget: 3000.00,
    total: 1620.00,
    created_by: "cashier",
    created_by_role: "cashier",
    created_at: "2026-11-04T09:15:00Z",
    items: [
      {
        product_id: 3,
        product_name: "3-in-1 coffee sachet",
        packs: 2,
        pack_size: 100,
        cost_per_pack: 450.00,
        line_total: 900.00
      },
      {
        product_id: 9,
        product_name: "Laundry bar soap",
        packs: 1,
        pack_size: 36,
        cost_per_pack: 720.00,
        line_total: 720.00
      }
    ]
  },
  {
    id: 4,
    status: "sent",
    supplier_id: 1,
    supplier_name: "Bulacan Grocery Distributors",
    budget: 4000.00,
    total: 2736.00,
    created_by: "owner",
    created_by_role: "owner",
    created_at: "2026-11-02T10:00:00Z",
    items: [
      {
        product_id: 4,
        product_name: "Sardines 155g",
        packs: 1,
        pack_size: 48,
        cost_per_pack: 1056.00,
        line_total: 1056.00
      },
      {
        product_id: 5,
        product_name: "Corned beef 150g",
        packs: 1,
        pack_size: 48,
        cost_per_pack: 1680.00,
        line_total: 1680.00
      }
    ]
  },
  {
    id: 5,
    status: "received",
    supplier_id: 3,
    supplier_name: "Aling Nena Wholesale",
    budget: 2500.00,
    total: 2256.00,
    created_by: "owner",
    created_by_role: "owner",
    created_at: "2026-10-31T15:45:00Z",
    items: [
      {
        product_id: 10,
        product_name: "Shampoo sachet",
        packs: 2,
        pack_size: 144,
        cost_per_pack: 792.00,
        line_total: 1584.00
      },
      {
        product_id: 11,
        product_name: "Cooking oil 250ml",
        packs: 1,
        pack_size: 24,
        cost_per_pack: 672.00,
        line_total: 672.00
      }
    ]
  }
];

// 7. AUDIT LOG (GET /audit-log)
// AuditOut: { id: int, username: str, action: str, entity: str, entity_id: int, detail: str | null, created_at: datetime }
export const fakeAuditLog = [
  {
    id: 1,
    username: "cashier",
    action: "create",
    entity: "purchase_order",
    entity_id: 1,
    detail: "draft 2400.00",
    created_at: "2026-11-04T07:30:15Z"
  },
  {
    id: 2,
    username: "cashier",
    action: "submit",
    entity: "purchase_order",
    entity_id: 1,
    detail: "draft -> pending_approval",
    created_at: "2026-11-04T07:35:00Z"
  },
  {
    id: 3,
    username: "owner",
    action: "approve",
    entity: "purchase_order",
    entity_id: 2,
    detail: "pending_approval -> approved",
    created_at: "2026-11-03T16:00:00Z"
  },
  {
    id: 4,
    username: "cashier",
    action: "receive",
    entity: "purchase_order",
    entity_id: 5,
    detail: "sent -> received",
    created_at: "2026-11-01T11:20:00Z"
  },
  {
    id: 5,
    username: "owner",
    action: "update",
    entity: "product",
    entity_id: 1,
    detail: "Pancit canton (original)",
    created_at: "2026-11-01T09:12:00Z"
  }
];

