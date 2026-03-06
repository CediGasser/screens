# Architecture documentation

## Solution Strategy

| Decision                          | Choice                                       | Rationale                                                                                                                  |
| --------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Frontend framework                | Angular 21 with SSR                          | Component model fits the data-driven UI; SSR provides fast initial loads and better SEO for public pages                   |
| Backend                           | Express 5 embedded in the Angular SSR server | Single deployment unit; the API is mounted as Express route before the Angular catch-all handler                           |
| Database                          | MongoDB (native driver)                      | Flexible document model for device data; no ORM overhead                                                                   |
| Authentication                    | Authentik (OIDC) with `angular-oauth2-oidc`  | Self-hosted identity provider; Authorization Code flow with PKCE and refresh tokens                                        |
| Table and range slider components | PrimeNG 21                                   | Implementing these from scratch would be overkill                                                                          |
| Design system                     | CSS custom properties (design tokens)        | Generated via [shaper](https://hihayk.github.io/shaper/); covers typography, spacing, and colors with automatic dark mode  |
| Architecture style                | Monolith with module boundaries              | `src/api/` (backend) and `src/app/` (frontend) are co-located but share zero code imports — they only communicate via HTTP |

## Building Block View

### Level 1 — Container Overview

```mermaid
graph TD
    Browser["🌐 Browser<br/><small>Angular SPA</small>"]
    Server["⚙️ Node.js Server<br/><small>Express API + Angular SSR</small>"]
    MongoDB["🗄️ MongoDB"]
    Authentik["🔐 Authentik<br/><small>OIDC Provider</small>"]

    Browser -- "HTTP requests" --> Server
    Server -- "Read/Write" --> MongoDB
    Server -- "Fetch public key<br/>(JWT verification)" --> Authentik
    Browser -- "OAuth login flow<br/>(Code + PKCE)" --> Authentik
```

### Level 2 — Module Decomposition

```mermaid
graph TD
    subgraph "src/api — Backend"
        routes["routes<br/><small>devices, bulk-actions</small>"]
        controllers["controllers<br/><small>devices CRUD</small>"]
        middlewares["middlewares<br/><small>auth, error, logger</small>"]
        validators["validators<br/><small>device payload validation</small>"]
        errors["errors<br/><small>AppError hierarchy</small>"]
        db["config/db<br/><small>MongoDB connection</small>"]

        routes --> controllers
        routes --> validators
        routes --> errors
        controllers --> db
    end

    subgraph "src/app — Frontend"
        pages["pages<br/><small>home, data, admin, callback</small>"]
        features["features<br/><small>screen-size-map, time-axis,<br/>devices-table, devices-filter,<br/>device-form, csv-import-dialog</small>"]
        services["services<br/><small>auth, config, devices-api,<br/>csv-parser, csv-validator</small>"]
        guards["guards<br/><small>auth-guard</small>"]
        interceptors["interceptors<br/><small>auth-interceptor</small>"]

        pages --> features
        pages --> services
        guards --> services
        interceptors --> services
    end

    services -- "HTTP only<br/>(no code imports)" --> routes

    style routes fill:#e8f4fd
    style services fill:#fdf2e8
```

### API Endpoints

| Method   | Path                               | Auth | Description                                            |
| -------- | ---------------------------------- | :--: | ------------------------------------------------------ |
| `GET`    | `/api/health`                      |  —   | Health check                                           |
| `GET`    | `/api/config`                      |  —   | OAuth config (issuer, clientId)                        |
| `GET`    | `/api/devices`                     | —\*  | List devices (unauthenticated: published only)         |
| `GET`    | `/api/devices/meta`                | —\*  | Metadata (boundaries, counts)                          |
| `GET`    | `/api/devices/:id`                 | —\*  | Single device (unauthenticated: published only)        |
| `POST`   | `/api/devices`                     | —\*  | Create device (unauthenticated can only create drafts) |
| `PUT`    | `/api/devices/:id`                 |  🔒  | Update device                                          |
| `DELETE` | `/api/devices/:id`                 |  🔒  | Delete device                                          |
| `POST`   | `/api/devices/bulk-actions/create` |  🔒  | Bulk create devices                                    |
| `POST`   | `/api/devices/bulk-actions/update` |  🔒  | Bulk update devices                                    |
| `POST`   | `/api/devices/bulk-actions/delete` |  🔒  | Bulk delete devices                                    |

\*Unauthenticated users have restricted visibility (no draft devices).

## Runtime View

### SSR Page Load with TransferState

```mermaid
sequenceDiagram
    participant B as Browser
    participant E as Express Server
    participant SSR as Angular SSR
    participant Env as process.env

    B->>E: GET / (initial page load)
    E->>SSR: render(request)
    SSR->>Env: Read OAUTH_ISSUER, OAUTH_CLIENT_ID
    SSR->>SSR: Store config in TransferState
    SSR-->>E: HTML + embedded TransferState
    E-->>B: Full HTML response
    B->>B: Hydrate Angular app
    B->>B: Read config from TransferState (no extra HTTP call)
```

When `TransferState` is unavailable (e.g. client-only navigation), the browser falls back to `GET /api/config`.

### Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant AG as AuthGuard
    participant AS as AuthService
    participant Auth as Authentik

    B->>AG: Navigate to /admin
    AG->>AS: isAuthenticated()?
    AS-->>AG: false
    AG->>AS: login(state="/admin")
    AS->>Auth: Redirect (Authorization Code + PKCE)
    Auth->>B: Login page
    B->>Auth: User enters credentials
    Auth->>B: Redirect to /auth/callback?code=…
    B->>AS: tryLoginCodeFlow()
    AS->>Auth: Exchange code for tokens
    Auth-->>AS: access_token + id_token
    AS->>AS: Setup automatic silent refresh
    AS->>B: Navigate to /admin (from OAuth state)
```

### Suggestion / Draft Workflow

```mermaid
flowchart LR
    A["Unauthenticated user<br/>submits device"] -->|"POST /api/devices<br/>(isDraft: true)"| B["Device stored<br/>as draft"]
    B --> C{"Admin reviews<br/>suggestion"}
    C -->|"Approve:<br/>PUT isDraft→false"| D["✅ Published"]
    C -->|"Reject:<br/>DELETE"| E["❌ Removed"]
    C -->|"Edit & approve"| D
```

## Deployment

```mermaid
graph TD
    subgraph "Docker Multi-Stage Build"
        builder["🔨 Builder Stage<br/><small>node:24-alpine</small><br/><small>npm ci → npm run build</small>"]
        runtime["📦 Runtime Stage<br/><small>node:24-alpine</small><br/><small>Only dist/screens/</small>"]
        builder -->|"COPY dist"| runtime
    end

    runtime -->|"Deploy on push"| dokploy["☁️ Dokploy<br/><small>Self hosted vercel alternative</small>"]

    subgraph env["Environment Variables"]
        env1["MONGODB_URI"]
        env2["OAUTH_ISSUER"]
        env3["OAUTH_CLIENT_ID"]
    end

    env -.-> dokploy
```

The Dockerfile produces a minimal image: the builder stage installs dependencies and compiles the Angular app (SSR + browser bundles), while the runtime stage copies only the `dist/` output. The final image runs `node dist/server/server.mjs`.

## Cross-cutting Concepts

### Express Middleware Chain

```mermaid
graph LR
    Req["Incoming<br/>Request"] --> json["json()"]
    json --> logger["logger"]
    logger --> auth["authMiddleware<br/><small>JWT verification,<br/>sets req.user</small>"]
    auth --> handler["Route Handler"]
    handler --> err["errorMiddleware<br/><small>Catches AppError,<br/>returns JSON</small>"]
    err --> Res["Response"]
```

### Error Hierarchy

```mermaid
classDiagram
    class AppError {
        +statusCode: number
        +code: string
    }
    class ValidationError {
        +statusCode = 400
    }
    class NotFoundError {
        +statusCode = 404
    }
    class UnauthorizedError {
        +statusCode = 401
    }
    class WtfError {
        +statusCode = 500
    }

    AppError <|-- ValidationError
    AppError <|-- NotFoundError
    AppError <|-- UnauthorizedError
    AppError <|-- WtfError
```

All API errors extend `AppError`. The centralized `errorMiddleware` catches these and returns a consistent `{ error, code }` JSON response. Unexpected errors return a generic 500.

### AuthService — SSR Compatibility

`AuthService` guards all OAuth operations behind `isPlatformBrowser()`. During SSR, authentication methods are no-ops. To complement this, the server route config uses `RenderMode.Client` for `/admin/**` and `/auth/callback` (where browser-only auth APIs are needed) and `RenderMode.Server` for all public routes.

### Design Tokens

CSS custom properties serve as the design system foundation, generated with [shaper](https://hihayk.github.io/shaper/). Tokens cover three dimensions:

- **Typography**: `--text-xs` through `--text-xl`, base size with increment ratio
- **Spacing**: `--space-s` through `--space-4xl`, derived from a base unit (0.5rem) and increment factor
- **Colors**: HSL-based accent color and 8-level greyscale (`--c-grey1`…`--c-grey8`), with semantic aliases (`--c-background`, `--c-body`, `--c-border`, `--c-error`)

Dark mode is handled entirely by reassigning these variables in a `@media (prefers-color-scheme: dark)` block. PrimeNG is integrated via `cssLayer: 'primeng'` for specificity control, with overrides using the same tokens.

### Signals

The frontend makes extensive use of Angular signals (`signal`, `computed`, `input`, `output`, `toSignal`). Forms use the new `@angular/forms/signals` API with `form()`, `FormField`, and signal-based validators.

## Architecture Decisions

### Monolith with Module Boundaries

The backend (`src/api/`) and frontend (`src/app/`) live in the same repository and are compiled together, but `src/api/` has **zero imports from `src/app/`**. Communication happens only via HTTP. This keeps the option to split them into separate services later while benefiting from simpler deployment now.

### Embedded Express in Angular SSR

Instead of running a separate backend, the Express API is mounted at `/api` before the Angular SSR catch-all in `server.ts`. This means a single `node` process serves both the API and the rendered pages.

### Authorization Code Flow with PKCE

The frontend uses the OAuth Authorization Code flow. PKCE (Proof Key for Code Exchange) is used to prevent authorization code interception — particularly important since this is treated as a browser-based public client with no client secret.

Yes, the SSR backend is theoretically an oauth client that could hold a secret, but to keep things nice and separated, we preferably do nothing auth related with SSR. Code flow + PKCE allows for a cleaner separation of concerns.

### Separate Test Runners

Vitest mocks (`vi.mock`) do not work correctly when the test files are built (using `@angular/build:unit-test`) before being run. The solution: **two separate test pipelines**:

- `ng test` — Angular's built-in test runner (which uses vite) for frontend `.spec.ts` files (excludes `src/api/**`)
- `vitest run` — Vitest for backend API tests only (`src/api/**/*.spec.ts`)

The `npm test` script chains both: `ng test --configuration=ci && vitest run`.

The `test:frontend` or `test:backend` npm scripts are provided for separate watching modes.

### TransferState for Config

Instead of every browser client fetching `/api/config` on startup, the SSR pass reads environment variables and embeds them in Angular's `TransferState`. The browser extracts the config from the serialized HTML — zero extra HTTP requests on initial load.

# Conclusion

# Work journal

| Date       |  Hours | Activities                                                                                                                                                                                                                                                             |
| ---------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-03 |      3 | Wrote project requirements and documented architecture choices. Initialized Angular repository.                                                                                                                                                                        |
| 2026-02-04 |      7 | Created basic page structure and devices table component. Added table to admin page. Fixed SSR hydration mismatch. Created route guards and basic auth service.                                                                                                        |
| 2026-02-05 |      5 | Added tests for components and auth service. Initialized Express API with devices routes. Added API route tests with custom DB mock injection.                                                                                                                         |
| 2026-02-06 |      2 | Added error class hierarchy (`AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, `WtfError`) for the API.                                                                                                                                             |
| 2026-02-10 |      8 | Integrated OAuth service (Authentik OIDC). Added JWT auth middleware to Express. Created Dockerfile for deployment. Fixed redirect handling and table row styling. Refactored DB mock for tests.                                                                       |
| 2026-02-12 |      6 | Added admin sub-pages (published devices, suggestions). Added `isDraft` filter to API. Created device form dialog. Added logout functionality. Migrated devices table to PrimeNG. Switched routes to lazy loading with `loadComponent`. Updated requirements document. |
| 2026-02-13 |      4 | Removed dedicated login page (using OIDC redirect instead). Added design-token-based styling. Built devices filter component with dropdown selectors and range sliders.                                                                                                |
| 2026-02-15 |      5 | Finalized filter component styling. Added approve/reject feature for device suggestions. Added UI icons. Refactored auth to use refresh tokens instead of silent refresh. Updated API middlewares.                                                                     |
| 2026-02-16 |      1 | Fixed responsive layout issues on admin pages.                                                                                                                                                                                                                         |
| 2026-02-17 |    1.5 | Refactored MongoDB connection module.                                                                                                                                                                                                                                  |
| 2026-02-19 |      3 | Added bulk action UI to frontend (selection, bulk update/delete buttons, API integration). Currently sending multiple requests to existing single endpoints.                                                                                                           |
| 2026-02-23 |    2.5 | Added bulk action API endpoints (POST create, update, delete) with authentication and updated Frontend to use these.                                                                                                                                                   |
| 2026-02-24 |      3 | Added comprehensive request validators for device payloads and query filters. Configured shorter MongoDB connection timeout.                                                                                                                                           |
| 2026-02-28 |      4 | Built CSV import dialog with file parsing (PapaParse), row-level validation, and bulk device creation.                                                                                                                                                                 |
| 2026-03-02 |      1 | Updated sample devices CSV with additional entries.                                                                                                                                                                                                                    |
| 2026-03-03 |      4 | Wrote first architecture documentation section. Fixed width/height field confusion. Moved devices table to dedicated `/data` page. Added screen-size-map and time-axis visualization components (AI-assisted).                                                         |
| 2026-03-05 |      3 | Fixed UI issues in screen-size-map and time-axis components. Added home page intro text. Removed unused device types. Expanded sample device data.                                                                                                                     |
| **Total**  | **63** |                                                                                                                                                                                                                                                                        |
