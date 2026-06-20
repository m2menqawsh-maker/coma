"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DoubleConfirmModal from "@/components/DoubleConfirmModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";

import type {
	BankAccountDetail,
	BankTransfer,
	Direction,
	TransferStatus,
} from "../types";
import { fmt } from "../utils";

import BankCards from "./BankCards";
import BanksFilterBar from "./BanksFilterBar";
import BanksSummaryBar from "./BanksSummaryBar";
import BanksTable from "./BanksTable";
import BankTransferModal from "./BankTransferModal";

const supabase = createClient();

export default function BanksManager() {
	const [accounts, setAccounts] = useState<BankAccountDetail[]>([]);
	const [transfers, setTransfers] = useState<BankTransfer[]>([]);
	const [loading, setLoading] = useState(true);

	const [selectedAccount, setSelectedAccount] =
		useState<BankAccountDetail | null>(null);
	const [filterStatus, setFilterStatus] = useState<"all" | TransferStatus>(
		"all",
	);
	const [filterDir, setFilterDir] = useState<"all" | Direction>("all");
	const [filterDateFrom, setFilterDateFrom] = useState("");
	const [filterDateTo, setFilterDateTo] = useState("");

	const [showAddModal, setShowAddModal] = useState(false);
	const [addForm, setAddForm] = useState({
		date: new Date().toISOString().split("T")[0],
		bank_account_id: "",
		amount: "",
		direction: "in" as Direction,
		description: "",
		sender_name: "",
		sender_phone: "",
	});
	const [saving, setSaving] = useState(false);
	const [confirmingId, setConfirmingId] = useState<string | null>(null);

	const [showConfirm, setShowConfirm] = useState(false);
	const [confirmMessage, setConfirmMessage] = useState("");
	const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

	const loadData = useCallback(async () => {
		try {
			let q = supabase
				.from("bank_transfers")
				.select("*, bank_accounts(name)")
				.order("created_at", { ascending: false })
				.limit(500);
			if (selectedAccount) q = q.eq("bank_account_id", selectedAccount.id);
			if (filterStatus !== "all") q = q.eq("status", filterStatus);
			if (filterDir !== "all") q = q.eq("direction", filterDir);
			if (filterDateFrom) q = q.gte("date", filterDateFrom);
			if (filterDateTo) q = q.lte("date", filterDateTo);

			const [{ data: accs }, { data: trans }] = await Promise.all([
				supabase.from("bank_account_balances").select("*").order("name"),
				q,
			]);
			setAccounts((accs as BankAccountDetail[]) || []);
			setTransfers((trans as BankTransfer[]) || []);
		} catch {
			// fallback on error
		} finally {
			setLoading(false);
		}
	}, [selectedAccount, filterStatus, filterDir, filterDateFrom, filterDateTo]);

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const handleConfirm = async (t: BankTransfer) => {
		setConfirmingId(t.id);
		const { error } = await supabase
			.from("bank_transfers")
			.update({ status: "confirmed", confirmed_at: new Date().toISOString() })
			.eq("id", t.id);

		if (!error) {
			if (t.invoice_id) {
				const { data: updated } = await supabase
					.from("ledger_entries")
					.update({ transfer_status: "confirmed" })
					.eq("reference_id", t.invoice_id)
					.eq("reference_type", "invoice")
					.eq("channel", "bank")
					.eq("transfer_status", "pending")
					.select("id");

				if (!updated || updated.length === 0) {
					await supabase.from("ledger_entries").insert({
						date: t.date,
						tx_type: "income_session",
						direction: "in",
						channel: "bank",
						amount: t.amount,
						reference_id: t.invoice_id,
						reference_type: "invoice",
						bank_account_id: t.bank_account_id,
						description:
							t.description ||
							`تصديق حوالة واردة من ${t.sender_name || "مجهول"}`,
						transfer_status: "confirmed",
					});
				}
			} else if (t.reference_type === "debt_payment") {
				const { data: updated } = await supabase
					.from("ledger_entries")
					.update({ transfer_status: "confirmed" })
					.eq("channel", "bank")
					.eq("transfer_status", "pending")
					.eq("bank_account_id", t.bank_account_id)
					.eq("amount", t.amount)
					.eq("tx_type", "debt_payment")
					.select("id")
					.limit(1);

				if (!updated || updated.length === 0) {
					await supabase.from("ledger_entries").insert({
						date: t.date,
						tx_type: "debt_payment",
						direction: "in",
						channel: "bank",
						amount: t.amount,
						reference_id: t.id,
						reference_type: "bank_transfer",
						bank_account_id: t.bank_account_id,
						description:
							t.description ||
							`تصديق حوالة واردة من ${t.sender_name || "مجهول"}`,
						transfer_status: "confirmed",
					});
				}
			} else {
				await supabase.from("ledger_entries").insert({
					date: t.date,
					tx_type: "internal_transfer",
					direction: "in",
					channel: "bank",
					amount: t.amount,
					reference_id: t.id,
					reference_type: "bank_transfer",
					bank_account_id: t.bank_account_id,
					description:
						t.description || `تصديق حوالة واردة من ${t.sender_name || "مجهول"}`,
					transfer_status: "confirmed",
				});
			}
		}

		setConfirmingId(null);
		if (error) toast.error(`فشل التصديق: ${error.message}`);
		else {
			toast.success(`تم تصديق الحوالة +₪${fmt(t.amount)} ✓`);
			loadData();
		}
	};

	const handleReject = async (t: BankTransfer) => {
		setConfirmingId(t.id);
		const { error } = await supabase
			.from("bank_transfers")
			.update({ status: "rejected" })
			.eq("id", t.id);

		if (!error && t.invoice_id) {
			await supabase
				.from("ledger_entries")
				.delete()
				.eq("reference_id", t.invoice_id)
				.eq("reference_type", "invoice")
				.eq("channel", "bank")
				.eq("transfer_status", "pending");
		}

		setConfirmingId(null);
		if (error) toast.error(`فشل الرفض: ${error.message}`);
		else {
			toast.success("تم رفض الحوالة");
			loadData();
		}
	};

	const handleAddTransferClick = () => {
		if (!addForm.amount || !addForm.bank_account_id) return;
		const isOut = addForm.direction === "out";
		const amt = Math.max(0, parseFloat(addForm.amount) || 0);
		if (amt <= 0) return;

		if (isOut) {
			const acc = accounts.find((a) => a.id === addForm.bank_account_id);
			const bBal = acc?.balance || 0;
			if (amt > bBal) {
				setConfirmMessage(
					`المبلغ الصادر (${fmt(amt)} ₪) أكبر من الرصيد المتاح للحساب البنكي (${fmt(bBal)} ₪). سيصبح الرصيد بالسالب. هل أنت متأكد؟`,
				);
				setPendingAction(() => handleAddTransfer);
				setShowConfirm(true);
				return;
			}
		}
		handleAddTransfer();
	};

	const handleAddTransfer = async () => {
		if (!addForm.amount || !addForm.bank_account_id) return;
		const amt = Math.max(0, parseFloat(addForm.amount) || 0);
		if (amt <= 0) return;

		setSaving(true);
		const isOut = addForm.direction === "out";
		const { data: transfer, error } = await supabase
			.from("bank_transfers")
			.insert({
				date: addForm.date,
				bank_account_id: addForm.bank_account_id,
				amount: amt,
				direction: addForm.direction,
				status: isOut ? "confirmed" : "pending",
				description: addForm.description.trim() || null,
				sender_name: addForm.sender_name.trim() || null,
				sender_phone: addForm.sender_phone.trim() || null,
				reference_type: "manual",
			})
			.select()
			.single();

		if (transfer && isOut && !error) {
			await supabase.from("ledger_entries").insert({
				date: addForm.date,
				tx_type: "bank_transfer_out",
				direction: "out",
				channel: "bank",
				amount: amt,
				reference_id: transfer.id,
				reference_type: "bank_transfer",
				bank_account_id: addForm.bank_account_id,
				description: addForm.description.trim() || "حوالة بنكية صادرة",
			});
		}

		setSaving(false);
		if (error) toast.error(`فشل الحفظ: ${error.message}`);
		else {
			toast.success(`تم تسجيل الحوالة ${isOut ? "الصادرة" : "الواردة"} ✓`);
			setShowAddModal(false);
			setAddForm({
				date: new Date().toISOString().split("T")[0],
				bank_account_id: "",
				amount: "",
				direction: "in",
				description: "",
				sender_name: "",
				sender_phone: "",
			});
			loadData();
		}
	};

	const totalIn = transfers
		.filter((t) => t.direction === "in" && t.status === "confirmed")
		.reduce((s, t) => s + t.amount, 0);
	const totalOut = transfers
		.filter((t) => t.direction === "out" && t.status !== "rejected")
		.reduce((s, t) => s + t.amount, 0);
	const totalPending = transfers
		.filter((t) => t.direction === "in" && t.status === "pending")
		.reduce((s, t) => s + t.amount, 0);
	const pendingCount = transfers.filter((t) => t.status === "pending").length;
	const totalBal = accounts.reduce((s, a) => s + a.balance, 0);

	const inputStyle =
		"bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] rounded-lg px-3 py-[9px] text-[13px] text-[#e8e8f5] w-full outline-none focus:border-indigo-500/50 transition-colors";
	const btnPrimary =
		"bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-none rounded-lg px-[18px] py-[9px] text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity";
	const btnSecondary =
		"bg-white/[0.06] border border-white/10 text-[#9090b0] rounded-lg px-[18px] py-[9px] text-[13px] cursor-pointer hover:bg-white/10 transition-colors";

	if (loading) return <LoadingSpinner />;

	return (
		<>
			{/* Header */}
			<div className="flex justify-between items-center flex-wrap gap-3">
				<div>
					<h1 className="text-[20px] font-bold text-[#f0f0f8] mb-1">
						الحسابات البنكية
					</h1>
					<p className="text-[13px] text-[#6b6b8a]">
						الرصيد الإجمالي:{" "}
						<span className="text-blue-400 font-bold">₪{fmt(totalBal)}</span>
						{pendingCount > 0 && (
							<span className="text-amber-400 mr-3.5 font-semibold">
								● {pendingCount} حوالة بانتظار التصديق
							</span>
						)}
					</p>
				</div>
				<button className={btnPrimary} onClick={() => setShowAddModal(true)}>
					+ تسجيل حوالة يدوية
				</button>
			</div>

			<BankCards
				accounts={accounts}
				selectedAccount={selectedAccount}
				onSelectAccount={setSelectedAccount}
				totalBal={totalBal}
			/>

			<BanksSummaryBar
				totalIn={totalIn}
				totalOut={totalOut}
				totalPending={totalPending}
				transfersCount={transfers.length}
			/>

			<BanksFilterBar
				filterStatus={filterStatus}
				setFilterStatus={setFilterStatus}
				filterDir={filterDir}
				setFilterDir={setFilterDir}
				filterDateFrom={filterDateFrom}
				setFilterDateFrom={setFilterDateFrom}
				filterDateTo={filterDateTo}
				setFilterDateTo={setFilterDateTo}
				inputStyle={inputStyle}
				btnSecondary={btnSecondary}
			/>

			<BanksTable
				transfers={transfers}
				selectedAccount={selectedAccount}
				confirmingId={confirmingId}
				onConfirm={handleConfirm}
				onReject={handleReject}
			/>

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

			{showAddModal && (
				<BankTransferModal
					accounts={accounts}
					addForm={addForm}
					setAddForm={setAddForm}
					onClose={() => setShowAddModal(false)}
					onSave={handleAddTransferClick}
					saving={saving}
					inputStyle={inputStyle}
					btnPrimary={btnPrimary}
					btnSecondary={btnSecondary}
				/>
			)}
		</>
	);
}
