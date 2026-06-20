"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardChart from "@/components/DashboardChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import type {
	CustomerMovement,
	Invoice,
	InvoiceItem,
	InvoiceStatus,
} from "../types";
import { fmt } from "../utils";
import CrossPaymentModal from "./CrossPaymentModal";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import InvoicesFilters from "./InvoicesFilters";
import InvoicesSummaryCards from "./InvoicesSummaryCards";
import InvoicesTable from "./InvoicesTable";
import PayDebtModal from "./PayDebtModal";

const supabase = createClient();

export default function InvoicesTab() {
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loading, setLoading] = useState(true);

	// Modals state
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
	const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
	const [customerMovements, setCustomerMovements] = useState<
		CustomerMovement[]
	>([]);
	const [loadingItems, setLoadingItems] = useState(false);

	// Role
	const [role, setRole] = useState<"admin" | "partner" | "viewer" | null>(null);

	// Filters
	const [filterStatus, setFilterStatus] = useState<"all" | InvoiceStatus>(
		"all",
	);
	const [filterDevice, setFilterDevice] = useState<"all" | "mobile" | "laptop">(
		"all",
	);
	const [filterDateFrom, setFilterDateFrom] = useState("");
	const [filterDateTo, setFilterDateTo] = useState("");
	const [filterSearch, setFilterSearch] = useState("");

	// Debt payment
	const [showPayDebt, setShowPayDebt] = useState(false);
	const [payDebtInvoice, setPayDebtInvoice] = useState<Invoice | null>(null);
	const [payCustomerBalance, setPayCustomerBalance] = useState<number | null>(
		null,
	);
	const [bankAccounts, setBankAccounts] = useState<
		{ id: string; name: string }[]
	>([]);

	// Cross-customer payment
	const [showCrossPayment, setShowCrossPayment] = useState(false);
	const [crossTargetInvoice, setCrossTargetInvoice] = useState<Invoice | null>(
		null,
	);

	const loadData = useCallback(async () => {
		let query = supabase
			.from("invoices")
			.select("*, bank_accounts(name), packages(name)")
			.order("session_end", { ascending: false });

		if (filterStatus !== "all") query = query.eq("status", filterStatus);
		if (filterDevice !== "all") query = query.eq("device", filterDevice);
		if (filterDateFrom) query = query.gte("session_end", filterDateFrom);
		if (filterDateTo)
			query = query.lte("session_end", `${filterDateTo}T23:59:59`);
		if (filterSearch.trim())
			query = query.ilike("customer_name", `%${filterSearch.trim()}%`);

		const [
			{ data: invs, error: e1 },
			{ data: banks, error: e2 },
			{ data: userResp },
		] = await Promise.all([
			query,
			supabase
				.from("bank_accounts")
				.select("id, name")
				.eq("is_active", true)
				.order("name"),
			supabase.auth.getUser(),
		]);

		if (userResp?.user) {
			const { data } = await supabase
				.from("user_profiles")
				.select("role")
				.eq("id", userResp.user.id)
				.single();
			if (data) setRole(data.role as "admin" | "partner" | "viewer");
		}

		if (e1) {
			toast.error(`خطأ في تحميل الفواتير: ${e1.message}`);
			setLoading(false);
			return;
		}
		if (e2) toast.error(`خطأ في تحميل الحسابات البنكية: ${e2.message}`);

		setInvoices((invs as Invoice[]) || []);
		setBankAccounts(banks || []);
		setLoading(false);
	}, [filterStatus, filterDevice, filterDateFrom, filterDateTo, filterSearch]);

	useEffect(() => {
		loadData();
	}, []);

	const openInvoice = async (inv: Invoice) => {
		setSelectedInvoice(inv);
		setLoadingItems(true);

		const [{ data: items, error }, { data: movements }] = await Promise.all([
			supabase
				.from("invoice_items")
				.select("*")
				.eq("invoice_id", inv.id)
				.order("id"),
			inv.customer_id
				? supabase
						.from("customer_debt_payments")
						.select("*")
						.eq("customer_id", inv.customer_id)
						.order("created_at", { ascending: false })
						.limit(10)
				: Promise.resolve({ data: [] as CustomerMovement[] }),
		]);

		if (error) toast.error("خطأ في تحميل التفاصيل");

		setInvoiceItems((items as InvoiceItem[]) || []);
		setCustomerMovements((movements as CustomerMovement[]) || []);
		setLoadingItems(false);
	};

	const handlePayDebtSuccess = async (msg: string) => {
		toast.success(msg);
		setShowPayDebt(false);
		setPayDebtInvoice(null);
		setPayCustomerBalance(null);
		await loadData();
		if (
			selectedInvoice &&
			payDebtInvoice &&
			selectedInvoice.id === payDebtInvoice.id
		) {
			const { data: fresh } = await supabase
				.from("invoices")
				.select("*, bank_accounts(name), packages(name)")
				.eq("id", payDebtInvoice.id)
				.single();
			if (fresh) setSelectedInvoice(fresh as Invoice);
			if (payDebtInvoice.customer_id) {
				const { data: mvs } = await supabase
					.from("customer_debt_payments")
					.select("*")
					.eq("customer_id", payDebtInvoice.customer_id)
					.order("created_at", { ascending: false })
					.limit(10);
				setCustomerMovements((mvs as CustomerMovement[]) || []);
			}
		}
	};

	const handleCrossPaymentSuccess = async (msg: string) => {
		toast.success(msg);
		const crossInvoiceId = crossTargetInvoice?.id;
		const isOpenInView =
			crossInvoiceId && selectedInvoice?.id === crossInvoiceId;
		setShowCrossPayment(false);
		setCrossTargetInvoice(null);
		await loadData();
		if (isOpenInView && crossInvoiceId) {
			const { data: fresh } = await supabase
				.from("invoices")
				.select("*, bank_accounts(name), packages(name)")
				.eq("id", crossInvoiceId)
				.single();
			if (fresh) setSelectedInvoice(fresh as Invoice);
			const customerId = fresh ? (fresh as Invoice).customer_id : null;
			if (customerId) {
				const { data: mvs } = await supabase
					.from("customer_debt_payments")
					.select("*")
					.eq("customer_id", customerId)
					.order("created_at", { ascending: false })
					.limit(10);
				setCustomerMovements((mvs as CustomerMovement[]) || []);
			}
		}
	};

	const totalRevenue = invoices.reduce((s, i) => s + i.total_due, 0);
	const totalPaid = invoices.reduce((s, i) => s + i.cash_paid + i.bank_paid, 0);
	const totalDebt = invoices.reduce((s, i) => s + i.debt_created, 0);
	const totalProfit = invoices.reduce((s, i) => s + i.net_profit, 0);

	if (loading)
		return (
			<div className="p-10">
				<LoadingSpinner />
			</div>
		);

	return (
		<>
			{invoices.length > 0 && (
				<div className="mb-6">
					<DashboardChart
						data={invoices
							.slice(0, 14)
							.reverse()
							.map((inv: Invoice) => ({
								date: inv.created_at.substring(5, 10),
								revenue: inv.total_due,
							}))}
					/>
				</div>
			)}

			<InvoicesSummaryCards
				totalRevenue={totalRevenue}
				totalPaid={totalPaid}
				totalDebt={totalDebt}
				totalProfit={totalProfit}
				invoicesCount={invoices.length}
				role={role}
			/>

			<InvoicesFilters
				filterSearch={filterSearch}
				setFilterSearch={setFilterSearch}
				filterStatus={filterStatus}
				setFilterStatus={setFilterStatus}
				filterDevice={filterDevice}
				setFilterDevice={setFilterDevice}
				filterDateFrom={filterDateFrom}
				setFilterDateFrom={setFilterDateFrom}
				filterDateTo={filterDateTo}
				setFilterDateTo={setFilterDateTo}
				invoices={invoices}
			/>

			<InvoicesTable
				invoices={invoices}
				totalRevenue={totalRevenue}
				openInvoice={openInvoice}
				setPayDebtInvoice={setPayDebtInvoice}
				setPayCustomerBalance={setPayCustomerBalance}
				setShowPayDebt={setShowPayDebt}
				supabase={supabase}
			/>

			{selectedInvoice && (
				<InvoiceDetailsModal
					invoice={selectedInvoice}
					items={invoiceItems}
					movements={customerMovements}
					loadingItems={loadingItems}
					onClose={() => setSelectedInvoice(null)}
					role={role}
				/>
			)}

			{selectedInvoice &&
				!showPayDebt &&
				!showCrossPayment &&
				selectedInvoice.debt_created > 0 &&
				selectedInvoice.status !== "cleared" && (
					<div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] flex gap-2.5">
						<button
							className="py-2.5 px-4 rounded-lg text-white font-semibold border-none cursor-pointer bg-gradient-to-br from-red-600 to-red-700 shadow-[0_4px_20px_rgba(220,38,38,0.4)]"
							onClick={async () => {
								setPayDebtInvoice(selectedInvoice);
								setPayCustomerBalance(null);
								if (selectedInvoice.customer_id) {
									const { data } = await supabase
										.from("customers")
										.select("balance")
										.eq("id", selectedInvoice.customer_id)
										.single();
									setPayCustomerBalance(
										(data as { balance?: number } | null)?.balance ?? null,
									);
								}
								setShowPayDebt(true);
							}}
						>
							سداد الدين ₪{fmt(selectedInvoice.debt_created)}
						</button>
						<button
							className="py-2.5 px-4 rounded-lg text-white font-semibold border-none cursor-pointer bg-gradient-to-br from-violet-600 to-violet-900 text-xs shadow-[0_4px_20px_rgba(124,58,237,0.4)]"
							onClick={() => {
								setCrossTargetInvoice(selectedInvoice);
								setShowCrossPayment(true);
							}}
						>
							يسدد عنه زبون آخر
						</button>
					</div>
				)}

			{showPayDebt && payDebtInvoice && (
				<PayDebtModal
					invoice={payDebtInvoice}
					customerBalance={payCustomerBalance}
					bankAccounts={bankAccounts}
					onClose={() => setShowPayDebt(false)}
					onSuccess={handlePayDebtSuccess}
					onError={(msg) => toast.error(msg)}
				/>
			)}

			{showCrossPayment && crossTargetInvoice && (
				<CrossPaymentModal
					targetInvoice={crossTargetInvoice}
					bankAccounts={bankAccounts}
					onClose={() => setShowCrossPayment(false)}
					onSuccess={handleCrossPaymentSuccess}
					onError={(msg) => toast.error(msg)}
				/>
			)}
		</>
	);
}
