-- Migration: 006_add_get_daily_invoices_rpc.sql
-- Function to fetch daily invoices with their items and relation details securely for backend API endpoints
-- Using Jerusalem timezone (Asia/Jerusalem) to accurately align with local Palestinian business hours

CREATE OR REPLACE FUNCTION public.get_daily_invoices(
  p_date text,
  p_timezone text DEFAULT 'Asia/Jerusalem'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_ts timestamptz;
  v_end_ts timestamptz;
  v_result jsonb;
BEGIN
  v_start_ts := (p_date || ' 00:00:00')::timestamp AT TIME ZONE p_timezone;
  v_end_ts := (p_date || ' 23:59:59.999')::timestamp AT TIME ZONE p_timezone;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'customer_name', i.customer_name,
      'customer_id', i.customer_id,
      'device', i.device,
      'duration_minutes', i.duration_minutes,
      'session_start', i.session_start,
      'session_end', i.session_end,
      'session_amount', i.session_amount,
      'products_amount', i.products_amount,
      'total_due', i.total_due,
      'discount_amount', i.discount_amount,
      'credit_applied', i.credit_applied,
      'cash_paid', i.cash_paid,
      'bank_paid', i.bank_paid,
      'debt_created', i.debt_created,
      'status', i.status,
      'notes', i.notes,
      'bank_account_name', b.name,
      'package_name', p.name,
      'items', coalesce(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', it.id,
              'product_name', it.product_name,
              'quantity', it.quantity,
              'price_per_unit', it.price_per_unit,
              'total_price', it.total_price
            )
            ORDER BY it.id
          )
          FROM public.invoice_items it
          WHERE it.invoice_id = i.id
        ),
        '[]'::jsonb
      )
    )
    ORDER BY i.session_end DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM public.invoices i
  LEFT JOIN public.bank_accounts b ON i.bank_account_id = b.id
  LEFT JOIN public.packages p ON i.package_id = p.id
  WHERE i.session_end >= v_start_ts AND i.session_end <= v_end_ts;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_invoices(text, text) TO anon, authenticated, service_role;
