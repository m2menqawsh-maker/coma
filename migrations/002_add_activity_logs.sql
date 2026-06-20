CREATE TABLE activity_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Trigger for Invoices
CREATE OR REPLACE FUNCTION public.trg_log_invoice_activity()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.closed_by, 'create_invoice', 'invoice', NEW.id, jsonb_build_object('status', NEW.status, 'total_due', NEW.total_due, 'customer_name', NEW.customer_name));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
      VALUES (NEW.closed_by, 'update_invoice', 'invoice', NEW.id, jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_activity_trigger
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION trg_log_invoice_activity();

-- Trigger for Sessions
CREATE OR REPLACE FUNCTION public.trg_log_session_activity()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.started_by, 'start_session', 'session', NEW.id, jsonb_build_object('customer_name', NEW.customer_name, 'device', NEW.device));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER session_activity_trigger
  AFTER INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION trg_log_session_activity();

-- Trigger for Ledger Entries
CREATE OR REPLACE FUNCTION public.trg_log_ledger_activity()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.performed_by, 'create_ledger_entry', 'ledger', NEW.id, jsonb_build_object('tx_type', NEW.tx_type, 'amount', NEW.amount, 'direction', NEW.direction));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ledger_activity_trigger
  AFTER INSERT ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION trg_log_ledger_activity();

-- Trigger for Expenses
CREATE OR REPLACE FUNCTION public.trg_log_expense_activity()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.performed_by, 'create_expense', 'expense', NEW.id, jsonb_build_object('name', NEW.name, 'amount', NEW.amount, 'expense_type', NEW.expense_type));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER expense_activity_trigger
  AFTER INSERT ON expenses
  FOR EACH ROW EXECUTE FUNCTION trg_log_expense_activity();

-- Trigger for Inventory Movements
CREATE OR REPLACE FUNCTION public.trg_log_inventory_activity()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.performed_by, 'inventory_movement', 'inventory', NEW.id, jsonb_build_object('qty', NEW.qty, 'direction', NEW.direction, 'item_id', NEW.item_id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER inventory_activity_trigger
  AFTER INSERT ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION trg_log_inventory_activity();
