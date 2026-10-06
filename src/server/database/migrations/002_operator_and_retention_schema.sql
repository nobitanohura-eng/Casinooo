-- Migration: 002_operator_and_retention_schema.sql
-- Compatible with PostgreSQL 14+, Supabase, and managed Cloud SQL instances.
-- Enforces Pillar 1 Operator Oversight & Pillar 2 Retention/Affiliate Schemas.

-- 1. Extend Accounts with turnover, freeze status, affiliates, and attendance
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS total_deposited NUMERIC(18, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS total_wagered NUMERIC(18, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS total_won NUMERIC(18, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS referred_by VARCHAR(64) REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32) UNIQUE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS claimable_commission NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (claimable_commission >= 0);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS total_commission NUMERIC(18, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS attendance_days INT NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_attendance_date VARCHAR(16);

-- 2. Deposit Approval Queue (UTR verification)
CREATE TABLE IF NOT EXISTS deposit_requests (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
    utr_number VARCHAR(64) NOT NULL,
    payment_method VARCHAR(32) NOT NULL DEFAULT 'UPI',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    operator_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deposit_status ON deposit_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposit_account ON deposit_requests(account_id);

-- 3. Withdrawal Queue (1X turnover enforcement & approval)
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
    upi_id VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    turnover_at_request NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    required_turnover NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    operator_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_account ON withdrawal_requests(account_id);

-- 4. Multi-Tier Agency Commissions Ledger
CREATE TABLE IF NOT EXISTS agency_commissions (
    id VARCHAR(64) PRIMARY KEY,
    inviter_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    bettor_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    tier_level SMALLINT NOT NULL CHECK (tier_level BETWEEN 1 AND 3),
    bet_amount NUMERIC(18, 2) NOT NULL,
    commission_rate NUMERIC(6, 4) NOT NULL, -- e.g. 0.0060 (0.6%), 0.0030 (0.3%), 0.0010 (0.1%)
    commission_amount NUMERIC(18, 2) NOT NULL,
    game VARCHAR(32) NOT NULL,
    reference_bet_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agency_inviter ON agency_commissions(inviter_id, created_at DESC);

-- 5. Dynamic System Configuration (Hot-reloadable by Operator)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Operator Audit Log
CREATE TABLE IF NOT EXISTS operator_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    operator_ip VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    target_id VARCHAR(64),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
