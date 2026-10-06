# Apex Arcade — Premium Mobile Arcade Platform

A full-stack, mobile-first web gaming platform featuring two real-time synchronized virtual-credit arcade games:
1. **Win Go 1Min** (60-second cycle parity game with synchronized countdown, color/number/size bets, and instant server settlement)
2. **Aviator** (Authoritative crash game with HTML5 Canvas flight trajectory, real-time 100ms multiplier streaming, and race-safe cash-outs)

All wagering and balances use strictly virtual credits for simulation and entertainment. No real-money wagering, deposits, or withdrawals exist.

---

## Architecture Overview

```
├── server.ts                             # Express + Socket.IO + Vite full-stack server
├── src/
│   ├── App.tsx                           # Main responsive layout and real-time state router
│   ├── lib/
│   │   ├── socket.ts                     # Socket.IO client manager
│   │   ├── api.ts                        # REST fetch utilities
│   │   └── types.ts                      # Shared TypeScript data structures
│   ├── components/
│   │   ├── layout/                       # AppHeader, BottomNav, GameSelector
│   │   ├── wingo/                        # WinGoCountdown, BetDrawer, Game, History, MyBets
│   │   ├── aviator/                      # AviatorCanvas, BetPanel, Game, History
│   │   ├── wallet/                       # WalletView, TopUpModal, WithdrawModal
│   │   ├── activity/                     # ActivityView (Win Go, Aviator, P&L)
│   │   └── account/                      # AccountView (Sandbox Pilot profile)
│   └── server/
│       ├── database/
│       │   ├── db.ts                     # High-performance ACID in-memory transactional database
│       │   └── migrations/               # PostgreSQL / Supabase compatible DDL schema
│       ├── wallet/
│       │   └── WalletService.ts          # Atomic balance locks & double-entry ledger mutations
│       ├── games/
│       │   ├── win-go/                   # WinGoRoundManager, ParityEngine, PayoutEngine
│       │   └── aviator/                  # AviatorRoundManager, CrashEngine, TrajectoryEngine
│       ├── sockets/
│       │   └── socketHandler.ts          # Real-time WebSocket events with Zod validation
│       ├── validation/                   # Zod request & event validation schemas
│       ├── routes/                       # Express REST endpoints
│       └── tests/                        # 50 automated tests verifying wallet, Win Go & Aviator
```

---

## Key Features & Specifications

### 1. Shared Virtual Wallet
- **Double-Entry Ledger**: Every balance change is recorded with an idempotency key, reference ID, closing balance, and audit metadata.
- **Atomic Concurrency Control**: Mutex lock prevents double deductions, duplicate payouts, and race conditions.
- **Strict 2-Decimal Precision**: Prevents floating-point drift.
- **Initial Sandbox Grant**: 1,000.00 virtual credits for new pilot accounts.
- **Demo Credit Faucet**: Instant replenish flow (+100, +500, +1,000, +5,000 virtual credits).

### 2. Win Go 1Min Game Engine
- **Synchronized 60-Second Cycle**: 0–50s open for bets; 50–60s locked countdown; settles on the boundary without clock drift.
- **Authoritative Outcome (0–9)**:
  - Color mapping: 0 (Red & Violet), 1 (Green), 2 (Red), 3 (Green), 4 (Red), 5 (Green & Violet), 6 (Red), 7 (Green), 8 (Red), 9 (Green).
  - Parity: Even (Red), Odd (Green).
  - Size: Small (0–4), Big (5–9).
- **Settlement Multipliers**:
  - Number (0–9): 9x
  - Green / Red: 2x (Special rule: Number 0 gives Red 1.5x; Number 5 gives Green 1.5x)
  - Violet: 4.5x (Wins on 0 and 5)
  - Small / Big: 1.96x

### 3. Aviator Game Engine
- **Mathematical Multiplier**: `multiplier(t) = exp(0.065 × t)` where $t$ is elapsed flight time in seconds.
- **Real-Time Stream**: Authoritative multiplier broadcast every 100ms over WebSockets.
- **Canvas Rendering**: 60fps interpolation with red jet fighter, animated cockpit, propeller blur, and fiery particle trail.
- **Race-Safe Cash-Out**: Validates server timestamp against the crash boundary to eliminate client-side manipulation.
- **Crash Point Lower Bound**: Strictly $\ge 1.01\text{x}$.
- **Lifecycle**: 5-second betting phase $\rightarrow$ takeoff $\rightarrow$ flying with live cashout $\rightarrow$ crash ("Flew Away") visible for 5 seconds $\rightarrow$ next round.

---

## Development & Testing Commands

### Install Dependencies
```bash
npm install
```

### Run Automated Tests (50 Tests)
```bash
npm run test
```

### Start Full-Stack Dev Server (Port 3000)
```bash
npm run dev
```

### Build Production Bundle
```bash
npm run build
```

### Run Production Server
```bash
npm run start
```

---

## Database Migrations
The SQL migration schema is located at:
`src/server/database/migrations/001_initial_schema.sql`

Compatible with PostgreSQL 14+, Supabase, or AWS RDS / Cloud SQL.
Execute with `psql`:
```bash
psql -h <host> -U <user> -d <database> -f src/server/database/migrations/001_initial_schema.sql
```
