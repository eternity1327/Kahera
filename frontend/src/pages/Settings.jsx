import React, { useState, useEffect } from "react";
import { api, formatDate, getActiveRole } from "../api.js";
import { IconShield, IconPlus, IconX } from "../components/Icons.jsx";

export default function Settings({ onNotify, theme, onToggleTheme }) {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("cashier");

  const currentRole = getActiveRole();
  const isOwner = currentRole === "owner";

  const loadData = async () => {
    try {
      const [uList, aLogs] = await Promise.all([
        api("/auth/users").catch(() => []),
        api("/audit-log").catch(() => []),
      ]);
      setUsers(uList || []);
      setAuditLogs(aLogs || []);
    } catch (err) {
      console.warn("Could not load users or logs:", err);
    }
  };

  useEffect(() => {
    if (isOwner) loadData();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await api("/auth/users", {
        method: "POST",
        body: { username: newUsername, password: newPassword, role: newRole },
      });
      onNotify(`Added staff user "${newUsername}" as ${newRole}`, "success");
      setIsAddUserOpen(false);
      setNewUsername("");
      setNewPassword("");
      loadData();
    } catch (err) {
      onNotify(err.message, "error");
    }
  };

  return (
    <div className="settings-page" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Store Profile & Settings</h3>
            <p className="card-subtitle">Retail store details and restock parameters</p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Store Name</label>
            <input defaultValue="Kahera Sari-Sari Store" readOnly />
          </div>
          <div className="form-group">
            <label>Currency</label>
            <input defaultValue="PHP (₱) Philippine Peso" readOnly />
          </div>
          <div className="form-group">
            <label>Default Safety Days</label>
            <input defaultValue="2 days" readOnly />
          </div>
          <div className="form-group">
            <label>Restock Cover Horizon</label>
            <input defaultValue="7 days" readOnly />
          </div>
        </div>
      </div>

      {isOwner && (
        <>
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconShield size={18} /> User Accounts & Role Permissions
            </h3>
            <p className="card-subtitle">
              Manage staff accounts (Owner, Cashier, Agent)
            </p>
          </div>
          {isOwner && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddUserOpen(true)}>
              <IconPlus size={14} /> Add Staff Account
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Permissions Summary</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td>
                    <strong>{u.username}</strong>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.role === "owner"
                          ? "badge-approved"
                          : u.role === "cashier"
                          ? "badge-submitted"
                          : "badge-draft"
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                    {u.role === "owner" && "Full administrative control, PO approvals, user management, audit logs"}
                    {u.role === "cashier" && "Record sales, add/edit products, create & submit draft POs, receive inventory"}
                    {u.role === "agent" && "Read stock & velocity, draft purchase orders within budget (no approvals)"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log (GET /audit-log) */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">System Audit Log</h3>
            <p className="card-subtitle">Immutable event history of product edits, sales, and purchase orders</p>
          </div>
        </div>

        <div className="table-container" style={{ maxHeight: "320px", overflowY: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)" }}>
                    No audit records yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: "0.78rem" }}>{formatDate(log.created_at)}</td>
                    <td>
                      <strong>{log.username}</strong>
                    </td>
                    <td>
                      <span className="badge badge-draft">{log.action}</span>
                    </td>
                    <td>{log.entity}</td>
                    <td className="mono">#{log.entity_id}</td>
                    <td>{log.detail || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Add Staff Modal */}
      {isAddUserOpen && (
        <div className="modal-overlay" onClick={() => setIsAddUserOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Staff Account</h3>
              <button className="btn-icon" onClick={() => setIsAddUserOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. cashier2"
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    <option value="cashier">Cashier (POS sales, draft POs, receiving)</option>
                    <option value="agent">Agent (Automated @restock AI assistant)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

