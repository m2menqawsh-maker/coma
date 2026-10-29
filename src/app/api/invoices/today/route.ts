import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		// 1. Authenticate Request
		const expectedKey = process.env.EXTERNAL_API_KEY || "coma_dev_secret_key";
		const authHeader = req.headers.get("authorization");
		const apiKeyHeader = req.headers.get("x-api-key");
		const bearerKey = authHeader?.startsWith("Bearer ")
			? authHeader.substring(7)
			: null;
		const providedKey = apiKeyHeader || bearerKey;

		if (!providedKey || providedKey !== expectedKey) {
			return NextResponse.json(
				{
					success: false,
					error: "Unauthorized: Missing or invalid API key",
				},
				{ status: 401 },
			);
		}

		// 2. Validate Supabase Configuration
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseKey =
			process.env.SUPABASE_SERVICE_ROLE_KEY ||
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseKey) {
			return NextResponse.json(
				{ success: false, error: "Server database configuration is missing" },
				{ status: 500 },
			);
		}

		// 3. Determine Date (Local Jerusalem Timezone by default or ?date=YYYY-MM-DD)
		const url = new URL(req.url);
		const dateParam = url.searchParams.get("date");
		let targetDate: string;

		if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
			targetDate = dateParam;
		} else {
			const formatter = new Intl.DateTimeFormat("en-CA", {
				timeZone: "Asia/Jerusalem",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			});
			targetDate = formatter.format(new Date());
		}

		// 4. Query Database via RPC with Jerusalem Timezone
		const supabase = createClient(supabaseUrl, supabaseKey, {
			auth: { persistSession: false },
		});

		const { data: rawInvoices, error } = await supabase.rpc(
			"get_daily_invoices",
			{
				p_date: targetDate,
				p_timezone: "Asia/Jerusalem",
			},
		);

		if (error) {
			return NextResponse.json(
				{ success: false, error: `Database query failed: ${error.message}` },
				{ status: 500 },
			);
		}

		// 5. Structure Invoices and Items
		const invoices = (rawInvoices || []).map((inv: any) => ({
			id: inv.id,
			customer_name: inv.customer_name,
			customer_id: inv.customer_id,
			device: inv.device,
			duration_minutes: inv.duration_minutes,
			session_start: inv.session_start,
			session_end: inv.session_end,
			session_amount: Number(inv.session_amount || 0),
			products_amount: Number(inv.products_amount || 0),
			total_due: Number(inv.total_due || 0),
			discount_amount: Number(inv.discount_amount || 0),
			credit_applied: Number(inv.credit_applied || 0),
			cash_paid: Number(inv.cash_paid || 0),
			bank_paid: Number(inv.bank_paid || 0),
			debt_created: Number(inv.debt_created || 0),
			status: inv.status,
			notes: inv.notes,
			bank_account_id: inv.bank_account_id ?? null,
			bank_account_name: inv.bank_account_name ?? inv.bank_name ?? null,
			bank_name: inv.bank_account_name ?? inv.bank_name ?? null,
			package_name: inv.package_name ?? null,
			items: (inv.items || []).map((item: any) => ({
				id: item.id,
				product_name: item.product_name,
				quantity: item.quantity,
				price_per_unit: Number(item.price_per_unit || 0),
				total_price: Number(item.total_price || 0),
			})),
		}));

		// 6. Aggregate Totals Summary
		const totalCash = invoices.reduce(
			(sum: number, inv: { cash_paid: number }) => sum + inv.cash_paid,
			0,
		);
		const totalBank = invoices.reduce(
			(sum: number, inv: { bank_paid: number }) => sum + inv.bank_paid,
			0,
		);

		// Aggregate bank breakdown (amount transferred per bank)
		const banksBreakdown: Record<string, number> = {};
		invoices.forEach(
			(inv: { bank_paid: number; bank_account_name: string | null }) => {
				if (inv.bank_paid > 0) {
					const bankLabel = inv.bank_account_name || "غير محدد";
					banksBreakdown[bankLabel] = Number(
						((banksBreakdown[bankLabel] || 0) + inv.bank_paid).toFixed(2),
					);
				}
			},
		);

		const summary = {
			total_revenue: invoices.reduce(
				(sum: number, inv: { total_due: number }) => sum + inv.total_due,
				0,
			),
			total_paid: Number((totalCash + totalBank).toFixed(2)),
			total_cash: Number(totalCash.toFixed(2)),
			total_bank: Number(totalBank.toFixed(2)),
			banks_breakdown: banksBreakdown,
			total_debt: invoices.reduce(
				(sum: number, inv: { debt_created: number }) => sum + inv.debt_created,
				0,
			),
			total_sessions: invoices.reduce(
				(sum: number, inv: { session_amount: number }) =>
					sum + inv.session_amount,
				0,
			),
			total_products: invoices.reduce(
				(sum: number, inv: { products_amount: number }) =>
					sum + inv.products_amount,
				0,
			),
		};

		return NextResponse.json({
			success: true,
			date: targetDate,
			count: invoices.length,
			summary,
			invoices,
		});
	} catch (err: unknown) {
		return NextResponse.json(
			{
				success: false,
				error: (err as Error).message || "Internal server error",
			},
			{ status: 500 },
		);
	}
}
