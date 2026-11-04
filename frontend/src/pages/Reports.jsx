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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Top Stock Valuation Items */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Value Items in Stock</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Cost Value</th>
                  <th>Retail Value</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .slice()
                  .sort((a, b) => b.on_hand_units * b.price - a.on_hand_units * a.price)
                  .slice(0, 6)
                  .map((p) => {
                    const unitCost = p.pack_size ? p.cost_per_pack / p.pack_size : 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                        </td>
                        <td>{p.on_hand_units} units</td>
                        <td className="mono">{peso(p.on_hand_units * unitCost)}</td>
                        <td className="mono" style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                          {peso(p.on_hand_units * p.price)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase Order Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Purchase Order Workflow Breakdown</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Workflow Status</th>
                  <th>Orders Count</th>
                  <th>Total Capital Value</th>
                </tr>
              </thead>
              <tbody>
                {["draft", "pending_approval", "approved", "sent", "received"].map((status) => {
                  const matching = purchaseOrders.filter((po) => po.status === status);
                  const sum = matching.reduce((acc, po) => acc + Number(po.total || 0), 0);
                  return (
                    <tr key={status}>
                      <td>
                        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                          {status.replace("_", " ")}
                        </span>
                      </td>
                      <td>{matching.length} orders</td>
                      <td className="mono">
                        <strong>{peso(sum)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

