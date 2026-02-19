-- Add currency column to net_worth_snapshots to track what currency values were saved in
ALTER TABLE net_worth_snapshots ADD COLUMN currency text NOT NULL DEFAULT 'USD';

-- Add comment for documentation
COMMENT ON COLUMN net_worth_snapshots.currency IS 'The base currency the snapshot values are stored in';
