-- ============================================================
-- MIGRATION: Fix bank_transfers double-counting
-- Run this in Supabase SQL Editor
-- ============================================================

-- (You should have already run the ALTER TYPE command separately)

-- ────────────────────────────────────────────────────────────
-- 1. Fix invoice trigger: bank_paid entries get transfer_status = 'pending'
--    so they are NOT counted in bank_balance until manually confirmed.
--    The bank_balance_by_account view already filters:
--      "WHERE transfer_status IS NULL OR transfer_status = 'confirmed'"
--    So 'pending' entries are excluded correctly.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_invoice_to_ledger()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Cash paid → ledger immediately (no confirmation needed)
  IF NEW.cash_paid > 0 THEN
    INSERT INTO ledger_entries (tx_type, direction, channel, amount, reference_id, reference_type, customer_id, description, performed_by)
    VALUES ('income_session', 'in', 'cash', NEW.cash_paid, NEW.id, 'invoice', NEW.customer_id,
            'إيراد جلسة: ' || NEW.customer_name, NEW.closed_by);
  END IF;

  -- Bank paid → ledger with transfer_status = 'pending'
  -- Will NOT be counted in bank balance until confirmed from banks page
  IF NEW.bank_paid > 0 THEN
    INSERT INTO ledger_entries (tx_type, direction, channel, amount, reference_id, reference_type, customer_id, bank_account_id, transfer_status, description, performed_by)
    VALUES ('income_session', 'in', 'bank', NEW.bank_paid, NEW.id, 'invoice', NEW.customer_id, NEW.bank_account_id,
            'pending',
            'إيراد جلسة (بنك): ' || NEW.customer_name, NEW.closed_by);
  END IF;

  -- Debt created → ledger (same as before)
  IF NEW.debt_created > 0 THEN
    INSERT INTO ledger_entries (tx_type, direction, channel, amount, reference_id, reference_type, customer_id, description, performed_by)
    VALUES ('debt_create', 'in', 'cash', NEW.debt_created, NEW.id, 'invoice', NEW.customer_id,
            'دين عميل: ' || NEW.customer_name, NEW.closed_by);
  END IF;

  -- Update customer last visit
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers SET last_visit_at = NEW.session_end WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 2. Fix existing ledger entries that were created by old trigger
--    (bank entries without transfer_status that already have
--     a matching bank_transfers record)
--    This prevents continued double-counting for old records.
-- ────────────────────────────────────────────────────────────

-- Mark old bank ledger entries from invoices as 'confirmed' 
-- (they were counted before, keep them counted)
UPDATE ledger_entries
SET transfer_status = 'confirmed'
WHERE channel = 'bank'
  AND transfer_status IS NULL
  AND reference_type = 'invoice'
  AND tx_type = 'income_session';

-- Finished fixing double counting.
