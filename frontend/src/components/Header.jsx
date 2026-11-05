import React from "react";
import { getActiveRole, getActiveUsername } from "../api.js";
import { IconSun, IconMoon, IconLogOut } from "./Icons.jsx";

export default function Header({
  title,
  subtitle = "Connected to Kahera API",
  actions,
  theme,
  onToggleTheme,
  onLogout,
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-brand-mobile">
          <div className="brand-icon mobile-mini-icon">K</div>
        </div>
        <div className="header-title-group">
          <h2>{title}</h2>
          <div className="header-subtitle">
            <span className="status-dot"></span>
            <span>{subtitle}</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="role-pill-group" title="Signed in user & role">
          <span className="role-pill-btn active">
            <span className="user-role-label">
              {getActiveUsername()} · {getActiveRole()}
            </span>
          </span>
        </div>

        {onToggleTheme && (
          <button
            type="button"
            className="btn-icon header-mobile-action"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
        )}

        {onLogout && (
          <button
            type="button"
            className="btn-icon header-mobile-action"
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <IconLogOut size={16} />
          </button>
        )}

        {actions}
      </div>
    </header>
  );
}
