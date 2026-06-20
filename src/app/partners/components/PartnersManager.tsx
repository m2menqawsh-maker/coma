"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DoubleConfirmModal from "@/components/DoubleConfirmModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";

import type { BankAccount, Partner, PartnerMovement } from "../types";
import { btnPrimary, btnSecondary, fmt, inputStyle } from "../utils";
import PartnerMovementModal from "./PartnerMovementModal";
import PartnerMovementsTable from "./PartnerMovementsTable";
import PartnerStatsCards from "./PartnerStatsCards";
import PartnersTabs from "./PartnersTabs";

const supabase = createClient();

export default function PartnersManager() {
	const [partners, setPartners] = useState<Partner[]>([]);
	const [movements, setMovements] = useState<PartnerMovement[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [totalNetProfit, setTotalNetProfit] = useState(0);
	const [loading, setLoading] = useState(true);

	const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [modalPartner, setModalPartner] = useState<Partner | null>(null);
	const [form, setForm] = useState({
		type: "withdrawal" as "withdrawal" | "deposit" | "loan" | "loan_payment",
		amount: "",
		channel: "cash" as "cash" | "bank",
		bank_account_id: "",
		date: new Date().toISOString().split("T")[0],
		description: "",
	});
	const [saving, setSaving] = useState(false);

	const [cashBalance, setCashBalance] = useState<number>(0);
	const [bankBalances, setBankBalances] = useState<Record<string, number>>({});
	const [showConfirm, setShowConfirm] = useState(false);
	const [confirmMessage, setConfirmMessage] = useState("");
	const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

	const loadData = useCallback(async () => {
		const [
			{ data: partnersData },
			{ data: movementsData },
			{ data: banksData },
			{ data: profitData },
			{ data: cashRes },
			{ data: bankBals },
		] = await Promise.all([
			supabase
				.from("partners")
				.select("*")
				.eq("is_active", true)
				.order("share_percent", { ascending: false }),
			supabase
				.from("ledger_entries")
				.select("*, bank_accounts(name)")
				.in("tx_type", [
					"partner_withdrawal",
					"partner_deposit",
					"partner_loan",
					"partner_loan_payment",
				])
				.order("date", { ascending: false }),
			supabase
				.from("bank_accounts")
				.select("id, name")
				.eq("is_active", true)
				.order("name"),
			supabase.from("invoices").select("net_profit"),
			supabase.from("cash_balance").select("balance").single(),
			supabase.from("bank_balance_by_account").select("id, balance"),
		]);

		setPartners((partnersData as Partner[]) || []);
		setMovements((movementsData as PartnerMovement[]) || []);
		setBankAccounts((banksData as BankAccount[]) || []);
		const total = (profitData || []).reduce(
			(s: number, i: { net_profit: number }) => s + (i.net_profit || 0),
			0,
		);
		setTotalNetProfit(total);

		setCashBalance(cashRes?.balance || 0);
		const bMap: Record<string, number> = {};
		if (bankBals)
			bankBals.forEach((b: { id: string; balance: number }) => {
				bMap[b.id] = b.balance;
			});
		setBankBalances(bMap);

		setLoading(false);
	}, []);

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const getPartnerStats = (partner: Partner) => {
		const profitShare = totalNetProfit * (partner.share_percent / 100);
		const myMovements = movements.filter((m) => m.partner_id === partner.id);
		const totalWithdrawals = myMovements
			.filter((m) => m.tx_type === "partner_withdrawal")
			.reduce((s, m) => s + m.amount, 0);
		const totalDeposits = myMovements
			.filter((m) => m.tx_type === "partner_deposit")
			.reduce((s, m) => s + m.amount, 0);
		const netBalance = profitShare + totalDeposits - totalWithdrawals;

		const totalLoansTaken = myMovements
			.filter((m) => m.tx_type === "partner_loan")
			.reduce((s, m) => s + m.amount, 0);
		const totalLoansPaid = myMovements
			.filter((m) => m.tx_type === "partner_loan_payment")
			.reduce((s, m) => s + m.amount, 0);
		const totalDebt = totalLoansTaken - totalLoansPaid;

		return {
			profitShare,
			totalWithdrawals,
			totalDeposits,
			netBalance,
			totalLoansTaken,
			totalLoansPaid,
			totalDebt,
			myMovements,
		};
	};

	const openModal = (
		partner: Partner,
		type: "withdrawal" | "deposit" | "loan" | "loan_payment",
	) => {
		setModalPartner(partner);
		setForm({
			type,
			amount: "",
			channel: "cash",
			bank_account_id: "",
			date: new Date().toISOString().split("T")[0],
			description: "",
		});
		setShowModal(true);
	};

	const handleSaveClick = () => {
		const rawAmt = Math.max(0, parseFloat(form.amount) || 0);
		if (!modalPartner || rawAmt <= 0) return;
		const amt = rawAmt;

		if (form.type === "withdrawal") {
			const stats = getPartnerStats(modalPartner);
			if (amt > stats.netBalance) {
				toast.error(
					`مبلغ السحب المطلوب (${fmt(amt)} ₪) أكبر من رصيد الأرباح المتاح (${fmt(stats.netBalance)} ₪). السحب غير مسموح.`,
				);
				return;
			}
		}

		if (form.type === "loan_payment") {
			const stats = getPartnerStats(modalPartner);
			if (stats.totalDebt <= 0) {
				toast.error("هذا الشريك ليس عليه أي ديون أو سلف لسدادها.");
				return;
			}
			if (amt > stats.totalDebt) {
				toast.error(
					`مبلغ السداد المطلوب (${fmt(amt)} ₪) أكبر من إجمالي الدين المستحق على الشريك (${fmt(stats.totalDebt)} ₪).`,
				);
				return;
			}
		}

		if (form.type === "withdrawal" || form.type === "loan") {
			if (form.channel === "cash") {
				if (amt > cashBalance) {
					setConfirmMessage(
						`المبلغ المطلوب (${fmt(amt)} ₪) أكبر من المتوفر في الخزنة (${fmt(cashBalance)} ₪). هل أنت متأكد؟`,
					);
					setPendingAction(() => handleSave);
					setShowConfirm(true);
					return;
				}
			} else if (form.channel === "bank" && form.bank_account_id) {
				const bBal = bankBalances[form.bank_account_id] || 0;
				if (amt > bBal) {
					setConfirmMessage(
						`المبلغ المطلوب (${fmt(amt)} ₪) أكبر من رصيد الحساب البنكي المتاح (${fmt(bBal)} ₪). هل أنت متأكد؟`,
					);
					setPendingAction(() => handleSave);
					setShowConfirm(true);
					return;
				}
			}
		}
		handleSave();
	};

	const handleSave = async () => {
		const amt = Math.max(0, parseFloat(form.amount) || 0);
		if (!modalPartner || amt <= 0) return;
		setSaving(true);

		let tx_type = "partner_withdrawal";
		let direction = "out";
		let label = "عملية";

		if (form.type === "withdrawal") {
			tx_type = "partner_withdrawal";
			direction = "out";
			label = "سحب أرباح";
		} else if (form.type === "deposit") {
			tx_type = "partner_deposit";
			direction = "in";
			label = "إيداع أرباح";
		} else if (form.type === "loan") {
			tx_type = "partner_loan";
			direction = "out";
			label = "أخذ سلفة";
		} else if (form.type === "loan_payment") {
			tx_type = "partner_loan_payment";
			direction = "in";
			label = "سداد سلفة";
		}

		const desc = form.description.trim() || `${label} - ${modalPartner.name}`;

		const { error } = await supabase.from("ledger_entries").insert({
			date: form.date,
			tx_type: tx_type,
			direction: direction,
			channel: form.channel,
			amount: amt,
			description: desc,
			bank_account_id:
				form.channel === "bank" && form.bank_account_id
					? form.bank_account_id
					: null,
			reference_type: "partner",
			partner_id: modalPartner.id,
		});

		setSaving(false);
		if (error) {
			toast.error(`فشل الحفظ: ${error.message}`);
		} else {
			toast.success(`تم تسجيل ${label} ₪${fmt(amt)} ✓`);
			setShowModal(false);
			loadData();
		}
	};

	if (loading) return <LoadingSpinner />;

	const activePartner = selectedPartner ?? partners[0] ?? null;
	const activeStats = activePartner ? getPartnerStats(activePartner) : null;

	return (
		<>
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

			{/* Header */}
			<div className="mb-7">
				<h1 className="text-[20px] font-bold text-[#f0f0f8] mb-1">الشركاء</h1>
				<p className="text-[13px] text-[#6b6b8a]">
					إجمالي الأرباح الصافية:{" "}
					<span className="text-[#4ade80] font-bold">
						₪{fmt(totalNetProfit)}
					</span>
				</p>
			</div>

			{/* Partner tabs */}
			<PartnersTabs
				partners={partners}
				activePartner={activePartner}
				setSelectedPartner={setSelectedPartner}
				getPartnerStats={getPartnerStats}
			/>

			{activePartner && activeStats && (
				<>
					<PartnerStatsCards
						activePartner={activePartner}
						activeStats={activeStats}
						totalNetProfit={totalNetProfit}
					/>

					<PartnerMovementsTable
						activePartner={activePartner}
						activeStats={activeStats}
						openModal={openModal}
					/>
				</>
			)}

			{partners.length === 0 && (
				<div className="text-center py-20 px-5 text-[#4a4a6a]">
					<div className="text-[32px] mb-3">◑</div>
					<div className="text-[15px] mb-2 text-[#6b6b8a]">
						لا يوجد شركاء مسجلون
					</div>
					<div className="text-[13px]">أضف الشركاء من صفحة الإعدادات</div>
				</div>
			)}

			{showModal && modalPartner && (
				<PartnerMovementModal
					modalPartner={modalPartner}
					form={form}
					setForm={setForm}
					bankAccounts={bankAccounts}
					getPartnerStats={getPartnerStats}
					onClose={() => setShowModal(false)}
					onSaveClick={handleSaveClick}
					saving={saving}
					inputStyle={inputStyle}
					btnPrimary={btnPrimary}
					btnSecondary={btnSecondary}
				/>
			)}
		</>
	);
}
