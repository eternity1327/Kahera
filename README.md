# Kahera

POS and inventory app for small stores.

- Backend: FastAPI, MySQL, JWT auth
- Frontend: React + Vite

## Backend

1. Create the database in MySQL:

   ```sql
   CREATE DATABASE tindamate;
   ```

2. Set up and run:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate        # Windows
   source .venv/bin/activate     # macOS/Linux
   pip install -r requirements.txt
   cp .env.example .env          # then edit DATABASE_URL and SECRET_KEY
   uvicorn main:app --reload
   ```

Tables are created automatically on startup. API docs: http://localhost:8000/docs

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173, register an account, add products, then use the POS tab.

## API

| Method | Path | Description |
| --- | --- | --- |
| POST | /auth/register | Create account |
| POST | /auth/login | Get JWT (form data: username, password) |
| GET | /auth/me | Current user |
| GET | /products | List products |
| GET | /products/barcode/{barcode} | Find product by barcode |
| POST | /products | Add product |
| PUT | /products/{id} | Update product |
| DELETE | /products/{id} | Delete product |
| GET | /sales | List sales |
| POST | /sales | Checkout cart, deducts stock |

All routes except register and login need `Authorization: Bearer <token>`.
