-- Add label column to cash_holdings for CPF sub-accounts (OA, SA, MA)
ALTER TABLE cash_holdings ADD COLUMN label text;

-- Add comment for documentation
COMMENT ON COLUMN cash_holdings.label IS 'Optional label for sub-accounts (e.g., OA, SA, MA for CPF accounts)';
