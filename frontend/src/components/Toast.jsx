import React from "react";
import { IconCheckCircle, IconAlertTriangle } from "./Icons.jsx";

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}
          onClick={() => onDismiss(toast.id)}
        >
          {toast.type === "error" ? (
            <IconAlertTriangle size={18} style={{ color: "var(--color-error)" }} />
          ) : (
            <IconCheckCircle size={18} style={{ color: "var(--color-success)" }} />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

