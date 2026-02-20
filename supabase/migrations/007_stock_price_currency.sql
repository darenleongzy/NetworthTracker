-- Add currency column to stock_prices table
-- Yahoo Finance returns prices in their native currency (e.g., SGX stocks in SGD, LSE stocks in GBP)

ALTER TABLE stock_prices
ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

-- Add a comment for documentation
COMMENT ON COLUMN stock_prices.currency IS 'The currency of the stock price as returned by Yahoo Finance (e.g., USD, SGD, GBP)';
