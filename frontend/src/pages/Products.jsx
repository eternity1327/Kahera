import React, { useState, useEffect } from "react";
import { api, peso, getActiveRole } from "../api.js";
import {
  IconSearch,
  IconPlus,
  IconDownload,
  IconEdit,
  IconTrash,
  IconX,
} from "../components/Icons.jsx";

const initialForm = {
  name: "",
  barcode: "",
  price: "",
  on_hand_units: 0,
  pack_size: 1,
  cost_per_pack: 0,
  safety_days: 2,
  supplier_id: "",
};

export default function Products({ onNotify }) {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'low' | 'out' | 'healthy'
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const role = getActiveRole();
  const canEdit = role === "owner" || role === "cashier";
  const canDelete = role === "owner";

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, sups] = await Promise.all([
        api("/products"),
        api("/suppliers"),
      ]);
      setProducts(prods || []);
      setSuppliers(sups || []);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setFormData({
      name: product.name,
      barcode: product.barcode || "",
      price: product.price,
      on_hand_units: product.on_hand_units,
      pack_size: product.pack_size,
      cost_per_pack: product.cost_per_pack,
      safety_days: product.safety_days,
      supplier_id: product.supplier_id || "",
    });
    setIsEditing(true);
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        barcode: formData.barcode || null,
        price: Number(formData.price),
        on_hand_units: Number(formData.on_hand_units),
        pack_size: Number(formData.pack_size),
        cost_per_pack: Number(formData.cost_per_pack),
        safety_days: Number(formData.safety_days),
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
      };

      if (isEditing) {
        await api(`/products/${editingId}`, { method: "PUT", body: payload });
        onNotify(`Updated product "${payload.name}" successfully`, "success");
      } else {
        await api("/products", { method: "POST", body: payload });
        onNotify(`Created product "${payload.name}" successfully`, "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api(`/products/${id}`, { method: "DELETE" });
      onNotify("Product deleted successfully", "success");
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Barcode/SKU",
      "Supplier",
      "Stock (Units)",
      "Pack Size",
      "Cost/Pack",
      "Price",
      "Safety Days",
      "Avg Daily Sales",
      "Reorder Point",
      "Low Stock",
    ];

    const rows = filteredProducts.map((p) => {
      const sup = suppliers.find((s) => s.id === p.supplier_id)?.name || "Unassigned";
      return [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.barcode || ""}"`,
        `"${sup}"`,
        p.on_hand_units,
        p.pack_size,
        p.cost_per_pack,
        p.price,
        p.safety_days,
        p.avg_daily_sales,
        p.reorder_point,
        p.low_stock ? "YES" : "NO",
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kahera-products-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify("Exported products catalog to CSV", "success");
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));

    const matchesSupplier =
      supplierFilter === "all" || String(p.supplier_id) === String(supplierFilter);

    let matchesStatus = true;
    if (statusFilter === "low") matchesStatus = p.low_stock && p.on_hand_units > 0;
    if (statusFilter === "out") matchesStatus = p.on_hand_units === 0;
    if (statusFilter === "healthy") matchesStatus = !p.low_stock && p.on_hand_units > 0;

    return matchesSearch && matchesSupplier && matchesStatus;
  });

  return (
    <div className="products-page">
      {/* Action Toolbar */}
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1 }}>
          <div className="search-box">
            <span className="search-icon">
              <IconSearch size={16} />
            </span>
            <input
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Stock Statuses</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock</option>
            <option value="healthy">Healthy Stock</option>
          </select>

          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
            <option value="all">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <IconDownload size={16} /> Export CSV
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={openAddModal}>
              <IconPlus size={16} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Product Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU / Barcode</th>
                <th>Supplier</th>
                <th>Stock Units</th>
                <th>Pack Size</th>
                <th>Cost / Pack</th>
                <th>Retail Price</th>
                <th>Safety</th>
                <th>Reorder Pt</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const supName = suppliers.find((s) => s.id === p.supplier_id)?.name || "Unassigned";
                  const isOutOfStock = p.on_hand_units === 0;
                  const isLow = p.low_stock && !isOutOfStock;

                  const rowClass = isOutOfStock ? "row-out-of-stock" : isLow ? "row-low-stock" : "";

                  return (
                    <tr key={p.id} className={rowClass}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: "0.78rem" }}>
                          {p.barcode || "-"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                          {supName}
                        </span>
                      </td>
                      <td>
                        <strong
                          className="mono"
                          style={{
                            color: isOutOfStock ? "var(--color-error)" : isLow ? "#b45309" : "inherit",
                          }}
                        >
                          {p.on_hand_units}
                        </strong>
                      </td>
                      <td>{p.pack_size} pcs</td>
                      <td>
                        <span className="mono">{peso(p.cost_per_pack)}</span>
                      </td>
                      <td>
                        <strong className="mono">{peso(p.price)}</strong>
                      </td>
                      <td>{p.safety_days}d</td>
                      <td>
                        <span className="mono">{p.reorder_point}</span>
                      </td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-submitted">Low Stock</span>
                        ) : (
                          <span className="badge badge-healthy">Healthy</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {canEdit && (
                            <button
                              className="btn-icon"
                              onClick={() => openEditModal(p)}
                              title="Edit product"
                            >
                              <IconEdit size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn-icon"
                              style={{ color: "var(--color-error)" }}
                              onClick={() => setDeleteConfirmId(p.id)}
                              title="Delete product"
                            >
                              <IconTrash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? "Edit Product" : "Add New Product"}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pancit Canton (Kalamansi)"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Barcode / SKU</label>
                    <input
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="e.g. 4800000000011"
                    />
                  </div>
                  <div className="form-group">
                    <label>Supplier</label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    >
                      <option value="">Select a supplier...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.lead_time_days}d lead time)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Selling Price (₱) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="15.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock on Hand (Units) *</label>
                    <input
                      type="number"
                      required
                      value={formData.on_hand_units}
                      onChange={(e) => setFormData({ ...formData, on_hand_units: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pack Size (units/case) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.pack_size}
                      onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                      placeholder="24"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost per Pack (₱) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.cost_per_pack}
                      onChange={(e) => setFormData({ ...formData, cost_per_pack: e.target.value })}
                      placeholder="360.00"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Safety Stock Days</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.safety_days}
                    onChange={(e) => setFormData({ ...formData, safety_days: e.target.value })}
                    placeholder="2"
                  />
                  <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                    Used along with supplier lead time to compute automated reorder points.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: "var(--color-error)" }}>Confirm Delete</h3>
              <button className="btn-icon" onClick={() => setDeleteConfirmId(null)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirmId)}>
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

