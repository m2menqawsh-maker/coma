"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { PricingConfig, SessionDeviceChange } from "@/app/sessions/types";
import AppLayout from "@/components/AppLayout";
import DashboardChart from "@/components/DashboardChart";
// Import dashboard components
import ActiveSessionsList from "@/components/dashboard/ActiveSessionsList";
import BankAccountsList from "@/components/dashboard/BankAccountsList";
import DashboardStatsCards from "@/components/dashboard/DashboardStatsCards";
import LowStockList from "@/components/dashboard/LowStockList";
import TodayCollection from "@/components/dashboard/TodayCollection";
import TodayInvoicesTable from "@/components/dashboard/TodayInvoicesTable";
import TopDebtorsList from "@/components/dashboard/TopDebtorsList";
import LoadingSpinner from "@/components/LoadingSpinner";
import { calcSessionAmount } from "@/lib/finance/sessions";
import { createClient } from "@/lib/supabase/client";

interface ActiveSession {
	id: string;
	customer_name: string;
	device: "mobile" | "laptop";
	start_time: string;
}

interface TodayInvoice {
	id: string;
	total_due: number;
	net_profit: number;
	cash_paid: number;
	bank_paid: number;
	debt_created: number;
	session_end: string;
}

interface LowStockItem {
	id: string;
	name: string;
	qty: number;
	low_stock_threshold: number;
	unit: string | null;
}

interface DebtCustomer {
	id: string;
	name: string;
	balance: number;
}

interface BankBalance {
	id: string;
	name: string;
	balance: number;
}

const fmt = (n: unknown) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n) || 0);

function calcDuration(startTime: string): string {
	const diff = Date.now() - new Date(startTime).getTime();
	const mins = Math.floor(diff / 60000);
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	return h > 0 ? `${h}س ${m}د` : `${m}د`;
}

function getGreeting(): string {
	const h = new Date().getHours();
	if (h < 12) return "صباح الخير";
	if (h < 17) return "مساء الخير";
	return "مساء النور";
}

export default function HomePage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);

	const [role, setRole] = useState<"admin" | "partner" | "viewer" | null>(null);
	const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
	const [activeDeviceChanges, setActiveDeviceChanges] = useState<
		SessionDeviceChange[]
	>([]);
	const [todayInvoices, setTodayInvoices] = useState<TodayInvoice[]>([]);
	const [pricing, setPricing] = useState<PricingConfig>({
		mobile_rate: 3,
		laptop_rate: 5,
		mobile_place_cost: 0,
		laptop_place_cost: 0,
		dev_percent: 50,
	});
	const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
	const [debtCustomers, setDebtCustomers] = useState<DebtCustomer[]>([]);
	const [cashBalance, setCashBalance] = useState(0);
	const [bankBalances, setBankBalances] = useState<BankBalance[]>([]);
	const [chartData, setChartData] = useState<
		{ date: string; revenue: number }[]
	>([]);
	const [monthNetProfit, setMonthNetProfit] = useState(0);

	const loadData = useCallback(async () => {
		const supabase = createClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session?.user) {
			const _hasLocalToken =
				typeof window !== "undefined" &&
				Object.keys(localStorage).some(
					(k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
				);
			router.push("/login");
			return;
		}

		const today = new Date().toISOString().split("T")[0];
		const monthStart = `${today.slice(0, 7)}-01`;
		const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0];

		const [
			{ data: sessions },
			{ data: deviceChanges },
			{ data: invoices },
			{ data: pricingData },
			{ data: inventory },
			{ data: debts },
			{ data: cash },
			{ data: bank },
			{ data: monthInv },
			userResp,
		] = await Promise.all([
			supabase
				.from("sessions")
				.select("id, customer_name, device, start_time")
				.order("start_time", { ascending: false }),
			supabase
				.from("session_device_changes")
				.select("*")
				.is("invoice_id", null),
			supabase
				.from("invoices")
				.select(
					"id, total_due, net_profit, cash_paid, bank_paid, debt_created, session_end",
				)
				.gte("session_end", sevenDaysAgo)
				.order("session_end", { ascending: false }),
			supabase
				.from("pricing_config")
				.select("mobile_rate, laptop_rate")
				.order("effective_from", { ascending: false })
				.limit(1),
			supabase
				.from("inventory_items")
				.select("id, name, qty, low_stock_threshold, unit")
				.eq("is_active", true),
			supabase
				.from("customers")
				.select("id, name, balance")
				.lt("balance", 0)
				.order("balance", { ascending: true })
				.limit(5),
			supabase.from("cash_balance").select("balance").single(),
			supabase.from("bank_balance_by_account").select("id, name, balance"),
			supabase
				.from("invoices")
				.select("net_profit")
				.gte("session_end", monthStart),
			session?.user
				? supabase
						.from("user_profiles")
						.select("role")
						.eq("id", session.user.id)
						.single()
				: { data: null },
		]);

		setActiveSessions((sessions as ActiveSession[]) || []);
		setActiveDeviceChanges(deviceChanges || []);

		const allRecentInvoices = (invoices as TodayInvoice[]) || [];
		setTodayInvoices(allRecentInvoices.filter((i) => i.session_end >= today));

		const cData = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const dStr = d.toISOString().split("T")[0];
			const dayName = d.toLocaleDateString("ar-IL", { weekday: "short" });
			const dayRev = allRecentInvoices
				.filter((inv) => inv.session_end.startsWith(dStr))
				.reduce((sum, inv) => sum + inv.total_due, 0);
			cData.push({ date: dayName, revenue: dayRev });
		}
		setChartData(cData);

		if (pricingData?.[0]) setPricing(pricingData[0] as PricingConfig);

		const lowItems = ((inventory as LowStockItem[]) || []).filter(
			(i) => i.low_stock_threshold !== null && i.qty <= i.low_stock_threshold,
		);
		setLowStock(lowItems);
		setDebtCustomers((debts as DebtCustomer[]) || []);
		setCashBalance((cash as { balance: number })?.balance ?? 0);
		setBankBalances((bank as BankBalance[]) || []);
		setMonthNetProfit(
			((monthInv as { net_profit: number }[]) || []).reduce(
				(s, i) => s + (i.net_profit || 0),
				0,
			),
		);
		if (userResp?.data) {
			setRole(userResp.data.role as "admin" | "partner" | "viewer" | null);
		}
		setLoading(false);
	}, [router]);

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const todayRevenue = todayInvoices.reduce((s, i) => s + i.total_due, 0);
	const todayCash = todayInvoices.reduce((s, i) => s + i.cash_paid, 0);
	const todayBank = todayInvoices.reduce((s, i) => s + i.bank_paid, 0);
	const todayDebt = todayInvoices.reduce((s, i) => s + i.debt_created, 0);
	const todayProfit = todayInvoices.reduce((s, i) => s + i.net_profit, 0);
	const totalBankBal = bankBalances.reduce((s, b) => s + b.balance, 0);
	const liveRevenue = activeSessions.reduce((s, sess) => {
		const changes = activeDeviceChanges.filter((c) => c.session_id === sess.id);
		const initialDev =
			changes.length > 0
				? [...changes].sort(
						(a, b) =>
							new Date(a.changed_at).getTime() -
							new Date(b.changed_at).getTime(),
					)[0].from_device
				: sess.device;
		return (
			s +
			calcSessionAmount(
				sess.start_time,
				initialDev as "mobile" | "laptop",
				pricing,
				changes,
			)
		);
	}, 0);

	const navBtn = (label: string, href: string) => (
		<button
			onClick={() => router.push(href)}
			className="bg-transparent border-none text-indigo-400 text-xs font-semibold cursor-pointer hover:text-indigo-300 transition-colors"
		>
			{label} &larr;
		</button>
	);

	if (loading)
		return (
			<AppLayout>
				<LoadingSpinner />
			</AppLayout>
		);

	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1200px] mx-auto flex flex-col gap-5">
				{/* Header */}
				<div className="flex justify-between items-center flex-wrap gap-3">
					<div>
						<h1 className="text-2xl font-extrabold text-white mb-1">
							{getGreeting()} 👋
						</h1>
						<p className="text-[13px] text-zinc-400 font-medium">
							{new Date().toLocaleDateString("ar-IL", {
								weekday: "long",
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</p>
					</div>
					<button
						onClick={() => router.push("/sessions")}
						className="bg-gradient-to-br from-indigo-500 to-violet-600 border-none rounded-xl text-white px-[22px] py-[11px] text-sm font-bold cursor-pointer shadow-[0_6px_20px_rgba(79,110,247,0.3)] hover:opacity-90 transition-opacity"
					>
						+ جلسة جديدة
					</button>
				</div>

				{/* KPIs */}
				<DashboardStatsCards
					role={role}
					activeSessionsCount={activeSessions.length}
					liveRevenue={liveRevenue}
					todayRevenue={todayRevenue}
					todayInvoicesCount={todayInvoices.length}
					todayProfit={todayProfit}
					monthNetProfit={monthNetProfit}
					cashBalance={cashBalance}
					totalBankBal={totalBankBal}
					bankAccountsCount={bankBalances.length}
					fmt={fmt}
				/>

				<DashboardChart data={chartData} />

				{/* Main grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<ActiveSessionsList
						activeSessions={activeSessions}
						activeDeviceChanges={activeDeviceChanges}
						pricing={pricing}
						role={role}
						fmt={fmt}
						calcDuration={calcDuration}
						calcSessionAmount={calcSessionAmount}
						navBtn={navBtn}
					/>
					<TodayCollection
						todayCash={todayCash}
						todayBank={todayBank}
						todayDebt={todayDebt}
						todayRevenue={todayRevenue}
						fmt={fmt}
					/>
				</div>

				{/* Bottom row */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					{role !== "viewer" && (
						<BankAccountsList
							bankBalances={bankBalances}
							totalBankBal={totalBankBal}
							role={role}
							fmt={fmt}
							navBtn={navBtn}
						/>
					)}
					<LowStockList lowStock={lowStock} navBtn={navBtn} />
					{role !== "viewer" && (
						<TopDebtorsList
							debtCustomers={debtCustomers}
							role={role}
							fmt={fmt}
							navBtn={navBtn}
						/>
					)}
				</div>

				{/* Today invoices table */}
				{todayInvoices.length > 0 && (
					<TodayInvoicesTable
						todayInvoices={todayInvoices}
						role={role}
						fmt={fmt}
						navBtn={navBtn}
					/>
				)}
			</div>
		</AppLayout>
	);
}
