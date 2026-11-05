import React, { useState, useEffect } from "react";
import { api, peso, getActiveRole } from "../api.js";
import { IconSearch, IconShoppingCart, IconX, IconPlus } from "../components/Icons.jsx";

export default function Pos({ onNotify }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const role = getActiveRole();
  const canSell = role === "owner" || role === "cashier";

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api("/products");
      setProducts(data || []);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = (product) => {
    if (product.on_hand_units <= 0) return;
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.on_hand_units) {
        return onNotify(`Only ${product.on_hand_units} units in stock`, "error");
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      const prod = products.find((p) => p.id === productId);
      if (prod && newQty > prod.on_hand_units) {
        return onNotify(`Only ${prod.on_hand_units} units in stock`, "error");
      }
      setCart(
        cart.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    const matched = products.find(
      (p) =>
        p.barcode === search.trim() ||
        p.name.toLowerCase() === search.trim().toLowerCase()
    );
    if (matched) {
      addToCart(matched);
      setSearch("");
      onNotify(`Added ${matched.name} to cart`, "success");
    } else {
      onNotify("No product found with that barcode or name", "error");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!canSell) {
      return onNotify(`Role "${role}" does not have cashier selling permissions`, "error");
    }

    try {
      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));
      const sale = await api("/sales", { method: "POST", body: { items } });
      onNotify(`Sale #${sale.id} completed! Total: ${peso(sale.total)}`, "success");
      setCart([]);
      loadProducts();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="pos-page pos-layout">
      {/* Products Grid Section */}
      <div>
        <form onSubmit={handleBarcodeSubmit} style={{ marginBottom: "16px" }}>
          <div className="search-box">
            <span className="search-icon">
              <IconSearch size={16} />
            </span>
            <input
              placeholder="Scan barcode or search product name (Press Enter to quick add)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        <div className="pos-product-grid">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.on_hand_units <= 0;
            return (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: "14px",
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  opacity: isOutOfStock ? 0.6 : 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "8px",
                  border: p.low_stock ? "1px solid var(--color-error-border)" : "1px solid var(--color-border)",
                }}
                onClick={() => !isOutOfStock && addToCart(p)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", lineHeight: 1.3 }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                    {p.barcode || `ID: ${p.id}`}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "8px" }}>
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-primary)" }}>
                      {peso(p.price)}
                    </div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: isOutOfStock ? "var(--color-error)" : p.low_stock ? "#b45309" : "var(--color-text-muted)",
                      }}
                    >
                      {p.on_hand_units} in stock
                    </span>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    disabled={isOutOfStock}
                    style={{ padding: "4px 8px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p);
                    }}
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POS Cart Sidebar */}
      <div className="card pos-cart-card">
        <div className="card-header" style={{ marginBottom: "12px" }}>
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconShoppingCart size={18} /> Active Cart
          </h3>
          <span className="badge badge-approved">{cart.length} items</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              Cart is empty. Click items or scan barcodes to begin sale.
            </div>
          ) : (
            cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {product.name}
                  </div>
                  <div className="mono" style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    {peso(product.price)} each
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    className="btn-icon"
                    style={{ padding: "3px 6px" }}
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 700, minWidth: "20px", textAlign: "center" }}>
                    {quantity}
                  </span>
                  <button
                    className="btn-icon"
                    style={{ padding: "3px 6px" }}
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                  >
                    +
                  </button>
                  <strong className="mono" style={{ marginLeft: "8px", minWidth: "55px", textAlign: "right" }}>
                    {peso(product.price * quantity)}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "16px", marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem" }}>
            <span>Subtotal</span>
            <span className="mono">{peso(cartTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "1.1rem", fontWeight: 800 }}>
            <span>Total Payable</span>
            <span className="mono" style={{ color: "var(--color-primary)" }}>{peso(cartTotal)}</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px" }}
            disabled={cart.length === 0 || !canSell}
            onClick={handleCheckout}
          >
            Complete Sale ({peso(cartTotal)})
          </button>
          {!canSell && (
            <p style={{ fontSize: "0.72rem", color: "var(--color-error)", textAlign: "center", marginTop: "6px" }}>
              Only owner or cashier can process sales.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

