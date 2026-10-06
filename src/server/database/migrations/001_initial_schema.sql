-- Migration: 001_initial_schema.sql
-- Compatible with PostgreSQL 14+, Supabase, and managed PostgreSQL instances.
-- Enforces numeric precision, foreign keys, idempotency constraints, and indices.

-- 1. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(64) PRIMARY KEY,
    mobile VARCHAR(32) NOT NULL UNIQUE,
    wallet_balance NUMERIC(18, 2) NOT NULL DEFAULT 1000.00 CHECK (wallet_balance >= 0),
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ledger Table (Double-entry / audit-proof balance mutations)
CREATE TYPE ledger_type AS ENUM ('TOPUP', 'BET', 'WIN', 'WITHDRAW', 'REFUND');

CREATE TABLE IF NOT EXISTS ledger (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL, -- 'TOPUP', 'BET', 'WIN', 'WITHDRAW', 'REFUND'
    amount NUMERIC(18, 2) NOT NULL,
    closing_balance NUMERIC(18, 2) NOT NULL CHECK (closing_balance >= 0),
    reference_id VARCHAR(128) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_account_created ON ledger(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON ledger(reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_idempotency ON ledger(idempotency_key);

-- 3. Win Go 1Min Rounds Table
CREATE TABLE IF NOT EXISTS win_go_rounds (
    id VARCHAR(64) PRIMARY KEY,
    period_number BIGINT NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL, -- 'OPEN', 'LOCKED', 'SETTLED'
    result_number SMALLINT CHECK (result_number BETWEEN 0 AND 9),
    result_color VARCHAR(32), -- 'GREEN', 'RED', 'VIOLET', 'RED_VIOLET', 'GREEN_VIOLET'
    result_size VARCHAR(16),  -- 'SMALL', 'BIG'
    started_at TIMESTAMPTZ NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL,
    settled_at TIMESTAMPTZ,
    total_bets_count INT NOT NULL DEFAULT 0,
    total_bets_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    total_payout_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wingo_period ON win_go_rounds(period_number DESC);
CREATE INDEX IF NOT EXISTS idx_wingo_status ON win_go_rounds(status);

-- 4. Win Go Bets Table
CREATE TABLE IF NOT EXISTS win_go_bets (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    round_id VARCHAR(64) NOT NULL REFERENCES win_go_rounds(id) ON DELETE CASCADE,
    selection_type VARCHAR(32) NOT NULL, -- 'COLOR', 'NUMBER', 'SIZE'
    selection_value VARCHAR(32) NOT NULL, -- 'RED', 'GREEN', 'VIOLET', '0'-'9', 'SMALL', 'BIG'
    stake_amount NUMERIC(18, 2) NOT NULL CHECK (stake_amount > 0),
    multiplier NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    payout_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'WON', 'LOST', 'REFUNDED'
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wingo_bets_account ON win_go_bets(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wingo_bets_round ON win_go_bets(round_id);

-- 5. Aviator Rounds Table
CREATE TABLE IF NOT EXISTS aviator_rounds (
    id VARCHAR(64) PRIMARY KEY,
    round_number BIGINT NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL, -- 'COUNTDOWN', 'FLYING', 'CRASHED'
    crash_multiplier NUMERIC(8, 2) NOT NULL CHECK (crash_multiplier >= 1.01),
    started_at TIMESTAMPTZ NOT NULL,
    crashed_at TIMESTAMPTZ,
    total_bets_count INT NOT NULL DEFAULT 0,
    total_bets_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    total_payout_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aviator_round_number ON aviator_rounds(round_number DESC);

-- 6. Aviator Bets Table
CREATE TABLE IF NOT EXISTS aviator_bets (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    round_id VARCHAR(64) NOT NULL REFERENCES aviator_rounds(id) ON DELETE CASCADE,
    stake_amount NUMERIC(18, 2) NOT NULL CHECK (stake_amount > 0),
    auto_cashout_multiplier NUMERIC(8, 2),
    cashout_multiplier NUMERIC(8, 2),
    payout_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_FLIGHT', -- 'IN_FLIGHT', 'WON', 'CRASHED', 'REFUNDED'
    cashed_out_at TIMESTAMPTZ,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aviator_bets_account ON aviator_bets(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aviator_bets_round ON aviator_bets(round_id);
