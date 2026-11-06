import React, { useState, useEffect } from "react";
import { getToken, clearToken, api } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import ApiCatalogModal from "./components/ApiCatalogModal.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import PurchaseOrders from "./pages/PurchaseOrders.jsx";
import Pos from "./pages/Pos.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./Login.jsx";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()));
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [theme, setTheme] = useState(localStorage.getItem("kahera_theme") || "light");
  const [toasts, setToasts] = useState([]);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [counts, setCounts] = useState({ lowStock: 0, pendingPo: 0 });
  const [prefilledRestockProduct, setPrefilledRestockProduct] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("kahera_theme", theme);
  }, [theme]);

  const refreshCounts = async () => {
    try {
      const [products, pos] = await Promise.all([
        api("/products"),
        api("/purchase-orders"),
      ]);
      const lowStock = (products || []).filter((p) => p.low_stock).length;
      const pendingPo = (pos || []).filter((po) => po.status === "pending_approval").length;
      setCounts({ lowStock, pendingPo });
    } catch {
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      refreshCounts();
    }
  }, [isLoggedIn, currentPage]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
  };

  const addToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenNewPoFromDashboard = (product) => {
    setPrefilledRestockProduct(product);
    setCurrentPage("purchase-orders");
  };

  const handleNavigate = (page) => {
    if (page !== "purchase-orders") setPrefilledRestockProduct(null);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case "dashboard":
        return "Inventory Dashboard";
      case "products":
        return "Product Inventory";
      case "purchase-orders":
        return "Purchase Orders";
      case "pos":
        return "Point of Sale (POS)";
      case "reports":
        return "Reports & Analytics";
      case "settings":
        return "System Settings";
      default:
        return "Kahera";
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        lowStockCount={counts.lowStock}
        pendingPoCount={counts.pendingPo}
      />

      <div className="main-wrapper">
        <Header
          title={getPageTitle()}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
        />

        <main className="main-content">
          {currentPage === "dashboard" && (
            <Dashboard
              onNavigate={(page) => handleNavigate(page)}
              onOpenNewPo={handleOpenNewPoFromDashboard}
            />
          )}

          {currentPage === "products" && <Products onNotify={addToast} />}

          {currentPage === "purchase-orders" && (
            <PurchaseOrders
              onNotify={addToast}
              initialRestockProduct={prefilledRestockProduct}
            />
          )}

          {currentPage === "pos" && <Pos onNotify={addToast} />}

          {currentPage === "reports" && <Reports onNotify={addToast} />}

          {currentPage === "settings" && (
            <Settings onNotify={addToast} theme={theme} onToggleTheme={toggleTheme} />
          )}
        </main>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />

      <ApiCatalogModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
}
