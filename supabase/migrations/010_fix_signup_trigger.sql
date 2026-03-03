-- Fix: Make signup trigger only fire when email_confirmed_at changes
-- This prevents the trigger from interfering with other auth.users updates

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_user_confirmed ON auth.users;

-- Create a more specific trigger that only fires when email_confirmed_at changes
CREATE TRIGGER on_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION increment_signup_count();
