# Decathlon Play - Granular File Map

This document maps the project's critical files to their specific functions, enabling rapid navigation for AI agents.

## 📂 Backend (Spring Boot)
| Path | Responsibility |
| :--- | :--- |
| `src/main/java/com/decathlon/play_arenas_backend/model/` | **Entity Definitions**: `User`, `Arena`, `Booking`. |
| `src/main/java/com/decathlon/play_arenas_backend/repository/` | **JPA Data Access**: Interfaces for DB queries. |
| `src/main/java/com/decathlon/play_arenas_backend/service/` | **Business Logic**: `BookingService` (Triggers Temporal workflows). |
| `src/main/java/com/decathlon/play_arenas_backend/controller/` | **API Layer**: Auth, Arena, and Booking REST endpoints. |
| `src/main/java/com/decathlon/play_arenas_backend/config/TemporalConfig.java` | **Workflow Client**: Configures `DKT-PLAY` namespace. |
| `src/main/java/com/decathlon/play_arenas_backend/config/DataInitializer.java` | **Seeding**: Populates initial venues (Bandra, Powai, etc.). |
| `src/main/java/com/decathlon/play_arenas_backend/workflow/` | **Temporal Workflows**: The state machine for booking holds. |

## 📂 Frontend (Next.js)
| Path | Responsibility |
| :--- | :--- |
| `src/app/book/page.tsx` | **Booking Page**: The heart of the app (Slot selection, payment UI). |
| `src/app/bookings/page.tsx` | **Dashboard**: Displays a user's booking history. |
| `src/app/venues/page.tsx` | **Venue Listing**: Search and filter interface. |
| `src/app/globals.css` | **Global Styles**: Contains premium glassmorphism and animation classes. |
| `src/components/AuthContext.tsx` | **State**: Manages JWT tokens and login session. |
| `src/components/types.ts` | **Type Definitions**: Shared TS interfaces for Arena, Booking, User. |

## 📂 Infrastructure
| Path | Responsibility |
| :--- | :--- |
| `docker-compose.prod.yml` | **Orchestration**: Production container setup for Backend/Temporal. |
| `Caddyfile` | **Proxy/SSL**: Reverse proxy rules, TLS, and basic-auth for Temporal UI. |
| `amplify.yml` | **Build Pipeline**: AWS Amplify instructions for static export. |
| `deploy_aws.sh` | **Automation**: Script used to push code and restart production services. |

## 📂 Project Logs & Facts
| Path | Responsibility |
| :--- | :--- |
| `DEPLOY_STATUS.md` | **Live Truth**: Real-time URLs and environment health status. |
| `PROJECT_HANDOVER.md` | **High-level History**: Strategic summary of work done. |
| `SYSTEM_DEEP_DIVE.md` | **Low-level Specs**: DB schemas, API contracts, Workflow states. |
