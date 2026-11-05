import React, { useState, useEffect } from "react";
import { api, peso, formatDate } from "../api.js";
import { IconDownload, IconBarChart, IconPackage } from "../components/Icons.jsx";

export default function Reports({ onNotify }) {
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [prods, pos, sls, logs] = await Promise.all([
          api("/products"),
          api("/purchase-orders"),
          api("/sales"),
          api("/audit-log").catch(() => []),
        ]);
        setProducts(prods || []);
        setPurchaseOrders(pos || []);
        setSales(sls || []);
        setAuditLogs(logs || []);
      } catch (err) {
        onNotify(err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Compute metrics
  const totalCostValuation = products.reduce((acc, p) => {
    const unitCost = p.pack_size ? p.cost_per_pack / p.pack_size : 0;
    return acc + p.on_hand_units * unitCost;
  }, 0);

  const totalRetailValuation = products.reduce((acc, p) => acc + p.on_hand_units * p.price, 0);
  const potentialGrossProfit = totalRetailValuation - totalCostValuation;
  const marginPct = totalRetailValuation > 0 ? Math.round((potentialGrossProfit / totalRetailValuation) * 100) : 0;

  const totalSalesRevenue = sales.reduce((acc, s) => acc + Number(s.total || 0), 0);
  const totalPoSpend = purchaseOrders
    .filter((po) => po.status === "received" || po.status === "approved" || po.status === "sent")
    .reduce((acc, po) => acc + Number(po.total || 0), 0);

  const exportValuationCSV = () => {
    const headers = ["Product ID", "Name", "Stock Units", "Unit Cost", "Cost Valuation", "Retail Price", "Retail Valuation", "Potential Profit"];
    const rows = products.map((p) => {
      const unitCost = p.pack_size ? p.cost_per_pack / p.pack_size : 0;
      const costVal = p.on_hand_units * unitCost;
      const retailVal = p.on_hand_units * p.price;
      return [
        p.id,
        `"${p.name}"`,
        p.on_hand_units,
        unitCost.toFixed(2),
        costVal.toFixed(2),
        p.price,
        retailVal.toFixed(2),
        (retailVal - costVal).toFixed(2),
      ];
    });

    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `kahera-inventory-valuation-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify("Exported inventory valuation report", "success");
  };

  const getStatusBadge = (status) => {
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

  const topProducts = products
    .slice()
    .sort((a, b) => b.on_hand_units * b.price - a.on_hand_units * a.price)
    .slice(0, 6);

  const workflowStatuses = ["draft", "pending_approval", "approved", "sent", "received"];

  return (
    <div className="reports-page">
      <div className="toolbar">
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Financial valuation, restock forecasts, sales movements, and purchasing audit
          </p>
        </div>
        <button className="btn btn-primary" onClick={exportValuationCSV}>
          <IconDownload size={16} /> Export Valuation CSV
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Cost Valuation</span>
            <div className="metric-icon-box" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
              <IconPackage size={18} />
            </div>
          </div>
          <div className="metric-value">{peso(totalCostValuation)}</div>
          <div className="metric-subtext" style={{ color: "var(--color-text-muted)" }}>
            Total wholesale capital invested
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Retail Valuation</span>
            <div className="metric-icon-box" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>
              <IconBarChart size={18} />
            </div>
          </div>
          <div className="metric-value">{peso(totalRetailValuation)}</div>
          <div className="metric-subtext" style={{ color: "var(--color-success)" }}>
            +{marginPct}% potential profit margin
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Sales Revenue Recorded</span>
            <div className="metric-icon-box" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
              <IconBarChart size={18} />
            </div>
          </div>
          <div className="metric-value">{peso(totalSalesRevenue)}</div>
          <div className="metric-subtext" style={{ color: "var(--color-text-muted)" }}>
            Across {sales.length} transactions
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Committed PO Restock</span>
            <div className="metric-icon-box" style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>
              <IconPackage size={18} />
            </div>
          </div>
          <div className="metric-value">{peso(totalPoSpend)}</div>
          <div className="metric-subtext" style={{ color: "var(--color-text-muted)" }}>
            Approved & received orders
          </div>
        </div>
      </div>

      {/* Responsive Reports Breakdown Section */}
      <div className="reports-two-col">
        {/* Top Stock Valuation Items */}
        <div className="card report-table-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Value Items in Stock</h3>
              <p className="card-subtitle">Highest capital value items currently in inventory</p>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="table-container report-desktop-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th style={{ textAlign: "right" }}>Cost Value</th>
                  <th style={{ textAlign: "right" }}>Retail Value</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)" }}>
                      No products recorded yet.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p) => {
                    const unitCost = p.pack_size ? p.cost_per_pack / p.pack_size : 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                            {p.barcode || `SKU-${p.id}`}
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span className="badge badge-draft">{p.on_hand_units} units</span>
                        </td>
                        <td className="mono" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          {peso(p.on_hand_units * unitCost)}
                        </td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)", whiteSpace: "nowrap" }}>
                          {peso(p.on_hand_units * p.price)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-List View */}
          <div className="report-mobile-list">
            {topProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                No products recorded yet.
              </div>
            ) : (
              topProducts.map((p) => {
                const unitCost = p.pack_size ? p.cost_per_pack / p.pack_size : 0;
                return (
                  <div key={p.id} className="report-list-item">
                    <div className="report-item-main">
                      <div className="report-item-title">{p.name}</div>
                      <div className="report-item-sub">
                        <span className="badge badge-draft">{p.on_hand_units} units</span>
                        {p.barcode && <span className="mono">{p.barcode}</span>}
                      </div>
                    </div>
                    <div className="report-item-values">
                      <div className="report-item-retail">{peso(p.on_hand_units * p.price)}</div>
                      <div className="report-item-cost">Cost: {peso(p.on_hand_units * unitCost)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Purchase Order Status Distribution */}
        <div className="card report-table-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Purchase Order Workflow Breakdown</h3>
              <p className="card-subtitle">Capital allocated across order approval stages</p>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="table-container report-desktop-table">
            <table>
              <thead>
                <tr>
                  <th>Workflow Status</th>
                  <th>Orders Count</th>
                  <th style={{ textAlign: "right" }}>Total Capital Value</th>
                </tr>
              </thead>
              <tbody>
                {workflowStatuses.map((status) => {
                  const matching = purchaseOrders.filter((po) => po.status === status);
                  const sum = matching.reduce((acc, po) => acc + Number(po.total || 0), 0);
                  return (
                    <tr key={status}>
                      <td>
                        {getStatusBadge(status)}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 500 }}>
                          {matching.length} {matching.length === 1 ? "order" : "orders"}
                        </span>
                      </td>
                      <td className="mono" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <strong>{peso(sum)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-List View */}
          <div className="report-mobile-list">
            {workflowStatuses.map((status) => {
              const matching = purchaseOrders.filter((po) => po.status === status);
              const sum = matching.reduce((acc, po) => acc + Number(po.total || 0), 0);
              return (
                <div key={status} className="report-list-item">
                  <div className="report-item-main">
                    <div>{getStatusBadge(status)}</div>
                    <div className="report-item-sub" style={{ marginTop: "4px" }}>
                      {matching.length} {matching.length === 1 ? "order" : "orders"}
                    </div>
                  </div>
                  <div className="report-item-values">
                    <div className="report-item-retail">{peso(sum)}</div>
                    <div className="report-item-cost">Allocated Capital</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
