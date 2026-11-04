import React from "react";
import { getActiveRole, setActiveRole, setActiveUsername } from "../api.js";

export default function Header({
  title,
  subtitle = "System Status: Operational · Last Sync Just now",
  actions,
  onRoleChange,
}) {
  const currentRole = getActiveRole();

  const handleRoleClick = (role) => {
    setActiveRole(role);
    setActiveUsername(role === "agent" ? "restock" : role);
    if (onRoleChange) onRoleChange(role);
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-title-group">
          <h2>{title}</h2>
          <div className="header-subtitle">
            <span className="status-dot"></span>
            <span>{subtitle}</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Role simulator pills */}
        <div className="role-pill-group" title="Switch active role to test permissions">
          <button
            type="button"
            className={`role-pill-btn ${currentRole === "owner" ? "active" : ""}`}
            onClick={() => handleRoleClick("owner")}
          >
            Owner
          </button>
          <button
            type="button"
            className={`role-pill-btn ${currentRole === "cashier" ? "active" : ""}`}
            onClick={() => handleRoleClick("cashier")}
          >
            Cashier
          </button>
          <button
            type="button"
            className={`role-pill-btn ${currentRole === "agent" ? "active" : ""}`}
            onClick={() => handleRoleClick("agent")}
          >
            Agent
          </button>
        </div>

        {actions}
      </div>
    </header>
  );
}
