/**
 * fakeData.js
 * 
 * Static mock data and in-memory store for Kahera Inventory Management System.
 * Every field name strictly mirrors the backend API models and schemas:
 * 
 * - POST /auth/register                 -> UserOut { id, username, role }
 * - POST /auth/login                    -> Token { access_token, token_type }
 * - GET  /auth/me                       -> UserOut { id, username, role }
 * - GET, POST /auth/users               -> list[UserOut], StaffCreate { username, password, role }
 * - GET  /suppliers                     -> list[SupplierOut] { id, name, contact, lead_time_days }
 * - POST, PUT /suppliers, /suppliers/{id}-> SupplierIn / SupplierOut
 * - GET  /products?low_only=true        -> list[ProductOut] { id, name, barcode, price, on_hand_units, pack_size, cost_per_pack, safety_days, supplier_id, avg_daily_sales, reorder_point, low_stock }
 * - POST, PUT /products, /products/{id} -> ProductIn / ProductOut
 * - DELETE /products/{id}               -> 204 No Content
 * - GET  /sales                         -> list[SaleOut] { id, total, created_at, items: [{ product_id, quantity, price }] }
 * - POST /sales                         -> SaleIn { items: [{ product_id, quantity }] } -> SaleOut
 * - GET  /restock/suggestions?budget=   -> SuggestionsOut { budget, total, items: [Suggestion], skipped: [Suggestion] }
 * - GET  /purchase-orders?status=       -> list[POOut] { id, status, supplier_id, supplier_name, budget, total, created_by, created_by_role, created_at, items: [POItemOut] }
 * - GET  /purchase-orders/{id}          -> POOut
 * - POST /purchase-orders               -> POCreate { supplier_id, budget, items: [{ product_id, packs }] } -> POOut (draft)
 * - POST /purchase-orders/from-suggestions?budget= -> list[POOut]
 * - PUT  /purchase-orders/{id}          -> POUpdate { budget, items: [{ product_id, packs }] } -> POOut
 * - POST /purchase-orders/{id}/submit   -> POOut (status: "pending_approval")
 * - POST /purchase-orders/{id}/approve  -> POOut (status: "approved")
 * - POST /purchase-orders/{id}/send     -> POOut (status: "sent")
 * - POST /purchase-orders/{id}/receive  -> POOut (status: "received", stock updated)
 * - GET  /audit-log                     -> list[AuditOut] { id, username, action, entity, entity_id, detail, created_at }
 */

// 1. AUTH & USERS (GET /auth/me, GET/POST /auth/users, POST /auth/register, POST /auth/login)
export const initialUsers = [
  {
    id: 1,
    username: "owner",
    role: "owner",
    created_at: "2026-10-01T08:00:00Z"
  },
  {
    id: 2,
    username: "cashier",
    role: "cashier",
    created_at: "2026-10-05T09:30:00Z"
  },
  {
    id: 3,
    username: "restock",
    role: "agent",
    created_at: "2026-10-10T11:00:00Z"
  }
];

export const initialToken = {
  access_token: "mock-jwt-token-kahera-owner",
  token_type: "bearer"
};

// 2. SUPPLIERS (GET /suppliers, POST /suppliers, PUT /suppliers/{id})
export const initialSuppliers = [
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

// 3. PRODUCTS (GET /products, GET /products?low_only=true, POST /products, PUT /products/{id}, DELETE /products/{id})
export const initialProducts = [
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
export const initialSales = [
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
export const initialRestockSuggestions = {
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

// 6. PURCHASE ORDERS (GET /purchase-orders, GET /purchase-orders/{id}, POST /purchase-orders, PUT /purchase-orders/{id}, etc.)
export const initialPurchaseOrders = [
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
export const initialAuditLog = [
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

// 8. API ROUTE METADATA TABLE (Reflecting the user's specification)
export const apiCatalog = [
  { method: "POST", path: "/auth/register", who: "First user only (becomes owner)", entity: "auth" },
  { method: "POST", path: "/auth/login", who: "All", entity: "auth" },
  { method: "GET", path: "/auth/me", who: "All", entity: "auth" },
  { method: "GET, POST", path: "/auth/users", who: "owner", entity: "auth" },
  { method: "GET", path: "/suppliers", who: "All", entity: "suppliers" },
  { method: "POST, PUT", path: "/suppliers, /suppliers/{id}", who: "owner", entity: "suppliers" },
  { method: "GET", path: "/products?low_only=true", who: "All", entity: "products" },
  { method: "POST, PUT", path: "/products, /products/{id}", who: "owner, cashier", entity: "products" },
  { method: "DELETE", path: "/products/{id}", who: "owner", entity: "products" },
  { method: "GET", path: "/sales", who: "All", entity: "sales" },
  { method: "POST", path: "/sales", who: "owner, cashier", entity: "sales" },
  { method: "GET", path: "/restock/suggestions?budget=", who: "All", entity: "restock" },
  { method: "GET", path: "/purchase-orders?status=", who: "All", entity: "purchase_orders" },
  { method: "GET", path: "/purchase-orders/{id}", who: "All", entity: "purchase_orders" },
  { method: "POST", path: "/purchase-orders", who: "owner, cashier, agent", entity: "purchase_orders" },
  { method: "POST", path: "/purchase-orders/from-suggestions?budget=", who: "owner, cashier, agent", entity: "purchase_orders" },
  { method: "PUT", path: "/purchase-orders/{id} (drafts only)", who: "owner, cashier, agent", entity: "purchase_orders" },
  { method: "POST", path: "/purchase-orders/{id}/submit", who: "owner, cashier", entity: "purchase_orders" },
  { method: "POST", path: "/purchase-orders/{id}/approve", who: "owner", entity: "purchase_orders" },
  { method: "POST", path: "/purchase-orders/{id}/send", who: "owner", entity: "purchase_orders" },
  { method: "POST", path: "/purchase-orders/{id}/receive", who: "owner, cashier", entity: "purchase_orders" },
  { method: "GET", path: "/audit-log", who: "owner", entity: "audit" }
];

/**
 * Storage helpers for interactive Demo Mode with fakeData:
 * Lets the UI perform CRUD, updates inventory on receiving POs, logs audit events, etc.
 */
const STORAGE_KEY = "kahera_mock_state";

export function loadMockState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not parse saved mock state:", e);
  }
  return {
    users: initialUsers,
    suppliers: initialSuppliers,
    products: initialProducts,
    sales: initialSales,
    purchaseOrders: initialPurchaseOrders,
    auditLog: initialAuditLog
  };
}

export function saveMockState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Could not save mock state:", e);
  }
}

export function resetMockState() {
  const initial = {
    users: initialUsers,
    suppliers: initialSuppliers,
    products: initialProducts,
    sales: initialSales,
    purchaseOrders: initialPurchaseOrders,
    auditLog: initialAuditLog
  };
  saveMockState(initial);
  return initial;
}

