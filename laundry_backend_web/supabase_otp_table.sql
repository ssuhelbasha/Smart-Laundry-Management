-- ============================================================
-- Smart Laundry Management — OTP Codes Table
-- Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================================

-- Create the otp_codes table for persistent OTP storage
CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  otp_key TEXT UNIQUE NOT NULL,         -- e.g. "user@email.com_registration"
  otp_code TEXT,                         -- 6-digit OTP (null if via supabase_auth)
  expires_at BIGINT NOT NULL,            -- Unix timestamp (ms) for expiry
  used BOOLEAN DEFAULT FALSE,            -- Whether OTP has been consumed
  via TEXT DEFAULT 'email',              -- 'email' or 'smtp'
  attempts INTEGER DEFAULT 0,            -- Failed verification attempts
  created_at TIMESTAMPTZ DEFAULT NOW()   -- Record creation time
);

-- Index for fast lookups by otp_key
CREATE INDEX IF NOT EXISTS idx_otp_codes_key ON otp_codes(otp_key);

-- Enable Row Level Security (RLS) but allow service role full access
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role (backend) can read/write OTP codes
-- No client-side access — OTPs are backend-only
CREATE POLICY "Service role full access" ON otp_codes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional: Auto-cleanup expired OTPs (older than 1 hour)
-- You can run this periodically or set up a Supabase cron
-- DELETE FROM otp_codes WHERE expires_at < (EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000);
