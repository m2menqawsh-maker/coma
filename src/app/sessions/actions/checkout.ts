import { calculateInvoiceTotals } from "@/lib/finance/invoices";
import type {
	Customer,
	Device,
	PricingConfig,
	Session,
	SessionDeviceChange,
	SessionOrder,
} from "../types";
import { fmt, formatDeviceHistory } from "../utils";

export async function processSingleCheckout(
	supabase: any,
	params: {
		session: Session;
		customer: Customer | null;
		deviceChanges: SessionDeviceChange[];
		pricing: PricingConfig;
		orders: SessionOrder[];
		initialDev: Device;
		sessionAmount: number;
		ordersTotal: number;
		discount: number;
		creditApplied: number;
		placeCost: number;
		productsCost: number;
		totalCost: number;
		cash: number;
		bank: number;
		bankAccountId: string | null;
		notes: string;
		grossProfit: number;
		devCut: number;
		netProfit: number;
		totalDue: number;
		debtCreated: number;
		overpaidRaw: number;
		debtClearedByOverpay: number;
		packageId?: string | null;
		extraHoursMethod?: string | null;
		packageAmount?: number;
		activeSubscription?: any;
		subHoursCovered?: number;
		subDrinksCovered?: number;
		subDetails?: any[];
		subExtraHours?: number;
		subExtraSessionMethod?: "charge" | "forgive" | "deduct_future";
		subExtraSessionDate?: string;
	},
) {
	const {
		session,
		customer,
		deviceChanges,
		pricing,
		orders,
		initialDev,
		sessionAmount,
		ordersTotal,
		discount,
		creditApplied,
		placeCost,
		productsCost,
		totalCost,
		cash,
		bank,
		bankAccountId,
		notes,
		grossProfit,
		devCut,
		netProfit,
		totalDue,
		debtCreated,
		overpaidRaw,
		debtClearedByOverpay,
		packageId,
		extraHoursMethod,
		packageAmount,
		activeSubscription,
		subHoursCovered,
		subDrinksCovered,
		subDetails,
		subExtraHours,
		subExtraSessionMethod,
		subExtraSessionDate,
	} = params;

	const overpaid = overpaidRaw - debtClearedByOverpay;
	const durationHours =
		(Date.now() - new Date(session.start_time).getTime()) / 3600000;
	const historyText = formatDeviceHistory(session, deviceChanges);
	const finalNotes = notes
		? notes + (historyText ? `\n${historyText}` : "")
		: historyText || null;

	const { data: invoice, error: invoiceError } = await supabase
		.from("invoices")
		.insert({
			session_id: session.id,
			customer_id: session.customer_id || null,
			customer_name: session.customer_name,
			session_start: session.start_time,
			session_end: new Date().toISOString(),
			duration_minutes: Math.floor(durationHours * 60),
			device: session.device,
			hourly_rate_snapshot:
				session.device === "mobile" ? pricing.mobile_rate : pricing.laptop_rate,
			place_cost_rate_snap:
				initialDev === "mobile"
					? pricing.mobile_place_cost
					: pricing.laptop_place_cost,
			dev_percent_snapshot: pricing.dev_percent,
			session_amount: sessionAmount,
			products_amount: ordersTotal,
			total_amount: sessionAmount + ordersTotal,
			discount_amount: discount,
			total_due: totalDue,
			place_cost: placeCost,
			products_cost: productsCost,
			total_cost: totalCost,
			gross_profit: grossProfit,
			dev_cut: devCut,
			net_profit: netProfit,
			cash_paid: cash,
			bank_paid: bank,
			bank_account_id: bankAccountId,
			credit_applied: creditApplied,
			debt_created: debtCreated,
			status: debtCreated > 0 ? "debt" : "paid",
			notes: finalNotes,
			closed_by: (await supabase.auth.getUser()).data.user?.id,
			package_id: packageId || null,
			final_calculation_snapshot: packageId
				? {
						package_amount: packageAmount,
						extra_hours_method: extraHoursMethod,
						session_amount: sessionAmount,
						orders_total: ordersTotal,
				  }
				: null,
		})
		.select()
		.single();

	if (invoiceError)
		throw new Error(`فشل إنشاء الفاتورة: ${invoiceError.message}`);

	if (invoice && orders.length > 0) {
		await supabase.from("invoice_items").insert(
			orders.map((o) => ({
				invoice_id: invoice.id,
				product_id: o.product_id,
				product_name: o.product_name,
				size: o.size,
				quantity: o.quantity,
				price_per_unit: o.price_per_unit,
				cost_per_unit: o.cost_per_unit,
				total_price: o.price_per_unit * o.quantity,
				total_cost: o.cost_per_unit * o.quantity,
			})),
		);
	}

	if (activeSubscription && !packageId && (subHoursCovered! > 0 || subDrinksCovered! > 0 || (subExtraHours! > 0 && subExtraSessionMethod === "deduct_future"))) {
		// Record current session usage
		if (subHoursCovered! > 0 || subDrinksCovered! > 0) {
			await supabase.from("subscription_usage").insert([{
				subscription_id: activeSubscription.id,
				invoice_id: invoice.id,
				date: new Date().toISOString().split("T")[0],
				hours_used: subHoursCovered,
				drinks_used: subDrinksCovered,
				drinks_details: subDetails && subDetails.length > 0 ? subDetails : null
			}]);
		}
		
		// Record future usage if selected
		if (subExtraHours! > 0 && subExtraSessionMethod === "deduct_future" && subExtraSessionDate) {
			await supabase.from("subscription_usage").insert([{
				subscription_id: activeSubscription.id,
				invoice_id: invoice.id,
				date: subExtraSessionDate,
				hours_used: subExtraHours,
				drinks_used: 0,
				drinks_details: null,
				notes: "تسوية ساعات إضافية من جلسة سابقة"
			}]);
		}
	}

	if (session.customer_id && customer) {
		const newBalance =
			(customer.balance || 0) - (creditApplied || 0) - (debtCreated || 0) + (overpaidRaw || 0);

		await supabase
			.from("customers")
			.update({
				balance: newBalance,
				last_visit_at: new Date().toISOString(),
			})
			.eq("id", session.customer_id);

		if (debtClearedByOverpay > 0) {
			const { data: oldInvoices } = await supabase
				.from("invoices")
				.select("id, debt_created")
				.eq("customer_id", session.customer_id)
				.in("status", ["debt", "partial"])
				.gt("debt_created", 0)
				.order("session_end", { ascending: true });

			if (oldInvoices && oldInvoices.length > 0) {
				let remaining = debtClearedByOverpay;
				for (const oldInv of oldInvoices) {
					if (remaining <= 0) break;
					const cleared = Math.min(remaining, oldInv.debt_created);
					const newDebt =
						Math.round((oldInv.debt_created - cleared) * 100) / 100;
					const newStatus = newDebt <= 0 ? "cleared" : "partial";
					await supabase
						.from("invoices")
						.update({ debt_created: newDebt, status: newStatus })
						.eq("id", oldInv.id);
					remaining -= cleared;
				}
			}
		}

		const netChange = overpaidRaw - debtCreated - creditApplied;
		if (netChange !== 0 && invoice) {
			await supabase.from("customer_debt_payments").insert({
				customer_id: session.customer_id,
				invoice_id: invoice.id,
				amount: Math.abs(netChange),
				channel: bank > 0 ? "bank" : "cash",
				bank_account_id: bank > 0 ? bankAccountId : null,
				date: new Date().toISOString().split("T")[0],
				note:
					netChange < 0
						? `دين جديد ₪${fmt(Math.abs(netChange))} — ${session.customer_name}`
						: `رصيد دائن ₪${fmt(netChange)} — ${session.customer_name}`,
			});
		}
	}

	if (bank > 0 && invoice) {
		const { error: transferError } = await supabase
			.from("bank_transfers")
			.insert({
				date: new Date().toISOString().split("T")[0],
				bank_account_id: bankAccountId,
				amount: bank,
				direction: "in",
				status: "pending",
				description: `حوالة من ${session.customer_name}`,
				sender_name: session.customer_name,
				sender_phone: customer?.phone || null,
				invoice_id: invoice.id,
				reference_type: "invoice",
			});
		if (transferError)
			console.error(
				`تحذير: فشل تسجيل الحوالة البنكية — ${transferError.message}`,
			);
	}

	if (invoice && deviceChanges.length > 0) {
		await supabase
			.from("session_device_changes")
			.update({ invoice_id: invoice.id })
			.eq("session_id", session.id);
	}

	await supabase.from("sessions").delete().eq("id", session.id);

	return {
		overpaid,
		debtCreated,
		debtClearedByOverpay,
		newBalanceFinal:
			(customer?.balance || 0) - creditApplied - debtCreated + overpaidRaw,
		invoiceId: invoice?.id || null,
	};
}

export async function processGroupCheckout(
	supabase: any,
	params: {
		groupSelected: string[];
		groupPrimaryId: string;
		selectedSessions: Session[];
		sessionAmounts: {
			session: Session;
			changes: SessionDeviceChange[];
			initialDev: Device;
			sessionAmt: number;
			ordersAmt: number;
		}[];
		orders: Record<string, SessionOrder[]>;
		pricing: PricingConfig;
		primaryCustomer: Customer | null;
		discount: number;
		creditApplied: number;
		cash: number;
		bank: number;
		bankAccountId: string | null;
		notes: string;
		debtCreated: number;
		overpaidRaw: number;
		totalPaid: number;
	},
) {
	const {
		groupSelected,
		groupPrimaryId,
		selectedSessions,
		sessionAmounts,
		orders,
		pricing,
		primaryCustomer,
		discount,
		creditApplied,
		cash,
		bank,
		bankAccountId,
		notes,
		debtCreated,
		overpaidRaw,
		totalPaid,
	} = params;

	const primarySession = selectedSessions.find((s) => s.id === groupPrimaryId)!;
	const today = new Date().toISOString().split("T")[0];
	const now = new Date().toISOString();

	for (const {
		session,
		changes,
		initialDev,
		sessionAmt,
		ordersAmt,
	} of sessionAmounts) {
		const isPrimary = session.id === groupPrimaryId;
		const sessionOrders = orders[session.id] || [];
		const durationHours =
			(Date.now() - new Date(session.start_time).getTime()) / 3600000;
		const placeCost =
			initialDev === "mobile"
				? pricing.mobile_place_cost * durationHours
				: pricing.laptop_place_cost * durationHours;
		const productsCost = sessionOrders.reduce(
			(s: number, o: SessionOrder) => s + o.cost_per_unit * o.quantity,
			0,
		);
		const sessionTotalCost = placeCost + productsCost;

		const invoiceDiscount = isPrimary ? discount : 0;
		const invoiceCredit = isPrimary ? creditApplied : 0;

		const invTotals = calculateInvoiceTotals({
			sessionAmount: sessionAmt,
			ordersTotal: ordersAmt,
			discount: invoiceDiscount,
			creditApplied: invoiceCredit,
			totalPaid: isPrimary ? totalPaid : 0,
			totalCost: sessionTotalCost,
		});

		const devCut =
			Math.round(invTotals.grossProfit * (pricing.dev_percent / 100) * 100) /
			100;
		const netProfit = invTotals.grossProfit - devCut;

		const historyText = formatDeviceHistory(session, changes);
		const finalNotes = `فاتورة جماعية — ${groupSelected.length} جلسات${notes ? ` — ${notes}` : ""}${historyText ? `\n${historyText}` : ""}`;

		const { data: invoice } = await supabase
			.from("invoices")
			.insert({
				session_id: session.id,
				customer_id: session.customer_id || null,
				customer_name: session.customer_name,
				session_start: session.start_time,
				session_end: now,
				duration_minutes: Math.floor(durationHours * 60),
				device: session.device,
				hourly_rate_snapshot:
					session.device === "mobile"
						? pricing.mobile_rate
						: pricing.laptop_rate,
				place_cost_rate_snap:
					initialDev === "mobile"
						? pricing.mobile_place_cost
						: pricing.laptop_place_cost,
				dev_percent_snapshot: pricing.dev_percent,
				session_amount: sessionAmt,
				products_amount: ordersAmt,
				total_amount: invTotals.totalAmount,
				discount_amount: invoiceDiscount,
				total_due: invTotals.totalDue,
				place_cost: placeCost,
				products_cost: productsCost,
				total_cost: sessionTotalCost,
				gross_profit: invTotals.grossProfit,
				dev_cut: devCut,
				net_profit: netProfit,
				cash_paid: isPrimary ? cash : 0,
				bank_paid: isPrimary ? bank : 0,
				bank_account_id: isPrimary && bank > 0 ? bankAccountId : null,
				credit_applied: invoiceCredit,
				debt_created: isPrimary ? debtCreated : 0,
				status: isPrimary ? (debtCreated > 0 ? "debt" : "paid") : "paid",
				notes: finalNotes,
			})
			.select()
			.single();

		if (invoice && sessionOrders.length > 0) {
			await supabase.from("invoice_items").insert(
				sessionOrders.map((o: SessionOrder) => ({
					invoice_id: invoice.id,
					product_name: o.product_name,
					size: o.size,
					quantity: o.quantity,
					price_per_unit: o.price_per_unit,
					cost_per_unit: o.cost_per_unit,
					total_price: o.price_per_unit * o.quantity,
					total_cost: o.cost_per_unit * o.quantity,
				})),
			);
		}

		if (isPrimary && bank > 0 && invoice) {
			await supabase.from("bank_transfers").insert({
				date: today,
				bank_account_id: bankAccountId,
				amount: bank,
				direction: "in",
				status: "pending",
				description: `حوالة جماعية — ${primarySession.customer_name} (${groupSelected.length} جلسات)`,
				sender_name: primarySession.customer_name,
				invoice_id: invoice.id,
				reference_type: "invoice",
			});
		}

		if (invoice && changes.length > 0) {
			await supabase
				.from("session_device_changes")
				.update({ invoice_id: invoice.id })
				.eq("session_id", session.id);
		}
	}

	if (primarySession.customer_id) {
		const currentBalance = primaryCustomer?.balance || 0;
		const newBalance =
			currentBalance - creditApplied - debtCreated + overpaidRaw;
		await supabase
			.from("customers")
			.update({ balance: newBalance, last_visit_at: now })
			.eq("id", primarySession.customer_id);

		const netChange = overpaidRaw - debtCreated - creditApplied;
		if (netChange !== 0) {
			const primaryInvoiceRes = await supabase
				.from("invoices")
				.select("id")
				.eq("session_id", primarySession.id)
				.single();
			await supabase.from("customer_debt_payments").insert({
				customer_id: primarySession.customer_id,
				invoice_id: primaryInvoiceRes.data?.id || null,
				amount: Math.abs(netChange),
				channel: bank > 0 ? "bank" : "cash",
				bank_account_id: bank > 0 ? bankAccountId : null,
				date: today,
				note:
					netChange < 0
						? `دين جماعي جديد ₪${fmt(Math.abs(netChange))} — ${primarySession.customer_name}`
						: `رصيد دائن جماعي ₪${fmt(netChange)} — ${primarySession.customer_name}`,
			});
		}
	}

	for (const id of groupSelected) {
		await supabase.from("sessions").delete().eq("id", id);
	}
}
