"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
	calcObligationDailyRate,
	calcObligationTotalDue,
	type ScheduleType,
} from "@/lib/finance/obligations";
import { createClient } from "@/lib/supabase/client";
import AddEditObligationModal from "./components/AddEditObligationModal";
import CalculatePaymentsModal from "./components/CalculatePaymentsModal";
import ObligationsList from "./components/ObligationsList";
import type { BankAccount, Obligation, PendingPayment } from "./types";

const supabase = createClient();

const SCHEDULE_LABELS: Record<ScheduleType, string> = {
	monthly: "شهري",
	weekly: "أسبوعي",
	daily: "يومي",
};

export default function ObligationsPage() {
	const [obligations, setObligations] = useState<Obligation[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [loading, setLoading] = useState(true);

	// Add / Edit
	const [showForm, setShowForm] = useState(false);
	const [editObl, setEditObl] = useState<Obligation | null>(null);
	const [form, setForm] = useState({
		name: "",
		amount: "",
		schedule_type: "monthly" as ScheduleType,
		notes: "",
	});
	const [saving, setSaving] = useState(false);

	// Inventory calc
	const [showCalc, setShowCalc] = useState(false);
	const [calcDateFrom, setCalcDateFrom] = useState("");
	const [calcDateTo, setCalcDateTo] = useState("");
	const [pending, setPending] = useState<PendingPayment[]>([]);
	const [savingPayments, setSavingPayments] = useState(false);

	const loadData = useCallback(async () => {
		const [{ data: obls, error: e1 }, { data: banks, error: e2 }] =
			await Promise.all([
				supabase.from("fixed_obligations").select("*").order("name"),
				supabase
					.from("bank_accounts")
					.select("id, name")
					.eq("is_active", true)
					.order("name"),
			]);
		if (e1) toast.error(`خطأ في التحميل: ${e1.message}`);
		if (e2) toast.error(`خطأ في البنوك: ${e2.message}`);
		setObligations((obls as Obligation[]) || []);
		setBankAccounts((banks as BankAccount[]) || []);
		setLoading(false);
	}, []);

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const handleSave = async () => {
		if (!form.name.trim() || !form.amount) return;
		setSaving(true);
		const data = {
			name: form.name.trim(),
			amount: parseFloat(form.amount),
			schedule_type: form.schedule_type,
			notes: form.notes.trim() || null,
		};
		const { error } = editObl
			? await supabase
					.from("fixed_obligations")
					.update(data)
					.eq("id", editObl.id)
			: await supabase.from("fixed_obligations").insert(data);
		setSaving(false);
		if (error) {
			toast.error(`فشل الحفظ: ${error.message}`);
		} else {
			toast.success(editObl ? "تم التعديل ✓" : "تمت الإضافة ✓");
			setShowForm(false);
			setEditObl(null);
			setForm({ name: "", amount: "", schedule_type: "monthly", notes: "" });
			loadData();
		}
	};

	const handleToggle = async (id: string, current: boolean) => {
		const { error } = await supabase
			.from("fixed_obligations")
			.update({ is_active: !current })
			.eq("id", id);
		if (error) toast.error(`فشل التحديث: ${error.message}`);
		else loadData();
	};

	// حساب المستحقات بين تاريخين
	const handleCalc = () => {
		if (!calcDateFrom || !calcDateTo) return;
		const from = new Date(calcDateFrom);
		const to = new Date(calcDateTo);
		const days =
			Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		if (days <= 0) {
			toast.error("تاريخ النهاية قبل البداية");
			return;
		}

		const active = obligations.filter((o) => o.is_active);
		const items: PendingPayment[] = active.map((o) => {
			const dailyRate = calcObligationDailyRate(o.amount, o.schedule_type);
			const totalDue = calcObligationTotalDue(dailyRate, days);
			return {
				obligation: o,
				days,
				dailyRate: Math.round(dailyRate * 100) / 100,
				totalDue,
				cashAmount: String(totalDue),
				bankAmount: "0",
				bankAccountId: "",
				approved: true,
			};
		});
		setPending(items);
		setShowCalc(true);
	};

	// تسجيل الدفعات الموافق عليها
	const handleConfirmPayments = async () => {
		const approved = pending.filter((p) => p.approved);
		if (approved.length === 0) return;

		// التحقق من الحسابات البنكية
		for (const p of approved) {
			const bank = parseFloat(p.bankAmount) || 0;
			if (bank > 0 && !p.bankAccountId) {
				toast.error(`اختر الحساب البنكي لـ "${p.obligation.name}"`);
				return;
			}
			const cash = parseFloat(p.cashAmount) || 0;
			if (cash + bank <= 0) {
				toast.error(`المبلغ صفر لـ "${p.obligation.name}"`);
				return;
			}
		}

		setSavingPayments(true);
		const inserts = approved.map((p) => ({
			name: p.obligation.name,
			cash_amount: parseFloat(p.cashAmount) || 0,
			bank_amount: parseFloat(p.bankAmount) || 0,
			amount: (parseFloat(p.cashAmount) || 0) + (parseFloat(p.bankAmount) || 0),
			channel: (parseFloat(p.bankAmount) || 0) > 0 ? "bank" : "cash",
			expense_type: "fixed",
			date: calcDateTo,
			bank_account_id:
				(parseFloat(p.bankAmount) || 0) > 0 ? p.bankAccountId : null,
			notes: `${calcDateFrom} → ${calcDateTo} (${p.days} يوم × ₪${p.dailyRate}/يوم)`,
		}));

		const { error } = await supabase.from("expenses").insert(inserts);
		setSavingPayments(false);

		if (error) {
			toast.error(`فشل التسجيل: ${error.message}`);
		} else {
			toast.success(
				`تم تسجيل ${approved.length} التزام في المصاريف والليدجر ✓`,
			);
			setShowCalc(false);
			setPending([]);
			setCalcDateFrom("");
			setCalcDateTo("");
		}
	};

	const totalDue = pending
		.filter((p) => p.approved)
		.reduce((s, p) => {
			return (
				s + (parseFloat(p.cashAmount) || 0) + (parseFloat(p.bankAmount) || 0)
			);
		}, 0);

	const fmt = (n: unknown) =>
		new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(Number(n) || 0);

	const inputStyle =
		"bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e8e8f5] w-full outline-none focus:border-indigo-500/50 transition-colors h-[42px] box-border";
	const btnPrimary =
		"bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity h-[42px] whitespace-nowrap";
	const btnSecondary =
		"bg-white/[0.06] border border-white/10 text-[#9090b0] rounded-lg px-4 py-2.5 text-[13px] cursor-pointer hover:bg-white/10 transition-colors h-[42px] whitespace-nowrap";

	if (loading)
		return (
			<AppLayout>
				<LoadingSpinner />
			</AppLayout>
		);

	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1200px] mx-auto">
				{/* Header */}
				<div className="flex justify-between items-center mb-2">
					<h1 className="text-[20px] font-bold text-[#f0f0f8]">
						الالتزامات الثابتة
					</h1>
					<div className="flex gap-2.5">
						<button
							className={`${btnSecondary} text-amber-400 border-amber-400/30 text-[13px]`}
							onClick={() => setShowCalc(true)}
						>
							🧮 احسب المستحقات
						</button>
						<button
							className={btnPrimary}
							onClick={() => {
								setEditObl(null);
								setForm({
									name: "",
									amount: "",
									schedule_type: "monthly",
									notes: "",
								});
								setShowForm(true);
							}}
						>
							+ إضافة التزام
						</button>
					</div>
				</div>
				<p className="text-[13px] text-[#4a4a6a] mb-6">
					يتم احتساب التكلفة اليومية لكل التزام وخصمها عند إنشاء الجرد
				</p>

				<ObligationsList
					obligations={obligations}
					SCHEDULE_LABELS={SCHEDULE_LABELS}
					fmt={fmt}
					setEditObl={setEditObl}
					setForm={setForm}
					setShowForm={setShowForm}
					handleToggle={handleToggle}
					btnSecondary={btnSecondary}
				/>

				{/* Summary */}
				{obligations.filter((o) => o.is_active).length > 0 && (
					<div className="mt-4 bg-red-400/[0.06] border border-red-400/[0.15] rounded-xl py-3.5 px-5 flex justify-between items-center">
						<span className="text-[13px] text-[#9090b0]">
							إجمالي التكلفة اليومية (
							{obligations.filter((o) => o.is_active).length} التزام)
						</span>
						<span className="text-base font-bold text-red-400">
							₪
							{fmt(
								obligations
									.filter((o) => o.is_active)
									.reduce(
										(s, o) =>
											s + calcObligationDailyRate(o.amount, o.schedule_type),
										0,
									),
							)}
							/يوم
						</span>
					</div>
				)}
			</div>

			<AddEditObligationModal
				showForm={showForm}
				setShowForm={setShowForm}
				editObl={editObl}
				setEditObl={setEditObl}
				form={form}
				setForm={setForm}
				saving={saving}
				handleSave={handleSave}
				fmt={fmt}
				inputStyle={inputStyle}
				btnPrimary={btnPrimary}
				btnSecondary={btnSecondary}
			/>

			<CalculatePaymentsModal
				showCalc={showCalc}
				setShowCalc={setShowCalc}
				calcDateFrom={calcDateFrom}
				setCalcDateFrom={setCalcDateFrom}
				calcDateTo={calcDateTo}
				setCalcDateTo={setCalcDateTo}
				handleCalc={handleCalc}
				pending={pending}
				setPending={setPending}
				bankAccounts={bankAccounts}
				totalDue={totalDue}
				savingPayments={savingPayments}
				handleConfirmPayments={handleConfirmPayments}
				fmt={fmt}
				inputStyle={inputStyle}
				btnPrimary={btnPrimary}
				btnSecondary={btnSecondary}
			/>
		</AppLayout>
	);
}
