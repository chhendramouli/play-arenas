# Let's Play - Granular System Deep Dive

This document provides low-level technical specifications, implementation details, and operational patterns for the Let's Play platform.

---

## 💾 1. Database Schema (PostgreSQL)

### `users` table
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY |
| `email` | VARCHAR | UNIQUE, NOT NULL |
| `password` | VARCHAR | BCrypt hashed |
| `name` | VARCHAR | NOT NULL |
| `role` | VARCHAR | 'CUSTOMER', 'ADMIN' |

### `arenas` table
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY |
| `name` | VARCHAR | NOT NULL |
| `location` | VARCHAR | NOT NULL |
| `sport_type` | VARCHAR | E.g., 'Football', 'Basketball' |
| `price_per_hour` | INTEGER | In INR |
| `image_url` | TEXT | CDN/S3 URL |

### `bookings` table
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY |
| `arena_id` | UUID | FK -> arenas(id) |
| `user_email` | VARCHAR | NOT NULL |
| `start_time` | TIMESTAMP | UTC |
| `end_time` | TIMESTAMP | UTC |
| `status` | VARCHAR | 'PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED' |
| `workflow_id` | VARCHAR | Temporal Workflow ID |

---

## ⚙️ 2. Temporal Workflow Architecture

**Namespace**: `LETS-PLAY`
**Task Queue**: `booking-queue`

### BookingWorkflow Implementation:
1.  **State Init**: Set booking status to `PENDING`.
2.  **Signal Wait**: Wait for `paymentSignal` or `cancelSignal`.
3.  **Timer**: A `workflow.sleep(Duration.ofMinutes(2))` runs in parallel.
4.  **Transitions**:
    *   `paymentSignal(success=true)` -> Update DB to `CONFIRMED` -> Complete.
    *   `cancelSignal()` -> Update DB to `CANCELLED` -> Release slot.
    *   `Timer Expires` -> Update DB to `FAILED` -> Release slot.

### Namespace Config (TemporalConfig.java):
*   Uses `WorkflowClientOptions.newBuilder().setNamespace("LETS-PLAY").build()`.
*   Retention period is globally set to **30 days** via CLI.

---

## 🌐 3. API Contract Details

### Auth Endpoints
*   `POST /api/auth/register`: `{name, email, password}` -> `{token, user}`
*   `POST /api/auth/login`: `{email, password}` -> `{token, user}`

### Booking Endpoints
*   `GET /api/arenas/{id}/slots?date=YYYY-MM-DD`: Returns `{availableHours: [], bookedHours: []}`.
*   `POST /api/bookings`: `{arenaId, startTime, endTime}`. Requires JWT.
*   `POST /api/bookings/{id}/payment?success=true`: Triggers the Temporal signal.

---

## ⚛️ 4. Frontend Implementation Specifics

### State Management (TanStack Query)
*   **Key**: `['my-bookings']` - Used in `/bookings` page.
*   **Invalidation Logic**: On successful payment (`POST /payment`), `queryClient.invalidateQueries({ queryKey: ['my-bookings'] })` is called to force a background refresh.

### Timezone Handling
*   **Database**: Stores everything in **UTC**.
*   **Backend**: `LocalDateTime` handled as UTC.
*   **Frontend**: `selectedDate` and `selectedHour` are local strings (e.g., `2024-05-03`). When sending to API, we format them as ISO-8601 local-time strings (e.g., `2024-05-03T10:00:00`), which the backend parses as UTC.

### Redesign Aesthetic (globals.css)
*   `.premium-glass`: `backdrop-filter: blur(20px)` + semi-transparent border.
*   `.premium-tab`: Custom switch-style tab system.
*   `.slot-btn-premium`: High-fidelity interaction states (hover, active, disabled).
*   **Theme**: Dark-first, using Let's Play Blue (`#007bc4`) for primary actions.

---

## 🚀 5. Infrastructure & Deployment (Granular)

### EC2 Environment (`/home/ubuntu/play-arenas`)
*   `docker-compose.prod.yml`: Manages `backend`, `temporal`, `postgresql`, `caddy`.
*   **Caddyfile Location**: `/home/ubuntu/play-arenas/Caddyfile`.
*   **Temporal UI Port**: Proxied via `13.235.29.120/temporal-ui/`.

### AWS Amplify Config
*   **Framework**: Next.js - Static Export.
*   **Build Command**: `npm run build` (triggering `next build` with `output: 'export'`).
*   **Base URL**: `https://main.d39vj530k6o7zp.amplifyapp.com`.
*   **Environment Var**: `NEXT_PUBLIC_API_URL` set to `https://13-235-29-120.nip.io`.

---

## 📜 6. Important Files for Reference
*   `backend/src/main/java/com.letsplay.arenas_backend/config/TemporalConfig.java`: Central multi-tenancy config.
*   `frontend/src/app/book/page.tsx`: Core booking logic and premium UI.
*   `DEPLOY_STATUS.md`: Current live environment facts.

---
**Prepared by**: Antigravity AI
**Date**: 2026-05-03

---

## 🔑 7. Default Credentials (Backoffice)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `superadmin@letsplay.com` | `admin123` |
| **Customer** | (Register via UI) | (User defined) |

> [!IMPORTANT]
> These credentials are seeded during the first run if the user table is empty. For production security, change the admin password after the first login.
