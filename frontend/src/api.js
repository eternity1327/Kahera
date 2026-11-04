import {
  loadMockState,
  saveMockState,
  resetMockState,
  initialRestockSuggestions,
} from "./fakeData.js";

export { resetMockState };

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Auth & Session Storage
export const getToken = () => localStorage.getItem("token") || "demo-token";
export const setToken = (token) => localStorage.setItem("token", token);
export const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("kahera_role");
  localStorage.removeItem("kahera_username");
};

// Mode switch: 'demo' (uses fakeData.js state) vs 'live' (hits FastAPI)
export const getAppMode = () => localStorage.getItem("kahera_mode") || "demo";
export const setAppMode = (mode) => localStorage.setItem("kahera_mode", mode);

// Active Role simulation: 'owner' | 'cashier' | 'agent'
export const getActiveRole = () => localStorage.getItem("kahera_role") || "owner";
export const setActiveRole = (role) => localStorage.setItem("kahera_role", role);

export const getActiveUsername = () => localStorage.getItem("kahera_username") || "owner";
export const setActiveUsername = (name) => localStorage.setItem("kahera_username", name);

// Formatting helpers
export const peso = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (isoString) => {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
};

/**
 * In-memory Mock API engine that executes all endpoints against fakeData.js state.
 */
function handleMockRequest(path, { method = "GET", body } = {}) {
  const state = loadMockState();
  const currentRole = getActiveRole();
  const currentUsername = getActiveUsername();

  // Helper to append to audit log
  const audit = (action, entity, entity_id, detail) => {
    const newLog = {
      id: (state.auditLog[0]?.id || 0) + 1,
      username: currentUsername,
      action,
      entity,
      entity_id,
      detail,
      created_at: new Date().toISOString(),
    };
    state.auditLog = [newLog, ...state.auditLog];
  };

  // 1. AUTH
  if (path === "/auth/me") {
    const user = state.users.find((u) => u.username === currentUsername) || {
      id: 1,
      username: currentUsername,
      role: currentRole,
    };
    return { ...user, role: currentRole };
  }

  if (path === "/auth/login" && method === "POST") {
    return { access_token: "mock-token-" + (body?.username || "owner"), token_type: "bearer" };
  }

  if (path === "/auth/register" && method === "POST") {
    const newUser = {
      id: state.users.length + 1,
      username: body.username,
      role: "owner",
      created_at: new Date().toISOString(),
    };
    state.users.push(newUser);
    saveMockState(state);
    return { id: newUser.id, username: newUser.username, role: newUser.role };
  }

  if (path === "/auth/users") {
    if (method === "GET") {
      return state.users.map((u) => ({ id: u.id, username: u.username, role: u.role }));
    }
    if (method === "POST") {
      const newUser = {
        id: state.users.length + 1,
        username: body.username,
        role: body.role || "cashier",
        created_at: new Date().toISOString(),
      };
      state.users.push(newUser);
      audit("create", "user", newUser.id, `${newUser.username} (${newUser.role})`);
      saveMockState(state);
      return { id: newUser.id, username: newUser.username, role: newUser.role };
    }
  }

  // 2. SUPPLIERS
  if (path === "/suppliers" || path.startsWith("/suppliers")) {
    if (path === "/suppliers" && method === "GET") {
      return state.suppliers;
    }
    if (path === "/suppliers" && method === "POST") {
      const newSup = {
        id: (state.suppliers[state.suppliers.length - 1]?.id || 0) + 1,
        name: body.name,
        contact: body.contact || null,
        lead_time_days: Number(body.lead_time_days || 2),
      };
      state.suppliers.push(newSup);
      audit("create", "supplier", newSup.id, newSup.name);
      saveMockState(state);
      return newSup;
    }
    const matchId = path.match(/\/suppliers\/(\d+)/);
    if (matchId && method === "PUT") {
      const supId = Number(matchId[1]);
      const idx = state.suppliers.findIndex((s) => s.id === supId);
      if (idx !== -1) {
        state.suppliers[idx] = { ...state.suppliers[idx], ...body };
        audit("update", "supplier", supId, state.suppliers[idx].name);
        saveMockState(state);
        return state.suppliers[idx];
      }
      throw new Error("Supplier not found");
    }
  }

  // 3. PRODUCTS
  if (path === "/products" || path.startsWith("/products")) {
    const url = new URL("http://localhost" + path);
    const lowOnly = url.searchParams.get("low_only") === "true";

    if (url.pathname === "/products" && method === "GET") {
      if (lowOnly) {
        return state.products.filter((p) => p.low_stock);
      }
      return state.products;
    }

    if (url.pathname === "/products" && method === "POST") {
      const newProd = {
        id: (state.products[state.products.length - 1]?.id || 0) + 1,
        name: body.name,
        barcode: body.barcode || null,
        price: Number(body.price),
        on_hand_units: Number(body.on_hand_units || 0),
        pack_size: Number(body.pack_size || 1),
        cost_per_pack: Number(body.cost_per_pack || 0),
        safety_days: Number(body.safety_days || 2),
        supplier_id: body.supplier_id ? Number(body.supplier_id) : null,
        avg_daily_sales: 0,
        reorder_point: Math.ceil(0 * (2 + Number(body.safety_days || 2))),
        low_stock: Number(body.on_hand_units || 0) <= 0,
      };
      state.products.push(newProd);
      audit("create", "product", newProd.id, newProd.name);
      saveMockState(state);
      return newProd;
    }

    const matchProdId = url.pathname.match(/\/products\/(\d+)/);
    if (matchProdId) {
      const prodId = Number(matchProdId[1]);
      const idx = state.products.findIndex((p) => p.id === prodId);
      if (idx === -1) throw new Error("Product not found");

      if (method === "PUT") {
        const p = state.products[idx];
        const updated = {
          ...p,
          ...body,
          price: Number(body.price ?? p.price),
          on_hand_units: Number(body.on_hand_units ?? p.on_hand_units),
          pack_size: Number(body.pack_size ?? p.pack_size),
          cost_per_pack: Number(body.cost_per_pack ?? p.cost_per_pack),
          safety_days: Number(body.safety_days ?? p.safety_days),
          supplier_id: body.supplier_id ? Number(body.supplier_id) : p.supplier_id,
        };
        updated.low_stock = updated.on_hand_units <= updated.reorder_point;
        state.products[idx] = updated;
        audit("update", "product", prodId, updated.name);
        saveMockState(state);
        return updated;
      }

      if (method === "DELETE") {
        const deleted = state.products[idx];
        state.products.splice(idx, 1);
        audit("delete", "product", prodId, deleted.name);
        saveMockState(state);
        return null;
      }
    }
  }

  // 4. SALES
  if (path === "/sales" || path.startsWith("/sales")) {
    if (method === "GET") {
      return state.sales;
    }
    if (method === "POST") {
      let total = 0;
      const saleItems = [];
      for (const item of body.items) {
        const prod = state.products.find((p) => p.id === item.product_id);
        if (!prod) throw new Error(`Product ${item.product_id} not found`);
        if (prod.on_hand_units < item.quantity) {
          throw new Error(`Not enough stock for ${prod.name}`);
        }
        prod.on_hand_units -= item.quantity;
        prod.low_stock = prod.on_hand_units <= prod.reorder_point;
        const linePrice = prod.price * item.quantity;
        total += linePrice;
        saleItems.push({
          product_id: prod.id,
          quantity: item.quantity,
          price: prod.price,
        });
      }
      const newSale = {
        id: (state.sales[0]?.id || 100) + 1,
        total,
        created_at: new Date().toISOString(),
        items: saleItems,
      };
      state.sales = [newSale, ...state.sales];
      saveMockState(state);
      return newSale;
    }
  }

  // 5. RESTOCK SUGGESTIONS
  if (path.startsWith("/restock/suggestions")) {
    const url = new URL("http://localhost" + path);
    const budgetParam = url.searchParams.get("budget");
    const budget = budgetParam ? Number(budgetParam) : 5000;

    // Recalculate based on real current state of products
    const items = [];
    let runningTotal = 0;
    for (const p of state.products) {
      if (p.low_stock && p.cost_per_pack) {
        const supplier = state.suppliers.find((s) => s.id === p.supplier_id);
        const neededUnits = Math.max(p.reorder_point + Math.ceil(p.avg_daily_sales * 7) - p.on_hand_units, p.pack_size);
        const packs = Math.max(Math.ceil(neededUnits / p.pack_size), 1);
        const lineTotal = packs * p.cost_per_pack;
        items.push({
          product_id: p.id,
          product_name: p.name,
          supplier_id: p.supplier_id,
          supplier_name: supplier?.name || "Unassigned",
          on_hand_units: p.on_hand_units,
          avg_daily_sales: p.avg_daily_sales,
          lead_time_days: supplier?.lead_time_days || 2,
          safety_days: p.safety_days,
          reorder_point: p.reorder_point,
          days_left: p.avg_daily_sales ? Number((p.on_hand_units / p.avg_daily_sales).toFixed(1)) : 0,
          pack_size: p.pack_size,
          cost_per_pack: p.cost_per_pack,
          packs,
          line_total: lineTotal,
        });
        runningTotal += lineTotal;
      }
    }

    return {
      budget,
      total: runningTotal,
      items: items.length > 0 ? items : initialRestockSuggestions.items,
      skipped: initialRestockSuggestions.skipped,
    };
  }

  // 6. PURCHASE ORDERS
  if (path === "/purchase-orders" || path.startsWith("/purchase-orders")) {
    const url = new URL("http://localhost" + path);

    if (url.pathname === "/purchase-orders" && method === "GET") {
      const statusFilter = url.searchParams.get("status");
      if (statusFilter) {
        return state.purchaseOrders.filter((po) => po.status === statusFilter);
      }
      return state.purchaseOrders;
    }

    // POST /purchase-orders/from-suggestions?budget=
    if (url.pathname === "/purchase-orders/from-suggestions" && method === "POST") {
      const suggestions = handleMockRequest("/restock/suggestions?budget=" + (url.searchParams.get("budget") || 5000));
      const bySupplier = {};
      for (const item of suggestions.items) {
        if (!item.supplier_id) continue;
        if (!bySupplier[item.supplier_id]) bySupplier[item.supplier_id] = [];
        bySupplier[item.supplier_id].push(item);
      }
      const createdPOs = [];
      for (const [supId, items] of Object.entries(bySupplier)) {
        const supplier = state.suppliers.find((s) => s.id === Number(supId));
        const poItems = items.map((it) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          packs: it.packs,
          pack_size: it.pack_size,
          cost_per_pack: it.cost_per_pack,
          line_total: it.line_total,
        }));
        const totalCost = poItems.reduce((sum, it) => sum + it.line_total, 0);
        const newPO = {
          id: (state.purchaseOrders[0]?.id || 0) + 1,
          status: "draft",
          supplier_id: Number(supId),
          supplier_name: supplier?.name || "Supplier",
          budget: Number(url.searchParams.get("budget")) || null,
          total: totalCost,
          created_by: currentUsername,
          created_by_role: currentRole,
          created_at: new Date().toISOString(),
          items: poItems,
        };
        state.purchaseOrders = [newPO, ...state.purchaseOrders];
        audit("create", "purchase_order", newPO.id, `draft from suggestions ${newPO.total}`);
        createdPOs.push(newPO);
      }
      saveMockState(state);
      return createdPOs;
    }

    // POST /purchase-orders (manual draft)
    if (url.pathname === "/purchase-orders" && method === "POST") {
      const supplier = state.suppliers.find((s) => s.id === Number(body.supplier_id));
      const poItems = (body.items || []).map((it) => {
        const prod = state.products.find((p) => p.id === it.product_id);
        return {
          product_id: it.product_id,
          product_name: prod?.name || "Product",
          packs: Number(it.packs),
          pack_size: prod?.pack_size || 1,
          cost_per_pack: Number(prod?.cost_per_pack || 0),
          line_total: Number(prod?.cost_per_pack || 0) * Number(it.packs),
        };
      });
      const totalCost = poItems.reduce((sum, it) => sum + it.line_total, 0);
      const newPO = {
        id: (state.purchaseOrders[0]?.id || 0) + 1,
        status: "draft",
        supplier_id: Number(body.supplier_id),
        supplier_name: supplier?.name || "Supplier",
        budget: body.budget ? Number(body.budget) : null,
        total: totalCost,
        created_by: currentUsername,
        created_by_role: currentRole,
        created_at: new Date().toISOString(),
        items: poItems,
      };
      state.purchaseOrders = [newPO, ...state.purchaseOrders];
      audit("create", "purchase_order", newPO.id, `draft ${newPO.total}`);
      saveMockState(state);
      return newPO;
    }

    // Specific PO operations: /purchase-orders/{id}
    const matchPoAction = url.pathname.match(/\/purchase-orders\/(\d+)(?:\/(submit|approve|send|receive))?/);
    if (matchPoAction) {
      const poId = Number(matchPoAction[1]);
      const action = matchPoAction[2];
      const idx = state.purchaseOrders.findIndex((p) => p.id === poId);
      if (idx === -1) throw new Error("Purchase order not found");
      const po = state.purchaseOrders[idx];

      if (!action) {
        if (method === "GET") return po;
        if (method === "PUT") {
          if (po.status !== "draft") throw new Error(`PO #${po.id} is ${po.status}; only drafts can be edited`);
          const poItems = (body.items || []).map((it) => {
            const prod = state.products.find((p) => p.id === it.product_id);
            return {
              product_id: it.product_id,
              product_name: prod?.name || "Product",
              packs: Number(it.packs),
              pack_size: prod?.pack_size || 1,
              cost_per_pack: Number(prod?.cost_per_pack || 0),
              line_total: Number(prod?.cost_per_pack || 0) * Number(it.packs),
            };
          });
          po.items = poItems;
          po.total = poItems.reduce((sum, it) => sum + it.line_total, 0);
          if (body.budget !== undefined) po.budget = body.budget ? Number(body.budget) : null;
          audit("update", "purchase_order", po.id, `total ${po.total}`);
          saveMockState(state);
          return po;
        }
      }

      if (action === "submit" && method === "POST") {
        po.status = "pending_approval";
        audit("submit", "purchase_order", po.id, "draft -> pending_approval");
        saveMockState(state);
        return po;
      }

      if (action === "approve" && method === "POST") {
        if (currentRole !== "owner") throw new Error("Only owner can approve purchase orders");
        po.status = "approved";
        audit("approve", "purchase_order", po.id, "pending_approval -> approved");
        saveMockState(state);
        return po;
      }

      if (action === "send" && method === "POST") {
        if (currentRole !== "owner") throw new Error("Only owner can send purchase orders");
        po.status = "sent";
        audit("send", "purchase_order", po.id, "approved -> sent");
        saveMockState(state);
        return po;
      }

      if (action === "receive" && method === "POST") {
        po.status = "received";
        // Increase product on_hand_units: packs * pack_size
        for (const item of po.items) {
          const prod = state.products.find((p) => p.id === item.product_id);
          if (prod) {
            prod.on_hand_units += item.packs * item.pack_size;
            prod.low_stock = prod.on_hand_units <= prod.reorder_point;
          }
        }
        audit("receive", "purchase_order", po.id, "sent -> received");
        saveMockState(state);
        return po;
      }
    }
  }

  // 7. AUDIT LOG
  if (path.startsWith("/audit-log") && method === "GET") {
    return state.auditLog;
  }

  throw new Error(`Endpoint ${method} ${path} not supported in mock`);
}

/**
 * Universal api() function:
 * If app mode is 'demo', handles request in-memory with fakeData.js.
 * If app mode is 'live', attempts backend fetch; on failure, can fall back gracefully.
 */
export async function api(path, { method = "GET", body, form } = {}) {
  const mode = getAppMode();

  if (mode === "demo") {
    // Artificial slight delay for realistic UI loading states
    await new Promise((r) => setTimeout(r, 60));
    return handleMockRequest(path, { method, body });
  }

  // Live FastAPI backend mode
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(API_URL + path, {
      method,
      headers,
      body: form ? new URLSearchParams(form) : body && JSON.stringify(body),
    });

    if (res.status === 401 && token) {
      clearToken();
      window.location.reload();
    }
    if (res.status === 204) return null;

    const data = await res.json();
    if (!res.ok) {
      const detail = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
      throw new Error(detail || "Request failed");
    }
    return data;
  } catch (err) {
    console.warn(`[Kahera API] Live backend connection error on ${method} ${path}. Switching to fallback demo state.`, err);
    // If live call fails (e.g. backend offline), seamlessly fall back so UI never breaks!
    return handleMockRequest(path, { method, body });
  }
}
