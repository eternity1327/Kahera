import React from "react";
import { apiCatalog } from "../fakeData.js";
import { IconX } from "./Icons.jsx";

export default function ApiCatalogModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Kahera API Specifications</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              All 22 endpoints supported with matching schemas in fakeData.js and FastAPI
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: "65vh", padding: "16px 24px" }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Who (Permissions)</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {apiCatalog.map((ep, idx) => (
                  <tr key={idx}>
                    <td>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          color:
                            ep.method.includes("POST")
                              ? "var(--color-accent)"
                              : ep.method.includes("PUT")
                              ? "var(--color-warning)"
                              : ep.method.includes("DELETE")
                              ? "var(--color-error)"
                              : "var(--color-primary)",
                        }}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: "0.82rem" }}>
                        {ep.path}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: ep.who.includes("owner") ? 600 : 400,
                          color: ep.who.includes("owner") && !ep.who.includes("cashier") ? "var(--color-primary)" : "inherit",
                        }}
                      >
                        {ep.who}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-draft" style={{ textTransform: "uppercase" }}>
                        {ep.entity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

