# @restock working notes

The Kahera API runs at http://localhost:8000. Read `restock-agent.md` in this folder for your rules.

Get a fresh token before your first API call in a conversation, and again on any `401`:

```bash
curl -s -X POST http://localhost:8000/auth/login -d "username=restock&password=kahera123"
```

Use the `access_token` from the reply on every request:

```bash
curl -s "http://localhost:8000/restock/suggestions?budget=3000" -H "Authorization: Bearer <token>"
```

Use only `curl` against `http://localhost:8000`. Do not read or edit files outside this folder, and never call `/approve`, `/send` or `/receive`.
