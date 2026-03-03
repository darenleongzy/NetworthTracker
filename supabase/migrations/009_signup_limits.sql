-- Signup Limiting & Waitlist Feature
-- Migration 009: Add tables for managing signup limits, admin users, waitlist, and email queue

-- ══════════════════════════════════════════════════════════════════════════════
-- APP SETTINGS (Singleton table for app-wide configuration)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures singleton
  signup_enabled BOOLEAN NOT NULL DEFAULT true,
  signup_limit INTEGER NOT NULL DEFAULT 100,
  current_signup_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO app_settings (id) VALUES (1);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- ADMIN USERS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- WAITLIST
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TYPE waitlist_status AS ENUM ('pending', 'invited', 'signed_up');

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status waitlist_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ
);

CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at);

-- ══════════════════════════════════════════════════════════════════════════════
-- EMAIL QUEUE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  status email_status NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at);

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGER: Increment signup count when new user confirms email
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_signup_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count when email is confirmed (email_confirmed_at changes from NULL to a value)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE app_settings SET current_signup_count = current_signup_count + 1 WHERE id = 1;

    -- Also update waitlist if this email was on it
    UPDATE waitlist
    SET status = 'signed_up', signed_up_at = now()
    WHERE email = NEW.email AND status = 'invited';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION increment_signup_count();

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- APP SETTINGS: Anyone can read, only admins can update
CREATE POLICY "Anyone can read app_settings"
  ON app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update app_settings"
  ON app_settings FOR UPDATE
  USING (is_admin());

-- ADMIN USERS: Only admins can view
CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert admin_users"
  ON admin_users FOR INSERT
  WITH CHECK (is_admin());

-- WAITLIST: Anyone can insert (join), only admins can view/update
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
  ON waitlist FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update waitlist"
  ON waitlist FOR UPDATE
  USING (is_admin());

-- EMAIL QUEUE: Only admins can view
CREATE POLICY "Admins can view email_queue"
  ON email_queue FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert email_queue"
  ON email_queue FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update email_queue"
  ON email_queue FOR UPDATE
  USING (is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED ADMIN USER (darenleongzy@gmail.com)
-- ══════════════════════════════════════════════════════════════════════════════

-- Insert admin by looking up user_id from auth.users by email
-- This will only work if the user already exists
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'darenleongzy@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- INITIALIZE CURRENT SIGNUP COUNT
-- ══════════════════════════════════════════════════════════════════════════════

-- Set initial count to current confirmed users
UPDATE app_settings
SET current_signup_count = (
  SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL
)
WHERE id = 1;
