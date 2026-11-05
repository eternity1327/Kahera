import React, { useState, useEffect } from "react";
import { api, peso, formatDate, getActiveRole } from "../api.js";
import {
  IconPlus,
  IconClock,
  IconCheckCircle,
  IconSend,
  IconTruck,
  IconEdit,
  IconX,
  IconAlertTriangle,
} from "../components/Icons.jsx";

export default function PurchaseOrders({ onNotify, initialRestockProduct }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  // Modals
  const [isNewPoOpen, setIsNewPoOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isReceivingOpen, setIsReceivingOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditDraftOpen, setIsEditDraftOpen] = useState(false);

  // Modal active states
  const [selectedPo, setSelectedPo] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [budgetInput, setBudgetInput] = useState("5000");

  // New / Draft PO form
  const [poFormSupplierId, setPoFormSupplierId] = useState("");
  const [poFormBudget, setPoFormBudget] = useState("");
  const [poFormItems, setPoFormItems] = useState([]); // [{ product_id, packs }]

  const role = getActiveRole();
  const isOwner = role === "owner";
  const canDraft = role === "owner" || role === "cashier" || role === "agent";
  const canSubmit = role === "owner" || role === "cashier";
  const canReceive = role === "owner" || role === "cashier";

  const loadData = async () => {
    try {
      setLoading(true);
      const [pos, sups, prods] = await Promise.all([
        api("/purchase-orders"),
        api("/suppliers"),
        api("/products"),
      ]);
      setPurchaseOrders(pos || []);
      setSuppliers(sups || []);
      setProducts(prods || []);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialRestockProduct) {
      openNewPoWithProduct(initialRestockProduct);
    }
  }, [initialRestockProduct]);

  const openNewPoWithProduct = (product) => {
    setPoFormSupplierId(product.supplier_id || (suppliers[0]?.id || ""));
    setPoFormBudget("");
    setPoFormItems([{ product_id: product.id, packs: 2 }]);
    setIsNewPoOpen(true);
  };

  const openNewPoModal = () => {
    const defaultSup = suppliers[0]?.id || "";
    setPoFormSupplierId(defaultSup);
    setPoFormBudget("");
    // Find products for this supplier
    const supProds = products.filter((p) => p.supplier_id === Number(defaultSup));
    if (supProds.length > 0) {
      setPoFormItems([{ product_id: supProds[0].id, packs: 2 }]);
    } else {
      setPoFormItems([]);
    }
    setIsNewPoOpen(true);
  };

  const handleSupplierChangeInForm = (supId) => {
    setPoFormSupplierId(supId);
    const supProds = products.filter((p) => p.supplier_id === Number(supId));
    if (supProds.length > 0) {
      setPoFormItems([{ product_id: supProds[0].id, packs: 1 }]);
    } else {
      setPoFormItems([]);
    }
  };

  const handleAddItemToForm = () => {
    const supProds = products.filter((p) => p.supplier_id === Number(poFormSupplierId));
    const unused = supProds.find((p) => !poFormItems.some((it) => it.product_id === p.id));
    if (unused) {
      setPoFormItems([...poFormItems, { product_id: unused.id, packs: 1 }]);
    } else if (supProds.length > 0) {
      setPoFormItems([...poFormItems, { product_id: supProds[0].id, packs: 1 }]);
    }
  };

  const handleRemoveItemFromForm = (idx) => {
    setPoFormItems(poFormItems.filter((_, i) => i !== idx));
  };

  const handleItemPackChange = (idx, packs) => {
    const updated = [...poFormItems];
    updated[idx].packs = Math.max(1, Number(packs));
    setPoFormItems(updated);
  };

  const handleItemProductChange = (idx, prodId) => {
    const updated = [...poFormItems];
    updated[idx].product_id = Number(prodId);
    setPoFormItems(updated);
  };

  // Submit Draft Creation
  const handleSaveDraft = async () => {
    if (!poFormSupplierId) return onNotify("Please select a supplier", "error");
    if (poFormItems.length === 0) return onNotify("Please add at least one product", "error");

    try {
      await api("/purchase-orders", {
        method: "POST",
        body: {
          supplier_id: Number(poFormSupplierId),
          budget: poFormBudget ? Number(poFormBudget) : null,
          items: poFormItems.map((it) => ({ product_id: it.product_id, packs: it.packs })),
        },
      });
      onNotify("Created purchase order draft", "success");
      setIsNewPoOpen(false);
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  // Edit Existing Draft
  const openEditDraftModal = (po) => {
    setSelectedPo(po);
    setPoFormSupplierId(po.supplier_id);
    setPoFormBudget(po.budget || "");
    setPoFormItems(
      po.items.map((it) => ({
        product_id: it.product_id,
        packs: it.packs,
      }))
    );
    setIsEditDraftOpen(true);
  };

  const handleUpdateDraft = async () => {
    if (!selectedPo) return;
    try {
      await api(`/purchase-orders/${selectedPo.id}`, {
        method: "PUT",
        body: {
          budget: poFormBudget ? Number(poFormBudget) : null,
          items: poFormItems.map((it) => ({ product_id: it.product_id, packs: it.packs })),
        },
      });
      onNotify(`Updated draft PO #${selectedPo.id}`, "success");
      setIsEditDraftOpen(false);
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  // Workflow Actions
  const handleSubmitPo = async (poId) => {
    try {
      await api(`/purchase-orders/${poId}/submit`, { method: "POST" });
      onNotify(`Submitted PO #${poId} for owner approval`, "success");
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  const handleApprovePo = async (poId) => {
    try {
      await api(`/purchase-orders/${poId}/approve`, { method: "POST" });
      onNotify(`Approved PO #${poId}`, "success");
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  const handleSendPo = async (poId) => {
    try {
      await api(`/purchase-orders/${poId}/send`, { method: "POST" });
      onNotify(`Sent PO #${poId} to supplier`, "success");
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  const openReceiveModal = (po) => {
    setSelectedPo(po);
    setIsReceivingOpen(true);
  };

  const handleConfirmReceive = async () => {
    if (!selectedPo) return;
    try {
      await api(`/purchase-orders/${selectedPo.id}/receive`, { method: "POST" });
      onNotify(`Successfully received PO #${selectedPo.id}! Stock updated.`, "success");
      setIsReceivingOpen(false);
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  // Restock Suggestions
  const openSuggestionsModal = async () => {
    try {
      const data = await api(`/restock/suggestions?budget=${budgetInput}`);
      setSuggestions(data);
      setIsSuggestionsOpen(true);
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  const handleCreateFromSuggestions = async () => {
    try {
      const created = await api(`/purchase-orders/from-suggestions?budget=${budgetInput}`, {
        method: "POST",
      });
      onNotify(`Created ${created.length} purchase order drafts from suggestions!`, "success");
      setIsSuggestionsOpen(false);
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  // Filter POs by tab
  const filteredPOs = purchaseOrders.filter((po) => {
    if (activeTab === "all") return true;
    return po.status === activeTab;
  });

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

  return (
    <div className="purchase-orders-page">
      <div className="toolbar">
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Manage purchase orders, review quantities, approve orders, and receive inventory.
          </p>
        </div>

        <div className="po-toolbar-actions">
          <button className="btn btn-secondary" onClick={openSuggestionsModal}>
            <IconClock size={16} /> Restock Suggestions
          </button>
          {canDraft && (
            <button className="btn btn-primary" onClick={openNewPoModal}>
              <IconPlus size={16} /> New Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Orders ({purchaseOrders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "draft" ? "active" : ""}`}
          onClick={() => setActiveTab("draft")}
        >
          Drafts ({purchaseOrders.filter((p) => p.status === "draft").length})
        </button>
        <button
          className={`tab-btn ${activeTab === "pending_approval" ? "active" : ""}`}
          onClick={() => setActiveTab("pending_approval")}
        >
          Pending Approval ({purchaseOrders.filter((p) => p.status === "pending_approval").length})
        </button>
        <button
          className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Approved ({purchaseOrders.filter((p) => p.status === "approved").length})
        </button>
        <button
          className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
          onClick={() => setActiveTab("sent")}
        >
          Sent ({purchaseOrders.filter((p) => p.status === "sent").length})
        </button>
        <button
          className={`tab-btn ${activeTab === "received" ? "active" : ""}`}
          onClick={() => setActiveTab("received")}
        >
          Received ({purchaseOrders.filter((p) => p.status === "received").length})
        </button>
      </div>

      {/* Orders Table */}
      <div className="card po-main-card">
        {/* Desktop / Tablet Table View */}
        <div className="table-container po-desktop-table" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Date Created</th>
                <th>Total Items</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                    No purchase orders found for this tab.
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                        #{String(po.id).padStart(4, "0")}
                      </span>
                    </td>
                    <td>{po.supplier_name}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(po.created_at)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{po.items?.length || 0} items</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <strong className="mono">{peso(po.total)}</strong>
                    </td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                        {po.created_by} <small>({po.created_by_role})</small>
                      </span>
                    </td>
                    <td>
                      <div className="po-table-actions">
                        {renderPoActions(po)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Touch-Friendly Cards View (<= 768px) */}
        <div className="po-mobile-cards">
          {filteredPOs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              No purchase orders found for this tab.
            </div>
          ) : (
            filteredPOs.map((po) => (
              <div key={po.id} className="po-card-item">
                <div className="po-card-top">
                  <div>
                    <span className="mono po-card-id">#{String(po.id).padStart(4, "0")}</span>
                    <h4 className="po-card-supplier">{po.supplier_name}</h4>
                  </div>
                  <div>{getStatusBadge(po.status)}</div>
                </div>

                <div className="po-card-details">
                  <div className="po-card-meta">
                    <span>{formatDate(po.created_at)}</span>
                    <span>•</span>
                    <span>{po.items?.length || 0} items</span>
                  </div>
                  <div className="po-card-total">
                    <strong className="mono">{peso(po.total)}</strong>
                  </div>
                </div>

                <div className="po-card-footer">
                  <span className="po-card-creator">
                    By {po.created_by} <small>({po.created_by_role})</small>
                  </span>
                  <div className="po-card-actions">
                    {renderPoActions(po)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PO Details Modal */}
      {isDetailsOpen && selectedPo && (
        <div className="modal-overlay" onClick={() => setIsDetailsOpen(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Purchase Order #{String(selectedPo.id).padStart(4, "0")}</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Supplier: {selectedPo.supplier_name} • Created: {formatDate(selectedPo.created_at)}
                </p>
              </div>
              <button className="btn-icon" onClick={() => setIsDetailsOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                    Current Status:
                  </span>{" "}
                  {getStatusBadge(selectedPo.status)}
                </div>
                <div>
                  <span style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                    Created by:
                  </span>{" "}
                  <strong>{selectedPo.created_by}</strong> ({selectedPo.created_by_role})
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Packs Ordered</th>
                      <th>Pack Size</th>
                      <th>Cost / Pack</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPo.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{it.product_name}</strong>
                        </td>
                        <td>{it.packs} packs</td>
                        <td>{it.pack_size} units/pack</td>
                        <td>{peso(it.cost_per_pack)}</td>
                        <td>
                          <strong className="mono">{peso(it.line_total)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{ textAlign: "right", fontWeight: 700 }}>
                        Grand Total:
                      </td>
                      <td>
                        <strong className="mono" style={{ fontSize: "1.05rem", color: "var(--color-primary)" }}>
                          {peso(selectedPo.total)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDetailsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New PO / Edit Draft Modal */}
      {(isNewPoOpen || isEditDraftOpen) && (
        <div className="modal-overlay" onClick={() => { setIsNewPoOpen(false); setIsEditDraftOpen(false); }}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditDraftOpen ? `Edit Draft PO #${selectedPo?.id}` : "Create Purchase Order Draft"}</h3>
              <button className="btn-icon" onClick={() => { setIsNewPoOpen(false); setIsEditDraftOpen(false); }}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier *</label>
                  <select
                    disabled={isEditDraftOpen}
                    value={poFormSupplierId}
                    onChange={(e) => handleSupplierChangeInForm(e.target.value)}
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.lead_time_days}d lead time)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Budget (Optional ₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={poFormBudget}
                    onChange={(e) => setPoFormBudget(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Order Items</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemToForm}>
                    <IconPlus size={14} /> Add Line Item
                  </button>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Pack Size</th>
                        <th>Cost/Pack</th>
                        <th>Packs to Order</th>
                        <th>Line Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {poFormItems.map((item, idx) => {
                        const prod = products.find((p) => p.id === item.product_id);
                        const lineTotal = (prod?.cost_per_pack || 0) * (item.packs || 0);
                        const availableSupplierProducts = products.filter(
                          (p) => p.supplier_id === Number(poFormSupplierId)
                        );

                        return (
                          <tr key={idx}>
                            <td>
                              <select
                                value={item.product_id}
                                onChange={(e) => handleItemProductChange(idx, e.target.value)}
                              >
                                {availableSupplierProducts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>{prod?.pack_size || 1} units</td>
                            <td>{peso(prod?.cost_per_pack || 0)}</td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                style={{ width: "80px", padding: "4px 8px" }}
                                value={item.packs}
                                onChange={(e) => handleItemPackChange(idx, e.target.value)}
                              />
                            </td>
                            <td>
                              <strong className="mono">{peso(lineTotal)}</strong>
                            </td>
                            <td>
                              {poFormItems.length > 1 && (
                                <button
                                  type="button"
                                  className="btn-icon"
                                  style={{ color: "var(--color-error)" }}
                                  onClick={() => handleRemoveItemFromForm(idx)}
                                >
                                  <IconX size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setIsNewPoOpen(false); setIsEditDraftOpen(false); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={isEditDraftOpen ? handleUpdateDraft : handleSaveDraft}
              >
                {isEditDraftOpen ? "Update Draft" : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Suggestions Modal */}
      {isSuggestionsOpen && suggestions && (
        <div className="modal-overlay" onClick={() => setIsSuggestionsOpen(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>AI Restock Assistant (@restock)</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Calculated based on 30-day velocity, lead time, and safety days
                </p>
              </div>
              <button className="btn-icon" onClick={() => setIsSuggestionsOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Budget (₱)</label>
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="5000"
                  />
                </div>
                <button className="btn btn-secondary" onClick={openSuggestionsModal}>
                  Recalculate
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Supplier</th>
                      <th>On Hand</th>
                      <th>Daily Sales</th>
                      <th>Packs</th>
                      <th>Line Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.items.map((s, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{s.product_name}</strong>
                        </td>
                        <td>{s.supplier_name}</td>
                        <td>
                          <span style={{ color: s.on_hand_units === 0 ? "var(--color-error)" : "#b45309", fontWeight: 700 }}>
                            {s.on_hand_units}
                          </span>
                        </td>
                        <td>{s.avg_daily_sales}/day</td>
                        <td>
                          <strong>{s.packs}</strong> <small>({s.packs * s.pack_size} units)</small>
                        </td>
                        <td>
                          <strong className="mono">{peso(s.line_total)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5" style={{ textAlign: "right", fontWeight: 700 }}>
                        Total Proposed Restock:
                      </td>
                      <td>
                        <strong className="mono" style={{ color: "var(--color-primary)", fontSize: "1.05rem" }}>
                          {peso(suggestions.total)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsSuggestionsOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handleCreateFromSuggestions}>
                Generate Draft POs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Receiving Modal (Section 7) */}
      {isReceivingOpen && selectedPo && (
        <div className="modal-overlay" onClick={() => setIsReceivingOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: "var(--color-success)" }}>Confirm Inventory Receiving</h3>
              <button className="btn-icon" onClick={() => setIsReceivingOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                Receiving <strong>PO #{String(selectedPo.id).padStart(4, "0")}</strong> from{" "}
                <strong>{selectedPo.supplier_name}</strong>. Stock will be added to your inventory immediately upon confirmation.
              </p>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Packs Ordered</th>
                      <th>Units Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPo.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{it.product_name}</strong>
                        </td>
                        <td>{it.packs} packs</td>
                        <td>
                          <strong style={{ color: "var(--color-success)" }}>
                            +{it.packs * it.pack_size} units
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsReceivingOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleConfirmReceive}>
                <IconCheckCircle size={16} /> Confirm Receipt & Add Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

