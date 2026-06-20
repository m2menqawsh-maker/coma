"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "@/components/AppLayout";
import DoubleConfirmModal from "@/components/DoubleConfirmModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import LedgerBalanceCards from "./components/LedgerBalanceCards";
import LedgerFilters from "./components/LedgerFilters";
import LedgerSummaryRow from "./components/LedgerSummaryRow";
import LedgerTable from "./components/LedgerTable";
import ManualEntryModal from "./components/ManualEntryModal";
import type {
	LedgerDirection,
	LedgerEntry,
	LedgerTxType,
	PaymentChannel,
} from "./types";

const supabase = createClient();

interface BankAccount {
	id: string;
	name: string;
}

interface CashBalance {
	balance: number;
}

interface BankBalance {
	id: string;
	name: string;
	account_type: string;
	balance: number;
}

const TX_TYPE_LABELS: Record<LedgerTxType, string> = {
	income_session: "إيراد جلسة",
	income_product: "إيراد منتج",
	debt_payment: "سداد دين عميل",
	debt_create: "دين عميل",
	expense_operational: "مصروف تشغيلي",
	expense_purchase: "مشتريات",
	loan_receipt: "استلام قرض",
	loan_repayment: "سداد قرض",
	partner_withdrawal: "سحب شريك",
	partner_deposit: "إيداع شريك",
	partner_loan: "سلفة شريك",
	partner_loan_payment: "سداد سلفة شريك",
	internal_transfer: "تحويل داخلي",
	opening_balance: "رصيد افتتاحي",
};

const TX_TYPE_COLORS: Record<LedgerTxType, { bg: string; text: string }> = {
	income_session: { bg: "bg-green-400/10", text: "text-green-400" },
	income_product: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
	debt_payment: { bg: "bg-blue-400/10", text: "text-blue-400" },
	debt_create: { bg: "bg-red-400/10", text: "text-red-400" },
	expense_operational: { bg: "bg-red-400/10", text: "text-red-400" },
	expense_purchase: { bg: "bg-orange-400/10", text: "text-orange-400" },
	loan_receipt: { bg: "bg-purple-400/10", text: "text-purple-400" },
	loan_repayment: { bg: "bg-red-400/10", text: "text-red-400" },
	partner_withdrawal: { bg: "bg-red-400/10", text: "text-red-400" },
	partner_deposit: { bg: "bg-green-400/10", text: "text-green-400" },
	partner_loan: { bg: "bg-pink-400/10", text: "text-pink-400" },
	partner_loan_payment: { bg: "bg-teal-400/10", text: "text-teal-400" },
	internal_transfer: { bg: "bg-slate-400/10", text: "text-slate-400" },
	opening_balance: { bg: "bg-amber-400/10", text: "text-amber-400" },
};

const MANUAL_TX_TYPES: LedgerTxType[] = [
	"opening_balance",
	"partner_withdrawal",
	"partner_deposit",
	"partner_loan",
	"partner_loan_payment",
	"internal_transfer",
	"loan_receipt",
];

export default function LedgerPage() {
	const [entries, setEntries] = useState<LedgerEntry[]>([]);
	const [cashBalance, setCashBalance] = useState<number>(0);
	const [bankBalances, setBankBalances] = useState<BankBalance[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [loading, setLoading] = useState(true);

	const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

	// Filters
	const [filterDirection, setFilterDirection] = useState<
		"all" | LedgerDirection
	>("all");
	const [filterChannel, setFilterChannel] = useState<"all" | PaymentChannel>(
		"all",
	);
	const [filterTxType, setFilterTxType] = useState<"all" | LedgerTxType>("all");
	const [filterDateFrom, setFilterDateFrom] = useState("");
	const [filterDateTo, setFilterDateTo] = useState("");

	// Manual entry modal
	const [showManual, setShowManual] = useState(false);
	const [manualForm, setManualForm] = useState({
		date: new Date().toISOString().split("T")[0],
		tx_type: "opening_balance" as LedgerTxType,
		direction: "in" as LedgerDirection,
		channel: "cash" as PaymentChannel,
		amount: "",
		description: "",
		bank_account_id: "",
	});
	const [savingManual, setSavingManual] = useState(false);

	const [showConfirm, setShowConfirm] = useState(false);
	const [confirmMessage, setConfirmMessage] = useState("");
	const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

	const loadData = useCallback(async () => {
		// Build query
		let query = supabase
			.from("ledger_entries")
			.select("*, bank_accounts(name), user_profiles(name)")
			.order("created_at", { ascending: false })
			.limit(300);

		if (filterDirection !== "all")
			query = query.eq("direction", filterDirection);
		if (filterChannel !== "all") query = query.eq("channel", filterChannel);
		if (filterTxType !== "all") query = query.eq("tx_type", filterTxType);
		if (filterDateFrom) query = query.gte("date", filterDateFrom);
		if (filterDateTo) query = query.lte("date", filterDateTo);

		const [
			{ data: ledger, error: e1 },
			{ data: cash, error: e2 },
			{ data: bank, error: e3 },
			{ data: accounts, error: e4 },
		] = await Promise.all([
			query,
			supabase.from("cash_balance").select("balance").single(),
			supabase.from("bank_balance_by_account").select("*"),
			supabase
				.from("bank_accounts")
				.select("id, name")
				.eq("is_active", true)
				.order("name"),
		]);

		if (e1) toast.error(`خطأ في تحميل القيود: ${e1.message}`);
		if (e2) toast.error(`خطأ في رصيد الكاش: ${e2.message}`);
		if (e3) toast.error(`خطأ في البنوك: ${e3.message}`);
		if (e4) toast.error(`خطأ في حسابات البنك: ${e4.message}`);

		setEntries((ledger as LedgerEntry[]) || []);
		setCashBalance((cash as CashBalance)?.balance ?? 0);
		setBankBalances((bank as BankBalance[]) || []);
		setBankAccounts((accounts as BankAccount[]) || []);

		const { data: userResp } = await supabase.auth.getUser();
		if (userResp?.user) setCurrentUser(userResp.user);

		setLoading(false);
	}, [
		filterDirection,
		filterChannel,
		filterTxType,
		filterDateFrom,
		filterDateTo,
	]);

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const formatAmount = (n: number) =>
		new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(n);

	const formatDate = (d: string) =>
		new Date(d).toLocaleDateString("ar-IL", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});

	const handleAddManualClick = () => {
		if (!manualForm.description.trim() || !manualForm.amount) return;
		const amt = Math.max(0, parseFloat(manualForm.amount) || 0);
		if (amt <= 0) return;

		if (manualForm.direction === "out") {
			if (manualForm.channel === "cash") {
				if (amt > cashBalance) {
					setConfirmMessage(
						`مبلغ القيد (${formatAmount(amt)} ₪) أكبر من رصيد الخزنة المتاح (${formatAmount(cashBalance)} ₪). سيصبح الرصيد بالسالب. هل أنت متأكد؟`,
					);
					setPendingAction(() => handleAddManual);
					setShowConfirm(true);
					return;
				}
			} else if (manualForm.channel === "bank" && manualForm.bank_account_id) {
				const acc = bankBalances.find(
					(b) => b.id === manualForm.bank_account_id,
				);
				const bBal = acc?.balance || 0;
				if (amt > bBal) {
					setConfirmMessage(
						`مبلغ القيد (${formatAmount(amt)} ₪) أكبر من الرصيد البنكي المتاح (${formatAmount(bBal)} ₪). سيصبح الرصيد بالسالب. هل أنت متأكد؟`,
					);
					setPendingAction(() => handleAddManual);
					setShowConfirm(true);
					return;
				}
			}
		}
		handleAddManual();
	};

	const handleAddManual = async () => {
		const amt = Math.max(0, parseFloat(manualForm.amount) || 0);
		if (amt <= 0) return;

		setSavingManual(true);
		const { error } = await supabase.from("ledger_entries").insert({
			date: manualForm.date,
			tx_type: manualForm.tx_type,
			direction: manualForm.direction,
			channel: manualForm.channel,
			amount: amt,
			description: manualForm.description.trim(),
			bank_account_id:
				manualForm.channel === "bank" && manualForm.bank_account_id
					? manualForm.bank_account_id
					: null,
			reference_type: "manual",
			performed_by: currentUser?.id || null,
		});
		setSavingManual(false);
		if (error) {
			toast.error(`فشل الحفظ: ${error.message}`);
		} else {
			toast.success("تم تسجيل القيد ✓");
			setShowManual(false);
			setManualForm({
				date: new Date().toISOString().split("T")[0],
				tx_type: "opening_balance",
				direction: "in",
				channel: "cash",
				amount: "",
				description: "",
				bank_account_id: "",
			});
			loadData();
		}
	};

	const totalIn = entries
		.filter((e) => e.direction === "in")
		.reduce((s, e) => s + e.amount, 0);
	const totalOut = entries
		.filter((e) => e.direction === "out")
		.reduce((s, e) => s + e.amount, 0);
	const totalBank = bankBalances.reduce((s, b) => s + b.balance, 0);

	const inputStyle =
		"bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e8e8f5] w-full outline-none box-border h-[42px] focus:border-indigo-500/50 transition-colors";
	const btnPrimary =
		"bg-gradient-to-br from-indigo-500 to-violet-600 border-none rounded-lg text-white px-4 py-2.5 text-[13px] font-semibold cursor-pointer h-[42px] whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed";
	const btnSecondary =
		"bg-white/5 border border-white/10 rounded-lg text-[#9090b0] px-4 py-2.5 text-[13px] cursor-pointer h-[42px] whitespace-nowrap hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

	if (loading)
		return (
			<AppLayout>
				<LoadingSpinner />
			</AppLayout>
		);

	return (
		<AppLayout>
			<DoubleConfirmModal
				isOpen={showConfirm}
				title="تحذير: رصيد غير كافٍ"
				message={confirmMessage}
				onConfirm={() => {
					setShowConfirm(false);
					if (pendingAction) pendingAction();
				}}
				onCancel={() => {
					setShowConfirm(false);
					setPendingAction(null);
				}}
			/>

			<div className="py-8 px-10 max-w-[1200px] mx-auto">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-xl font-bold text-[#f0f0f8]">السجل المالي</h1>
					<button className={btnPrimary} onClick={() => setShowManual(true)}>
						+ قيد يدوي
					</button>
				</div>

				<LedgerBalanceCards
					cashBalance={cashBalance}
					bankBalances={bankBalances}
					totalBank={totalBank}
					formatAmount={formatAmount}
				/>

				<LedgerFilters
					filterDirection={filterDirection}
					setFilterDirection={setFilterDirection}
					filterChannel={filterChannel}
					setFilterChannel={setFilterChannel}
					filterTxType={filterTxType}
					setFilterTxType={setFilterTxType}
					filterDateFrom={filterDateFrom}
					setFilterDateFrom={setFilterDateFrom}
					filterDateTo={filterDateTo}
					setFilterDateTo={setFilterDateTo}
					TX_TYPE_LABELS={TX_TYPE_LABELS}
					inputStyle={inputStyle}
					btnSecondary={btnSecondary}
				/>

				<LedgerSummaryRow
					entriesLength={entries.length}
					totalIn={totalIn}
					totalOut={totalOut}
					formatAmount={formatAmount}
				/>

				<LedgerTable
					entries={entries}
					TX_TYPE_COLORS={TX_TYPE_COLORS}
					TX_TYPE_LABELS={TX_TYPE_LABELS}
					formatDate={formatDate}
					formatAmount={formatAmount}
				/>
			</div>

			<ManualEntryModal
				showManual={showManual}
				setShowManual={setShowManual}
				manualForm={manualForm}
				setManualForm={setManualForm}
				savingManual={savingManual}
				handleAddManualClick={handleAddManualClick}
				MANUAL_TX_TYPES={MANUAL_TX_TYPES}
				TX_TYPE_LABELS={TX_TYPE_LABELS}
				bankAccounts={bankAccounts}
				inputStyle={inputStyle}
				btnPrimary={btnPrimary}
				btnSecondary={btnSecondary}
			/>
		</AppLayout>
	);
}
