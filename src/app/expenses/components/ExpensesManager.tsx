"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DoubleConfirmModal from "@/components/DoubleConfirmModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { exportToCsv } from "@/lib/exportCsv";
import { createClient } from "@/lib/supabase/client";

import type { BankAccount, Expense, ExpenseType } from "../types";
import {
	btnPrimary,
	btnSecondary,
	EXPENSE_TYPE_LABELS,
	fmt,
	fmtDate,
	inputStyle,
} from "../utils";
import ExpenseFormModal from "./ExpenseFormModal";
import ExpensesFilterBar from "./ExpensesFilterBar";
import ExpensesSummaryCards from "./ExpensesSummaryCards";
import ExpensesTable from "./ExpensesTable";

const supabase = createClient();

export default function ExpensesManager() {
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [loading, setLoading] = useState(true);

	const [cashBalance, setCashBalance] = useState<number>(0);
	const [bankBalances, setBankBalances] = useState<Record<string, number>>({});
	const [showConfirm, setShowConfirm] = useState(false);
	const [confirmMessage, setConfirmMessage] = useState("");
	const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

	// Filters
	const [filterType, setFilterType] = useState<"all" | ExpenseType>("all");
	const [filterDateFrom, setFilterDateFrom] = useState("");
	const [filterDateTo, setFilterDateTo] = useState("");

	// Form
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({
		name: "",
		cash_amount: "",
		bank_amount: "",
		expense_type: "one_time" as ExpenseType,
		date: new Date().toISOString().split("T")[0],
		bank_account_id: "",
		notes: "",
	});
	const [saving, setSaving] = useState(false);

	// Edit
	const [editExpense, setEditExpense] = useState<Expense | null>(null);
	const [editForm, setEditForm] = useState({
		name: "",
		cash_amount: "",
		bank_amount: "",
		expense_type: "one_time" as ExpenseType,
		date: "",
		bank_account_id: "",
		notes: "",
	});
	const [savingEdit, setSavingEdit] = useState(false);

	const loadData = useCallback(async () => {
		let query = supabase
			.from("expenses")
			.select("*, bank_accounts(name)")
			.order("date", { ascending: false })
			.order("created_at", { ascending: false });

		if (filterType !== "all") query = query.eq("expense_type", filterType);
		if (filterDateFrom) query = query.gte("date", filterDateFrom);
		if (filterDateTo) query = query.lte("date", filterDateTo);

		const [
			{ data: exps, error: e1 },
			{ data: banks, error: e2 },
			{ data: cashRes },
			{ data: bankBals },
		] = await Promise.all([
			query,
			supabase
				.from("bank_accounts")
				.select("id, name")
				.eq("is_active", true)
				.order("name"),
			supabase.from("cash_balance").select("balance").single(),
			supabase.from("bank_balance_by_account").select("id, balance"),
		]);

		if (e1) toast.error(`خطأ في تحميل المصاريف: ${e1.message}`);
		if (e2) toast.error(`خطأ في تحميل الحسابات: ${e2.message}`);

		setExpenses((exps as Expense[]) || []);
		setBankAccounts((banks as BankAccount[]) || []);
		setCashBalance(cashRes?.balance || 0);
		const bMap: Record<string, number> = {};
		if (bankBals)
			bankBals.forEach((b: { id: string; balance: number }) => {
				bMap[b.id] = b.balance;
			});
		setBankBalances(bMap);
		setLoading(false);
	}, [filterType, filterDateFrom, filterDateTo]);

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const handleAddClick = () => {
		const cash = Math.max(0, parseFloat(form.cash_amount) || 0);
		const bank = Math.max(0, parseFloat(form.bank_amount) || 0);
		if (!form.name.trim() || cash + bank <= 0) return;
		if (bank > 0 && !form.bank_account_id) {
			toast.error("اختر الحساب البنكي");
			return;
		}

		if (cash > cashBalance) {
			setConfirmMessage(
				`هذا المصروف يتطلب (${fmt(cash)} ₪) نقداً، بينما المتوفر بالخزنة (${fmt(cashBalance)} ₪). سيصبح الرصيد بالسالب. هل أنت متأكد?`,
			);
			setPendingAction(() => handleAdd);
			setShowConfirm(true);
			return;
		}
		if (bank > 0 && form.bank_account_id) {
			const bBal = bankBalances[form.bank_account_id] || 0;
			if (bank > bBal) {
				setConfirmMessage(
					`المبلغ البنكي المطلوب (${fmt(bank)} ₪) أكبر من رصيد الحساب المتاح (${fmt(bBal)} ₪). سيصبح الرصيد بالسالب. هل أنت متأكد?`,
				);
				setPendingAction(() => handleAdd);
				setShowConfirm(true);
				return;
			}
		}
		handleAdd();
	};

	const handleAdd = async () => {
		const cash = Math.max(0, parseFloat(form.cash_amount) || 0);
		const bank = Math.max(0, parseFloat(form.bank_amount) || 0);
		if (!form.name.trim() || cash + bank <= 0) return;
		if (bank > 0 && !form.bank_account_id) {
			toast.error("اختر الحساب البنكي");
			return;
		}

		setSaving(true);
		const { error } = await supabase.from("expenses").insert({
			name: form.name.trim(),
			cash_amount: cash,
			bank_amount: bank,
			amount: cash + bank,
			channel: bank > 0 ? "bank" : "cash",
			expense_type: form.expense_type,
			date: form.date,
			bank_account_id: bank > 0 ? form.bank_account_id : null,
			notes: form.notes.trim() || null,
		});
		setSaving(false);

		if (error) {
			toast.error(`فشل الحفظ: ${error.message}`);
		} else {
			toast.success("تم تسجيل المصروف ✓");
			setForm({
				name: "",
				cash_amount: "",
				bank_amount: "",
				expense_type: "one_time",
				date: new Date().toISOString().split("T")[0],
				bank_account_id: "",
				notes: "",
			});
			setShowForm(false);
			loadData();
		}
	};

	const handleEditClick = () => {
		if (!editExpense) return;
		const cash = Math.max(0, parseFloat(editForm.cash_amount) || 0);
		const bank = Math.max(0, parseFloat(editForm.bank_amount) || 0);
		if (!editForm.name.trim() || cash + bank <= 0) return;
		if (bank > 0 && !editForm.bank_account_id) {
			toast.error("اختر الحساب البنكي");
			return;
		}

		const availableCash = cashBalance + (editExpense.cash_amount || 0);
		if (cash > availableCash) {
			setConfirmMessage(
				`هذا التعديل يتطلب نقداً أكبر من المتوفر (${fmt(availableCash)} ₪). سيصبح رصيد الخزنة بالسالب. هل أنت متأكد?`,
			);
			setPendingAction(() => handleEdit);
			setShowConfirm(true);
			return;
		}

		if (bank > 0 && editForm.bank_account_id) {
			const bBal = bankBalances[editForm.bank_account_id] || 0;
			const isSameBank =
				editForm.bank_account_id === editExpense.bank_account_id;
			const availableBank =
				bBal + (isSameBank ? editExpense.bank_amount || 0 : 0);
			if (bank > availableBank) {
				setConfirmMessage(
					`هذا التعديل يتطلب (${fmt(bank)} ₪) من البنك، والمتوفر (${fmt(availableBank)} ₪). سيصبح الحساب بالسالب. هل أنت متأكد?`,
				);
				setPendingAction(() => handleEdit);
				setShowConfirm(true);
				return;
			}
		}
		handleEdit();
	};

	const handleEdit = async () => {
		if (!editExpense) return;
		const cash = Math.max(0, parseFloat(editForm.cash_amount) || 0);
		const bank = Math.max(0, parseFloat(editForm.bank_amount) || 0);
		if (!editForm.name.trim() || cash + bank <= 0) return;
		if (bank > 0 && !editForm.bank_account_id) {
			toast.error("اختر الحساب البنكي");
			return;
		}
		setSavingEdit(true);
		const { error } = await supabase
			.from("expenses")
			.update({
				name: editForm.name.trim(),
				cash_amount: cash,
				bank_amount: bank,
				amount: cash + bank,
				channel: bank > 0 ? "bank" : "cash",
				expense_type: editForm.expense_type,
				date: editForm.date,
				bank_account_id: bank > 0 ? editForm.bank_account_id : null,
				notes: editForm.notes.trim() || null,
			})
			.eq("id", editExpense.id);
		setSavingEdit(false);
		if (error) {
			toast.error(`فشل التعديل: ${error.message}`);
		} else {
			toast.success("تم تعديل المصروف ✓");
			setEditExpense(null);
			loadData();
		}
	};

	const totalCash = expenses.reduce((s, e) => s + (e.cash_amount || 0), 0);
	const totalBank = expenses.reduce((s, e) => s + (e.bank_amount || 0), 0);
	const totalAll = totalCash + totalBank;
	const totalByType = (type: ExpenseType) =>
		expenses
			.filter((e) => e.expense_type === type)
			.reduce((s, e) => s + (e.cash_amount || 0) + (e.bank_amount || 0), 0);

	const handleExportCsv = () => {
		const dataToExport = expenses.map((e) => ({
			التاريخ: fmtDate(e.date),
			الاسم: e.name,
			النوع: EXPENSE_TYPE_LABELS[e.expense_type],
			نقدي: e.cash_amount || 0,
			بنك: e.bank_amount || 0,
			الحساب: e.bank_accounts?.name || "",
			الملاحظات: e.notes || "",
			الإجمالي: (e.cash_amount || 0) + (e.bank_amount || 0),
		}));
		exportToCsv("Expenses_Export", dataToExport);
	};

	if (loading) return <LoadingSpinner />;

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

			<div className="flex justify-between items-center mb-6">
				<h1 className="text-[20px] font-bold text-[#f0f0f8]">المصاريف</h1>
				<button className={btnPrimary} onClick={() => setShowForm(true)}>
					+ مصروف جديد
				</button>
			</div>

			<ExpensesSummaryCards
				totalAll={totalAll}
				totalCash={totalCash}
				totalBank={totalBank}
				expensesCount={expenses.length}
				totalByType={totalByType}
			/>

			<ExpensesFilterBar
				filterType={filterType}
				setFilterType={setFilterType}
				filterDateFrom={filterDateFrom}
				setFilterDateFrom={setFilterDateFrom}
				filterDateTo={filterDateTo}
				setFilterDateTo={setFilterDateTo}
				onExportCsv={handleExportCsv}
				inputStyle={inputStyle}
				btnSecondary={btnSecondary}
			/>

			<ExpensesTable
				expenses={expenses}
				totalCash={totalCash}
				totalBank={totalBank}
				totalAll={totalAll}
				onEditClick={(e) => {
					setEditExpense(e);
					setEditForm({
						name: e.name,
						cash_amount: String(e.cash_amount || ""),
						bank_amount: String(e.bank_amount || ""),
						expense_type: e.expense_type,
						date: e.date,
						bank_account_id: e.bank_account_id || "",
						notes: e.notes || "",
					});
				}}
			/>

			{showForm && (
				<ExpenseFormModal
					title="مصروف جديد"
					form={form}
					setForm={setForm}
					bankAccounts={bankAccounts}
					saving={saving}
					onClose={() => setShowForm(false)}
					onSave={handleAddClick}
					inputStyle={inputStyle}
					btnPrimary={btnPrimary}
					btnSecondary={btnSecondary}
				/>
			)}

			{editExpense && (
				<ExpenseFormModal
					title="تعديل المصروف"
					form={editForm}
					setForm={setEditForm}
					bankAccounts={bankAccounts}
					saving={savingEdit}
					onClose={() => setEditExpense(null)}
					onSave={handleEditClick}
					inputStyle={inputStyle}
					btnPrimary={btnPrimary}
					btnSecondary={btnSecondary}
				/>
			)}
		</>
	);
}
