---
domain: "Admin Operations"
status: "draft"
---

# FLOW-login

## Intent

Admin user logs into the back-office.

## Flow

1. Op opens login `W-AD-AUTH-001` on Admin Web
2. Web `POST` login `API-AD-AUTH-001` on Admin API
3. API validates credentials against Postgres
4. API returns JWT
5. Web stores JWT and redirects to dashboard

## Diagram

```mermaid
sequenceDiagram
  actor Op as Admin User
  participant W as Admin Web
  participant A as Admin API
  participant DB as Postgres

  Op->>W: 1. Open login
  W->>A: 2. POST /api/auth/login
  A->>DB: 3. Verify user
  DB-->>A: User valid
  A-->>W: 4. Return JWT
  W-->>Op: 5. Redirect to dashboard
```
