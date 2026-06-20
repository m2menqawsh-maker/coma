"use client";

import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import DailyTab from "./components/DailyTab";
import ProfitTab from "./components/ProfitTab";
import SummaryTab from "./components/SummaryTab";
import FinanceTab from "./components/FinanceTab";

const supabase = createClient();

interface Invoice {
	id: string;
	session_end: string;
	device: "mobile" | "laptop";
	duration_minutes: number;
	session_amount: number;
	products_amount: number;
	total_due: number;
	place_cost: number;
	products_cost: number;
	gross_profit: number;
	net_profit: number;
	cash_paid: number;
	bank_paid: number;
	debt_created: number;
	status: string;
	invoice_items?: {
		id: string;
		product_name: string;
		quantity: number;
		total_price: number;
	}[];
}

interface Expense {
	id: string;
	date: string;
	name: string;
	cash_amount: number;
	bank_amount: number;
	expense_type: string;
}

interface Partner {
	id: string;
	name: string;
	share_percent: number;
}

type TabType = "summary" | "daily" | "profit" | "finance";

const fmt = (n: unknown) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n) || 0);

const currentMonth = () => new Date().toISOString().slice(0, 7);

const daysInMonth = (ym: string) => {
	const [y, m] = ym.split("-").map(Number);
	const count = new Date(y, m, 0).getDate();
	return Array.from({ length: count }, (_, i) => {
		const d = String(i + 1).padStart(2, "0");
		return `${ym}-${d}`;
	});
};

const EXPENSE_TYPE_LABELS: Record<string, string> = {
	fixed: "ثابت",
	one_time: "طارئ",
	purchase: "مشتريات",
	loan_repayment: "سداد قرض",
};

const EXPENSE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
	fixed: { bg: "bg-red-400/10", text: "text-red-400" },
	one_time: { bg: "bg-orange-400/10", text: "text-orange-400" },
	purchase: { bg: "bg-amber-400/10", text: "text-amber-400" },
	loan_repayment: { bg: "bg-purple-400/10", text: "text-purple-400" },
};

export default function ReportsPage() {
	const [tab, setTab] = useState<TabType>("summary");
	const [monthFilter, setMonthFilter] = useState(currentMonth());
	const [loading, setLoading] = useState(true);

	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [partners, setPartners] = useState<Partner[]>([]);
	const [allNetProfit, setAllNetProfit] = useState(0);

	const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
	const [customersWithDebt, setCustomersWithDebt] = useState<any[]>([]);
	const [activeLoans, setActiveLoans] = useState<any[]>([]);

	const loadData = useCallback(async () => {
		setLoading(true);
		const from = `${monthFilter}-01`;
		const to = `${monthFilter}-31`;

		const [
			{ data: inv },
			{ data: exp },
			{ data: par },
			{ data: allInv },
			{ data: ledg },
			{ data: cust },
			{ data: loan },
		] = await Promise.all([
			supabase
				.from("invoices")
				.select("*, invoice_items(*)")
				.gte("session_end", from)
				.lte("session_end", `${to}T23:59:59`)
				.order("session_end", { ascending: true }),
			supabase
				.from("expenses")
				.select("*")
				.gte("date", from)
				.lte("date", to)
				.order("date", { ascending: true }),
			supabase
				.from("partners")
				.select("*")
				.eq("is_active", true)
				.order("share_percent", { ascending: false }),
			supabase.from("invoices").select("net_profit"),
			supabase
				.from("ledger_entries")
				.select("*")
				.gte("date", from)
				.lte("date", to)
				.order("date", { ascending: true }),
			supabase
				.from("customers")
				.select("*")
				.lt("balance", 0)
				.order("balance", { ascending: true }),
			supabase
				.from("loans")
				.select("*, loan_payments(*)")
				.eq("status", "active")
				.order("created_at", { ascending: false }),
		]);

		setInvoices((inv as Invoice[]) || []);
		setExpenses((exp as Expense[]) || []);
		setPartners((par as Partner[]) || []);
		const total = (allInv || []).reduce((s: number, i: any) => s + (i.net_profit || 0), 0);
		setAllNetProfit(total);

		setLedgerEntries(ledg || []);
		setCustomersWithDebt(cust || []);
		setActiveLoans(loan || []);

		setLoading(false);
	}, [monthFilter]);

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	// ── Computed ──────────────────────────────────────────────────────────
	const totalRevenue = invoices.reduce((s, i) => s + i.total_due, 0);
	const totalSessionRev = invoices.reduce((s, i) => s + i.session_amount, 0);
	const totalProductRev = invoices.reduce((s, i) => s + i.products_amount, 0);
	const totalCash = invoices.reduce((s, i) => s + i.cash_paid, 0);
	const totalBank = invoices.reduce((s, i) => s + i.bank_paid, 0);
	const totalDebt = invoices.reduce((s, i) => s + i.debt_created, 0);
	const totalGrossProfit = invoices.reduce((s, i) => s + i.gross_profit, 0);
	const totalNetProfit = invoices.reduce((s, i) => s + i.net_profit, 0);
	const totalPlaceCost = invoices.reduce((s, i) => s + i.place_cost, 0);
	const totalProductsCost = invoices.reduce((s, i) => s + i.products_cost, 0);
	const totalCOGS = totalPlaceCost + totalProductsCost;

	const totalExpenses = expenses.reduce(
		(s, e) => s + e.cash_amount + e.bank_amount,
		0,
	);
	const totalSessions = invoices.length;
	const avgInvoice = totalSessions ? totalRevenue / totalSessions : 0;
	const avgDuration = totalSessions
		? invoices.reduce((s, i) => s + i.duration_minutes, 0) / totalSessions
		: 0;

	const mobileCount = invoices.filter((i) => i.device === "mobile").length;
	const laptopCount = invoices.filter((i) => i.device === "laptop").length;
	const mobileRev = invoices
		.filter((i) => i.device === "mobile")
		.reduce((s, i) => s + i.total_due, 0);
	const laptopRev = invoices
		.filter((i) => i.device === "laptop")
		.reduce((s, i) => s + i.total_due, 0);

	// Expense breakdown by type
	const expByType = Object.entries(EXPENSE_TYPE_LABELS)
		.map(([type, label]) => ({
			type,
			label,
			total: expenses
				.filter((e) => e.expense_type === type)
				.reduce((s, e) => s + e.cash_amount + e.bank_amount, 0),
		}))
		.filter((x) => x.total > 0);

	// Daily data
	const days = daysInMonth(monthFilter);
	const dailyData = days
		.map((day) => {
			const dayInv = invoices.filter((i) => i.session_end.startsWith(day));
			const dayExp = expenses.filter((e) => e.date === day);
			return {
				day,
				label: new Date(`${day}T12:00:00`).toLocaleDateString("ar-IL", {
					day: "numeric",
				}),
				revenue: dayInv.reduce((s, i) => s + i.total_due, 0),
				netProfit: dayInv.reduce((s, i) => s + i.net_profit, 0),
				expenses: dayExp.reduce((s, e) => s + e.cash_amount + e.bank_amount, 0),
				sessions: dayInv.length,
			};
		})
		.filter((d) => d.revenue > 0 || d.expenses > 0);

	// Busy hours calculation
	const hourCounts: Record<string, { count: number; rev: number }> = {};
	for (let i = 0; i < 24; i++) {
		hourCounts[`${String(i).padStart(2, "0")}:00`] = { count: 0, rev: 0 };
	}

	invoices.forEach((inv) => {
		if (inv.session_end) {
			const dateObj = new Date(inv.session_end);
			const hourStr = `${String(dateObj.getHours()).padStart(2, "0")}:00`;
			if (hourCounts[hourStr] !== undefined) {
				hourCounts[hourStr].count++;
				hourCounts[hourStr].rev += inv.total_due || 0;
			}
		}
	});

	const busyHoursData = Object.keys(hourCounts)
		.sort()
		.map((hour) => ({ hour, ...hourCounts[hour] }));

	// Partner distribution from THIS month's profit
	const partnerDist = partners.map((p) => ({
		...p,
		share: totalNetProfit * (p.share_percent / 100),
		allTimeShare: allNetProfit * (p.share_percent / 100),
	}));

	// ── Styles ────────────────────────────────────────────────────────────

	return (
		<AppLayout>
			<div className="p-7 max-w-[1100px] w-full">
				{/* Header */}
				<div className="flex justify-between items-center mb-6 flex-wrap gap-3">
					<div>
						<h1 className="text-xl font-bold text-[#f0f0f8] mb-1">التقارير</h1>
						<p className="text-[13px] text-[#6b6b8a]">
							تحليل الأداء المالي والتشغيلي
						</p>
					</div>
					<input
						type="month"
						dir="ltr"
						value={monthFilter}
						onChange={(e) => setMonthFilter(e.target.value)}
						className="bg-[#111118] border-[1.5px] border-[#2a2a3e] rounded-lg py-2 px-3.5 text-[13px] text-[#e8e8f5] outline-none cursor-pointer focus:border-indigo-400/50 transition-colors"
					/>
				</div>

				{/* Tabs */}
				<div className="flex gap-2 mb-6 flex-wrap">
					<button
						className={`py-2 px-5 rounded-lg text-[13px] transition-all duration-150 border-[1.5px] ${tab === "summary"
								? "border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-violet-500/15 text-indigo-400 font-bold"
								: "border-white/5 bg-[#111118] text-[#6b6b8a] font-normal hover:bg-white/5"
							}`}
						onClick={() => setTab("summary")}
					>
						ملخص الشهر
					</button>
					<button
						className={`py-2 px-5 rounded-lg text-[13px] transition-all duration-150 border-[1.5px] ${tab === "daily"
								? "border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-violet-500/15 text-indigo-400 font-bold"
								: "border-white/5 bg-[#111118] text-[#6b6b8a] font-normal hover:bg-white/5"
							}`}
						onClick={() => setTab("daily")}
					>
						التحليل اليومي
					</button>
					<button
						className={`py-2 px-5 rounded-lg text-[13px] transition-all duration-150 border-[1.5px] ${tab === "profit"
								? "border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-violet-500/15 text-indigo-400 font-bold"
								: "border-white/5 bg-[#111118] text-[#6b6b8a] font-normal hover:bg-white/5"
							}`}
						onClick={() => setTab("profit")}
					>
						توزيع الأرباح
					</button>
					<button
						className={`py-2 px-5 rounded-lg text-[13px] transition-all duration-150 border-[1.5px] ${tab === "finance"
								? "border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-violet-500/15 text-indigo-400 font-bold"
								: "border-white/5 bg-[#111118] text-[#6b6b8a] font-normal hover:bg-white/5"
							}`}
						onClick={() => setTab("finance")}
					>
						التحليل المالي والديون
					</button>
				</div>

				{loading ? (
					<div className="text-center py-20 px-5 text-[#6b6b8a]">
						جاري تحميل البيانات...
					</div>
				) : (
					<>
						{tab === "summary" && (
							<SummaryTab
								totalRevenue={totalRevenue}
								totalSessions={totalSessions}
								totalGrossProfit={totalGrossProfit}
								totalNetProfit={totalNetProfit}
								totalExpenses={totalExpenses}
								expByType={expByType}
								totalSessionRev={totalSessionRev}
								totalProductRev={totalProductRev}
								avgInvoice={avgInvoice}
								avgDuration={avgDuration}
								totalCash={totalCash}
								totalBank={totalBank}
								totalDebt={totalDebt}
								mobileCount={mobileCount}
								laptopCount={laptopCount}
								mobileRev={mobileRev}
								laptopRev={laptopRev}
								totalPlaceCost={totalPlaceCost}
								totalProductsCost={totalProductsCost}
								totalCOGS={totalCOGS}
								fmt={fmt}
								EXPENSE_TYPE_COLORS={EXPENSE_TYPE_COLORS}
								hasInvoices={invoices.length > 0}
								invoices={invoices}
							/>
						)}

						{tab === "daily" && (
							<DailyTab
								dailyData={dailyData}
								busyHoursData={busyHoursData}
								fmt={fmt}
							/>
						)}

						{tab === "profit" && (
							<ProfitTab
								partners={partners}
								totalNetProfit={totalNetProfit}
								partnerDist={partnerDist}
								fmt={fmt}
							/>
						)}

						{tab === "finance" && (
							<FinanceTab
								ledgerEntries={ledgerEntries}
								customersWithDebt={customersWithDebt}
								activeLoans={activeLoans}
								fmt={fmt}
								days={days}
							/>
						)}
					</>
				)}
			</div>
		</AppLayout>
	);
}
