-- ============================================================
-- MIGRATION: Fix invoice update logs (prevent redundant logs)
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_log_invoice_activity()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.closed_by, 'create_invoice', 'invoice', NEW.id, jsonb_build_object('status', NEW.status, 'total_due', NEW.total_due, 'customer_name', NEW.customer_name));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log update if the status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
      VALUES (NEW.closed_by, 'update_invoice', 'invoice', NEW.id, jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
