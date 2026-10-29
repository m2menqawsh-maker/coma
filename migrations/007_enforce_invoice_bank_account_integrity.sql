-- ============================================================
-- MIGRATION 007: Enforce Bank Account Integrity on Invoices & Transfers
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Ensure any legacy invoice with bank_paid = 0 has bank_account_id = null (hygiene)
UPDATE public.invoices
SET bank_account_id = NULL
WHERE bank_paid = 0 AND bank_account_id IS NOT NULL;

-- 2. Add CHECK constraint on public.invoices ensuring bank_paid > 0 requires bank_account_id IS NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_invoice_bank_account'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT check_invoice_bank_account
      CHECK (bank_paid = 0 OR bank_account_id IS NOT NULL);
  END IF;
END $$;

-- 3. Update trigger function trg_invoice_to_ledger() to strictly enforce bank_account_id
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
    IF NEW.bank_account_id IS NULL THEN
      RAISE EXCEPTION 'لا يمكن تسجيل دفعة بنكية بدون تحديد حساب بنكي مستلم (invoices.bank_account_id)';
    END IF;

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
