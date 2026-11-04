import React from "react";
import {
  IconDashboard,
  IconPackage,
  IconShoppingCart,
  IconFileText,
  IconBarChart,
  IconSettings,
  IconSun,
  IconMoon,
  IconLogOut,
} from "./Icons.jsx";
import { getActiveRole, getActiveUsername } from "../api.js";

export default function Sidebar({
  currentPage,
  onNavigate,
  theme,
  onToggleTheme,
  onLogout,
  lowStockCount = 0,
  pendingPoCount = 0,
}) {
  const role = getActiveRole();
  const username = getActiveUsername();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: IconDashboard },
    {
      id: "products",
      label: "Products",
      icon: IconPackage,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: "badge-danger",
    },
    {
      id: "purchase-orders",
      label: "Purchase Orders",
      icon: IconFileText,
      badge: pendingPoCount > 0 ? pendingPoCount : null,
      badgeColor: "badge-submitted",
    },
    { id: "pos", label: "Point of Sale", icon: IconShoppingCart },
    { id: "reports", label: "Reports", icon: IconBarChart },
    { id: "settings", label: "Settings", icon: IconSettings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">K</div>
        <div className="brand-text">
          <h1>Kahera</h1>
          <p>Inventory & Restock</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              <span className="nav-label">{item.label}</span>
              {item.badge && (
                <span className={`badge ${item.badgeColor} nav-badge`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{username.slice(0, 2).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{username}</div>
            <span className="user-role-badge">{role}</span>
          </div>
          <button
            type="button"
            className="btn-icon theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm sign-out-btn"
          onClick={onLogout}
        >
          <IconLogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
