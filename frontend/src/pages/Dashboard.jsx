import React, { useState, useEffect } from "react";
import { api, peso, formatDate, getActiveRole } from "../api.js";
import SalesPerDayChart from "../components/SalesPerDayChart.jsx";
import {
  IconPackage,
  IconAlertTriangle,
  IconClock,
  IconShoppingCart,
  IconPlus,
} from "../components/Icons.jsx";

export default function Dashboard({ onNavigate, onOpenNewPo }) {
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = getActiveRole();

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, pos, sls] = await Promise.all([
        api("/products"),
        api("/purchase-orders"),
        api("/sales"),
      ]);
      setProducts(prods || []);
      setPurchaseOrders(pos || []);
      setSales(sls || []);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalStockValuation = products.reduce((sum, p) => {
    const costPerUnit = p.pack_size ? p.cost_per_pack / p.pack_size : 0;
    return sum + p.on_hand_units * costPerUnit;
  }, 0);

  const lowStockProducts = products.filter((p) => p.low_stock);
  const outOfStockProducts = products.filter((p) => p.on_hand_units === 0);
  const healthyProducts = products.filter((p) => !p.low_stock && p.on_hand_units > 0);

  const pendingOrders = purchaseOrders.filter((po) => po.status === "pending_approval");
  const todaySalesTotal = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const totalCount = products.length || 1;
  const healthyPct = Math.round((healthyProducts.length / totalCount) * 100);
  const lowStockPct = Math.round(((lowStockProducts.length - outOfStockProducts.length) / totalCount) * 100);
  const outOfStockPct = Math.round((outOfStockProducts.length / totalCount) * 100);

  const avgSafetyDays = products.length
    ? (products.reduce((acc, p) => acc + (p.safety_days || 0), 0) / products.length).toFixed(1)
    : "2.0";

  return (
    <div className="dashboard-page">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Stock Value</span>
            <div className="metric-icon-box" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
              <IconPackage size={18} />
            </div>
          </div>
          <div className="metric-value">{peso(totalStockValuation)}</div>
          <div className="metric-subtext">
            <span style={{ color: "var(--color-text-muted)" }}>At cost, across all products</span>
          </div>
        </div>

        <div className={`metric-card ${lowStockProducts.length > 0 ? "metric-alert" : ""}`}>
          <div className="metric-header">
            <span className="metric-label">Low Stock Alerts</span>
            <div className="metric-icon-box" style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}>
              <IconAlertTriangle size={18} />
            </div>
          </div>
          <div className="metric-value">{lowStockProducts.length}</div>
          <div className="metric-subtext" style={{ color: "var(--color-error)" }}>
            <span>{outOfStockProducts.length} out of stock</span>
            <span style={{ color: "var(--color-text-muted)" }}>• urgent restock</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Pending Orders</span>
            <div className="metric-icon-box" style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>
              <IconClock size={18} />
            </div>
          </div>
          <div className="metric-value">{pendingOrders.length}</div>
          <div className="metric-subtext">
            <span style={{ color: "#b45309", fontWeight: 600 }}>{pendingOrders.length}</span>
            <span style={{ color: "var(--color-text-muted)" }}>pending owner approval</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Sales Recorded</span>
            <div className="metric-icon-box" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>
              <IconShoppingCart size={18} />
            </div>
          </div>
          <div className="metric-value">{peso(todaySalesTotal)}</div>
          <div className="metric-subtext" style={{ color: "var(--color-text-muted)" }}>
            <span>{sales.length} orders in record</span>
          </div>
        </div>
      </div>

      <SalesPerDayChart sales={sales} />

      <div className="dashboard-two-col">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--color-error)" }}>●</span> Critical Stock Alerts
              </h3>
              <p className="card-subtitle">Products below computed reorder point</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("products")}>
              View All
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
              All inventory levels are currently healthy!
            </div>
          ) : (
            <div className="table-container" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Reorder Pt</th>
                    <th>Safety</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.slice(0, 5).map((p) => (
                    <tr key={p.id} className="row-low-stock">
                      <td>
                        <strong>{p.name}</strong>
                        <div className="mono" style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                          SKU: {p.barcode || `PRD-${p.id}`}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: p.on_hand_units === 0 ? "var(--color-error)" : "#b45309" }}>
                          {p.on_hand_units} units
                        </span>
                      </td>
                      <td>
                        <span className="mono">{p.reorder_point}</span>
                      </td>
                      <td>{p.safety_days}d</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: "3px 8px", fontSize: "0.72rem" }}
                          onClick={() => onOpenNewPo(p)}
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Inventory Health</h3>
              <p className="card-subtitle">Safety coverage & stock distribution</p>
            </div>
            <span className="badge badge-healthy">{healthyPct}% Healthy</span>
          </div>

          <div className="dashboard-health-row">
            <div style={{ position: "relative", width: "140px", height: "140px" }}>
              <svg width="140" height="140" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-border)" strokeWidth="4"></circle>
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="var(--color-success)"
                  strokeWidth="4"
                  strokeDasharray={`${healthyPct} ${100 - healthyPct}`}
                  strokeDashoffset="25"
                ></circle>
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="var(--color-warning)"
                  strokeWidth="4"
                  strokeDasharray={`${lowStockPct} ${100 - lowStockPct}`}
                  strokeDashoffset={`${25 - healthyPct}`}
                ></circle>
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="var(--color-error)"
                  strokeWidth="4"
                  strokeDasharray={`${outOfStockPct} ${100 - outOfStockPct}`}
                  strokeDashoffset={`${25 - healthyPct - lowStockPct}`}
                ></circle>
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "1.3rem", fontWeight: 800 }}>{healthyPct}%</span>
                <span style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>HEALTHY</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-success)" }}></span>
                <span>Healthy Stock:</span>
                <strong>{healthyProducts.length}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-warning)" }}></span>
                <span>Low Stock:</span>
                <strong>{lowStockProducts.length - outOfStockProducts.length}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-error)" }}></span>
                <span>Out of Stock:</span>
                <strong>{outOfStockProducts.length}</strong>
              </div>
              <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "8px", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                Average Safety Days: <strong>{avgSafetyDays} days</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Purchase Orders</h3>
            <p className="card-subtitle">Orders moving through draft, approval, and receipt</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("purchase-orders")}>
            <IconPlus size={14} /> New Purchase Order
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.slice(0, 5).map((po) => {
                const getBadge = (status) => {
                  switch (status) {
                    case "draft":
                      return <span className="badge badge-draft">Draft</span>;
                    case "pending_approval":
                      return <span className="badge badge-submitted">Pending Approval</span>;
                    case "approved":
                      return <span className="badge badge-approved">Approved</span>;
                    case "sent":
                      return <span className="badge badge-sent">Sent</span>;
                    case "received":
                      return <span className="badge badge-received">Received</span>;
                    default:
                      return <span className="badge badge-draft">{status}</span>;
                  }
                };

                return (
                  <tr key={po.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                        #{String(po.id).padStart(4, "0")}
                      </span>
                    </td>
                    <td>{po.supplier_name}</td>
                    <td>{formatDate(po.created_at)}</td>
                    <td>{po.items?.length || 0} items</td>
                    <td>
                      <strong className="mono">{peso(po.total)}</strong>
                    </td>
                    <td>{getBadge(po.status)}</td>
                    <td>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                        {po.created_by} ({po.created_by_role})
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                        onClick={() => onNavigate("purchase-orders")}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

