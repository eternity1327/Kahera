import React from "react";
import { getActiveRole, getActiveUsername } from "../api.js";

export default function Header({ title, subtitle = "Connected to Kahera API", actions }) {
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
        <div className="role-pill-group" title="Sign out and log in as another user to switch roles">
          <span className="role-pill-btn active">
            {getActiveUsername()} · {getActiveRole()}
          </span>
        </div>
        {actions}
      </div>
    </header>
  );
}
