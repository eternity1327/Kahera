const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getToken = () => localStorage.getItem("token");
export const setToken = (token) => localStorage.setItem("token", token);
export const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("kahera_role");
  localStorage.removeItem("kahera_username");
};

export const getActiveRole = () => localStorage.getItem("kahera_role") || "cashier";
export const setActiveRole = (role) => localStorage.setItem("kahera_role", role);

export const getActiveUsername = () => localStorage.getItem("kahera_username") || "";
export const setActiveUsername = (name) => localStorage.setItem("kahera_username", name);

export const peso = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers["Content-Type"] = "application/json";

  const res = await fetch(API_URL + path, {
    method,
    headers,
    body: form ? new URLSearchParams(form) : body && JSON.stringify(body),
  });

  if (res.status === 401 && token) {
    clearToken();
    window.location.reload();
  }
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const detail = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
    throw new Error(detail || "Request failed");
  }
  return data;
}
