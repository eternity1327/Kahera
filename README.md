# Kahera

POS and restock assistant for small neighborhood stores (sari-sari stores in the Philippines). Cashiers sell from the web app; an AI agent called **@restock** watches stock in a Telegram group, drafts purchase orders within the owner's budget, and the owner approves them with one tap.

**Demo video:** https://youtu.be/QEV_pvquwXI

Built for the WeMakeDevs **Flip the Switch** hackathon, Track 01 Business Workflow, by Gerard (backend + Switch) and Joemar (UI + demo).

- Backend: FastAPI, MySQL, JWT auth with roles
- Frontend: React + Vite
- Agent: Claude Code running in Switch, talking in a Telegram group

## How it works

1. Cashiers record sales in the POS.
2. Kahera computes each item's **reorder point** = average daily sales (last 30 days) × supplier lead time + safety stock (average daily sales × safety days).
3. Items at or below their reorder point are marked `low_stock`.
4. `GET /restock/suggestions?budget=` orders enough to cover the reorder point plus 7 days, rounded **up to whole cases**, most urgent first, and never over the budget.
5. @restock posts the plan in Telegram and drafts purchase orders.
6. Purchase orders move `draft → pending_approval → approved → sent → received`. Receiving adds `packs × pack_size` to stock. Every step is written to the audit log.

## Roles

| Role | Can |
| --- | --- |
| owner | Everything, including **approve**, send, manage staff, view audit log |
| cashier | Sell, edit products, edit and submit drafts, receive stock |
| agent | Read stock, sales and orders; **create and edit drafts only** |

The first account registered becomes the owner. After that, the owner adds staff with `POST /auth/users`.

## How Switch is used

[Switch](https://github.com/sandbox-quantum/switch) connects coding agents to team chat. Kahera uses it to put an agent where the store owner already is: Telegram.

- **Switch Console 0.40.1** runs a local Switch server on Gerard's laptop (no Docker needed).
- **Agent:** `@restock`, a Claude Code agent registered in Switch. It calls the Kahera API with an `agent`-role token.
- **Channel:** a Telegram group, "kahera restock", connected through a Telegram bot.
- **Room instructions:** in [`switch/restock-agent.md`](switch/restock-agent.md). Three rules: use live API data, one thread per order, never approve.

The agent role is enforced by the API, not just the prompt: even if asked, an agent token gets `403` on approve, send, receive and sales.

### Channel setup

1. Telegram: message @BotFather, `/newbot`, copy the token. Then `/mybots` → bot → Bot Settings → Group Privacy → **Turn off**.
2. Switch Console: Home → Messaging apps → **Connect** → Telegram → paste token and bot username.
3. Telegram: create a group, add the bot, send a message. The room appears under Your Rooms.
4. Switch: Home → **Link account** so the agent knows who you are.

### Agent setup

1. Sign in to Claude Code once on the laptop that runs Switch: run `claude` in a terminal.
2. Switch Console → **Your Agents** → the card with a plus.
3. Name `restock`, a short description, run location **This computer**, directory `switch` in this repo, provider **Claude Code**.
4. Paste the rules from [`switch/restock-agent.md`](switch/restock-agent.md) into **Agent instructions**.
5. **Add agent**, then invite it into the Telegram room.
6. In the room's settings, under **General**, set the room Instructions to the three rules: use live API data, one thread per order, never approve.

Switch passes agents only a fixed set of environment variables, so the agent gets its API address and login from [`switch/CLAUDE.md`](switch/CLAUDE.md) in its working folder.

### Stock alerts

Kahera posts to the Telegram room by itself, through the same bot Switch uses:

- **After a sale** that drops an item to its reorder point: "⚠️ Paubos na: …"
- **Every morning**: a list of everything that is low, from `python alerts.py`, run by Windows Task Scheduler (or cron) at 8:00

Each alert ends with a ready reply for the owner, `@restock ano kulang? budget 3000`, so drafting the orders is one tap. Sending a message does not interfere with Switch, which only reads the bot's updates.

Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` and `RESTOCK_BUDGET` in `backend/.env`, then check with `python alerts.py test`.

## Run it

### Prerequisites

- Python 3.12+
- Node.js 20+
- MySQL 8. No MySQL yet? Start one with Docker:

```bash
docker run -d --name kahera-mysql -e MYSQL_ROOT_PASSWORD=kahera -e MYSQL_DATABASE=kahera -p 3306:3306 mysql:8
```

Then use `DATABASE_URL=mysql+pymysql://root:kahera@localhost:3306/kahera` in `backend/.env` and skip the `CREATE DATABASE` step.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # set DATABASE_URL and a long random SECRET_KEY
```

Create the database, then seed it:

```sql
CREATE DATABASE kahera;
```

```bash
python seed.py 45             # wipes tables, adds 45 days of sales
uvicorn main:app --reload
```

Seed logins (password `kahera123`, change with `SEED_PASSWORD`): `owner`, `cashier`, `restock` (agent). API docs: http://localhost:8000/docs

The seed **drops and recreates all tables**. Run it once at setup, not on real data.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 and log in as `owner` or `cashier`.

## API

| Method | Path | Who |
| --- | --- | --- |
| POST | /auth/register | First user only (becomes owner) |
| POST | /auth/login | All |
| GET | /auth/me | All |
| GET, POST | /auth/users | owner |
| GET | /suppliers | All |
| POST, PUT | /suppliers, /suppliers/{id} | owner |
| GET | /products?low_only=true | All |
| POST, PUT | /products, /products/{id} | owner, cashier |
| DELETE | /products/{id} | owner |
| GET | /sales | All |
| POST | /sales | owner, cashier |
| GET | /restock/suggestions?budget= | All |
| GET | /purchase-orders?status= | All |
| GET | /purchase-orders/{id} | All |
| POST | /purchase-orders | owner, cashier, agent |
| POST | /purchase-orders/from-suggestions?budget= | owner, cashier, agent |
| PUT | /purchase-orders/{id} (drafts only) | owner, cashier, agent |
| POST | /purchase-orders/{id}/submit | owner, cashier |
| POST | /purchase-orders/{id}/approve | **owner** |
| POST | /purchase-orders/{id}/send | owner |
| POST | /purchase-orders/{id}/receive | owner, cashier |
| GET | /audit-log | owner |

## What existed before Nov 4

Tagged `pre-hackathon` (commit `138e50d`), when the project was called TindaMate:

- FastAPI backend with JWT login, products CRUD, and sales checkout that deducts stock
- React frontend with login, products page and POS

Everything else was built during the hackathon window (Nov 4, 2:31 AM to Nov 8, 2:29 AM Manila time): roles, suppliers, restock suggestions, purchase orders and approval flow, audit log, seed data, the Switch + Telegram @restock agent, and the Kahera UI updates. Compare with `git diff pre-hackathon`.
