-- Migration 004: Flexible Subscriptions

-- 1. Add new columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cost numeric NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS daily_hours_limit numeric;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS bulk_hours_limit numeric;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS excluded_days integer[];
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS drinks_allowance jsonb;

-- 2. Create subscription usage table to track what is consumed per session
CREATE TABLE IF NOT EXISTS subscription_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_id uuid NOT NULL,
  session_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  hours_used numeric NOT NULL DEFAULT 0,
  drinks_used integer NOT NULL DEFAULT 0,
  drinks_details jsonb, -- array of { product_id, quantity }
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_sub ON public.subscription_usage USING btree (subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_session ON public.subscription_usage USING btree (session_id);
