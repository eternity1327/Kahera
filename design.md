# AI DEVELOPMENT PROMPT — KAHERA INVENTORY MANAGEMENT SYSTEM

## Project Overview

Build a modern, professional, responsive Inventory Management and Purchase Order System called **Kahera**.

The application is designed for small businesses and retail stores to manage inventory, monitor low-stock products, generate purchase orders, and streamline the purchasing workflow.

Follow the provided UI/UX reference design as closely as possible. Use the same visual hierarchy, layout, colors, typography, spacing, cards, navigation, tables, badges, and overall design language.

The goal is to create a fully functional application, not just a static UI prototype.

## 1. UI/UX Design Requirements

### Design Style

- Modern professional SaaS dashboard.
- Clean and minimal interface.
- Enterprise-style inventory management system.
- Consistent spacing and alignment.
- Responsive layout for desktop, tablet, and mobile.
- Light mode and dark mode.
- Clear visual hierarchy.
- Accessible color contrast.
- Smooth transitions and subtle animations.

### Color Theme

Use these exact theme colors:

**Light Mode**

- Primary: `#005A9C`
- Secondary: `#53565A`
- Accent: `#E87722`
- Background: `#F8F9FA`
- Surface: `#FFFFFF`
- Error: `#B3261E`
- Success: `#2D7D46`
- Warning: `#F5A623`
- Divider: `#DEE2E6`

**Dark Mode**

- Primary: `#D0E4FF`
- Background: `#1A1C1E`
- Secondary Background: `#111318`
- Surface: `#1A1C1E`
- Accent: `#FFB4A2`
- Error: `#F2B8B5`
- Success: `#81C784`
- Warning: `#FFD54F`

### Typography

- Primary font: Inter
- Secondary font: Inter
- Monospace font: JetBrains Mono

### Border Radius

- Small: 4px
- Medium: 8px
- Large: 12px
- Extra Large: 16px

## 2. Main Application Layout

Create a persistent sidebar navigation on desktop.

Sidebar menu:

- Dashboard
- Products
- Purchase Orders
- Reports
- Settings

The sidebar should:

- Have a Kahera logo and brand name.
- Highlight the currently active page.
- Use clean icons.
- Have consistent padding and spacing.
- Support responsive behavior on smaller screens.

The main content area should have:

- Page title.
- Page description.
- Action buttons.
- Content cards.
- Tables.
- Filters and search controls.
- Proper loading and empty states.

## 3. Dashboard Page

Create an inventory dashboard that provides a complete overview of store operations.

### Header

Title: Inventory Dashboard

Subtitle:
System Status: Operational · Last Sync

Primary action:
New Purchase Order

### Summary Cards

Display the following cards:

1. Total Stock Value

   - Total inventory valuation.
   - Percentage change from last month.

2. Low Stock Alerts

   - Number of products with low inventory.
   - Red text for critical alerts.

3. Pending Orders

   - Number of purchase orders awaiting approval.
   - Display how many are pending owner approval.

### Critical Alerts

Display low-stock products with:

- Product name.
- Current stock.
- Safety days.
- SKU.
- Red alert styling.

### Recent Purchase Orders

Display a table or list containing:

- Purchase Order Number.
- Supplier.
- Date.
- Status.
- Action.

Use status badges:

- Draft: Neutral gray.
- Submitted: Warning orange.
- Approved: Blue.
- Received: Green.

### Inventory Health

Create a donut chart showing:

- Healthy Stock.
- Low Stock.
- Out of Stock.

Display:

- Inventory health percentage.
- Average safety days coverage.

## 4. Products / Inventory Page

Create a professional product inventory management interface.

### Header

Title: Product Inventory

Actions:

- Export CSV
- Add Product

### Search and Filters

Include:

- Search by product name.
- Search by SKU.
- Search by category.
- Filter by stock status.
- Filter by category.

### Product Table

Columns:

- Product Name
- SKU
- Category
- Supplier
- Stock Quantity
- Unit
- Cost Price
- Selling Price
- Stock Status
- Actions

### Low Stock UI/UX

IMPORTANT:

When a product has `low_stock = true` from the API:

- Highlight the entire product row using a subtle red background.
- Add a red border or red accent.
- Display a red "Low" badge beside the product status.
- Ensure the low-stock status is visually obvious.
- Avoid excessive red that reduces readability.

When stock is normal:

- Use a neutral row background.
- Display a green "Healthy" badge.

When stock is zero:

- Display an "Out of Stock" badge.
- Use a stronger red visual indicator.

### Product Actions

Each product should have:

- View
- Edit
- Archive/Delete

### Add Product Modal

Create a clean form with:

- Product Name
- SKU
- Barcode
- Category
- Supplier
- Stock Quantity
- Unit of Measure
- Pack Size
- Cost per Pack
- Selling Price
- Safety Days

Use proper validation and error messages.

### Edit Product Modal

Reuse the same Add Product form.

When clicking Edit:

- Load the selected product's existing data.
- Populate all form fields.
- Allow the user to modify the product.
- Save changes using the API.

API:
`PUT /products/{id}`

## 5. Purchase Orders Page

Create a dedicated Purchase Orders page.

Title:
Purchase Orders

Description:
Manage purchase orders, review quantities, approve orders, and receive inventory.

### Purchase Order Table

Columns:

- PO Number
- Supplier
- Created Date
- Total Items
- Total Cost
- Status
- Created By
- Actions

### Status Badges

- Draft — Gray
- Submitted — Orange
- Pending Approval — Yellow
- Approved — Blue
- Received — Green
- Rejected — Red

### Purchase Order Details

When a user opens a purchase order, display:

- Purchase Order Number.
- Supplier details.
- Created date.
- Order status.
- Product list.
- Quantity.
- Unit cost.
- Total cost.
- Notes.

### Draft Purchase Order Editing

Users should be able to:

- Edit draft quantities.
- Add products.
- Remove products.
- Change suppliers.
- Update notes.
- Recalculate totals automatically.

Only draft purchase orders can be freely edited.

### Purchase Order Actions

Draft:

- Edit
- Submit

Submitted:

- View
- Approve (Owner only)
- Reject (Owner only)

Approved:

- View
- Receive Stock

Received:

- View Details

## 6. Purchase Order Approval Workflow

Implement the following workflow:

DRAFT → SUBMITTED → APPROVED → RECEIVED

### Draft

- Cashier can create a draft purchase order.
- Cashier can modify product quantities.
- Cashier can submit the purchase order.

### Submitted

- The purchase order becomes pending approval.
- Owner receives an approval notification.
- Cashier cannot approve the purchase order.

### Approved

- Only the Owner can approve.
- Owner can approve or reject the purchase order.
- Once approved, the order becomes ready for receiving.

### Received

- Cashier or authorized staff can receive the approved purchase order.
- Display a receiving confirmation modal.
- Allow received quantity confirmation.
- Update inventory quantities only after receiving is confirmed.
- Prevent duplicate receiving.
- Record receiving history.

## 7. Inventory Receiving

When the user clicks Receive:

Display a receiving modal with:

- PO Number.
- Supplier.
- Product.
- Ordered Quantity.
- Received Quantity.
- Unit Cost.
- Total Cost.

Allow the user to confirm the received quantities.

Upon confirmation:

- Increase product inventory.
- Update inventory valuation.
- Change PO status to Received.
- Record the receiving date.
- Record the receiving user.
- Create an inventory movement record.

Do not increase stock upon draft creation, submission, or approval.

## 8. Reports Page

Create a professional reports dashboard.

Include:

- Inventory valuation report.
- Low-stock report.
- Out-of-stock report.
- Purchase order report.
- Stock movement report.

Features:

- Date range filter.
- Product filter.
- Supplier filter.
- Export CSV.
- Summary cards.
- Charts and tables.

## 9. System Settings Page

Create a settings page with:

- Store information.
- User account settings.
- Role management.
- Inventory configuration.
- Low-stock settings.
- Theme settings.
- Notification settings.

## 10. Authentication and Role Permissions

Implement authentication with two roles:

### Cashier

Can:

- View dashboard.
- View products.
- Add products.
- Edit products.
- Create purchase orders.
- Edit draft purchase orders.
- Submit purchase orders.
- Receive approved purchase orders.

Cannot:

- Approve purchase orders.
- Reject purchase orders.
- Override owner permissions.

### Owner

Can:

- Access all cashier features.
- Approve purchase orders.
- Reject purchase orders.
- View all reports.
- Manage system settings.
- Manage users.

IMPORTANT:
Role restrictions must be enforced in the backend, not only hidden in the frontend.

## 11. Technical Requirements

Use the existing project stack and architecture.

If no stack has been established, use:

- Frontend: React.js + Vite
- Styling: Tailwind CSS
- Icons: Lucide React
- Backend: Python FastAPI
- Database: mysql
- API: REST API

### API Integration

Use real API data.

Products:

- GET `/products`
- POST `/products`
- PUT `/products/{id}`
- DELETE `/products/{id}`

Purchase Orders:

- GET `/purchase-orders`
- POST `/purchase-orders`
- PUT `/purchase-orders/{id}`
- POST `/purchase-orders/{id}/submit`
- POST `/purchase-orders/{id}/approve`
- POST `/purchase-orders/{id}/reject`
- POST `/purchase-orders/{id}/receive`

Adapt endpoint names to the existing backend if necessary.

## 12. Functional UI Requirements

Every button must work.

Implement:

- Search.
- Filters.
- Pagination.
- Add Product modal.
- Edit Product modal.
- Delete/archive confirmation.
- CSV export.
- Purchase Order creation.
- Purchase Order editing.
- Submit.
- Owner approval.
- Owner rejection.
- Inventory receiving.
- Notifications.
- Loading states.
- Error states.
- Empty states.
- Success toast notifications.

Avoid dead buttons or placeholder interactions.

## 13. Responsive Design

Desktop:

- Persistent sidebar.
- Wide inventory tables.
- Multi-column dashboard cards.

Tablet:

- Collapsible sidebar.
- Adaptive card layout.
- Horizontal scrolling tables where necessary.

Mobile:

- Collapsible navigation drawer.
- Responsive cards.
- Touch-friendly buttons.
- Proper modal sizing.
- Mobile-friendly tables or card-based layouts.

## 14. Final Development Instructions

Before coding:

1. Analyze the existing project structure.
2. Review the provided UI/UX reference design.
3. Identify the existing API endpoints.
4. Check existing authentication and role management.
5. Reuse existing components and services.
6. Avoid unnecessary architectural changes.

While coding:

- Follow the UI/UX reference design faithfully.
- Keep components modular and reusable.
- Use clean and maintainable code.
- Avoid duplicated logic.
- Ensure proper API integration.
- Do not replace real backend logic with mock data.
- Do not break existing functionality.
- Use realistic loading and error handling.
- Ensure all user permissions are respected.

Final Goal:

Deliver a complete, responsive, production-ready StockFlow Pro inventory management system with a modern SaaS UI, accurate low-stock highlighting, editable products, purchase order management, owner-only approval, and reliable inventory receiving.

The result must look and behave like the provided UI/UX design reference.
