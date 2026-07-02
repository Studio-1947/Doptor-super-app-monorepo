# Doptor Super App

## Structure

- **frontend/**: Frontend applications (Web, Mobile) and shared UI.
- **backend/**: Backend services (API, Workers, Realtime) and database schemas.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for database)

### Installation

```bash
pnpm install
```

### Running Locally

```bash
pnpm dev
```

## Architecture

See `docs/ARCHITECTURE.md` for details.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — how the app is deployed to the
VPS, how to reproduce it on a fresh server, how to add a new project to the same
server, and troubleshooting for every issue encountered during setup.
