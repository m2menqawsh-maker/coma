import type { ExpenseType } from "./types";

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
	fixed: "ثابت (إيجار/كهرباء)",
	one_time: "طارئ",
	purchase: "مشتريات",
	loan_repayment: "سداد قرض",
};

export const EXPENSE_TYPE_COLORS: Record<
	ExpenseType,
	{ bg: string; text: string; border: string }
> = {
	fixed: {
		bg: "bg-red-400/10",
		text: "text-red-400",
		border: "border-red-400/20",
	},
	one_time: {
		bg: "bg-orange-400/10",
		text: "text-orange-400",
		border: "border-orange-400/20",
	},
	purchase: {
		bg: "bg-amber-400/10",
		text: "text-amber-400",
		border: "border-amber-400/20",
	},
	loan_repayment: {
		bg: "bg-purple-400/10",
		text: "text-purple-400",
		border: "border-purple-400/20",
	},
};

export const fmt = (n: unknown) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n) || 0);

export const fmtDate = (d: string) =>
	new Date(d).toLocaleDateString("ar-IL", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

export const inputStyle =
	"bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e8e8f5] w-full outline-none box-border h-[42px] focus:border-[#4f6ef7] focus:shadow-[0_0_0_3px_rgba(79,110,247,0.12)] transition-all duration-200";

export const btnPrimary =
	"bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] border-none rounded-lg text-white px-4 py-2.5 text-[13px] font-semibold cursor-pointer h-[42px] whitespace-nowrap shadow-[0_6px_20px_rgba(79,110,247,0.3)] hover:opacity-90 transition-opacity disabled:opacity-65 disabled:cursor-not-allowed flex items-center justify-center";

export const btnSecondary =
	"bg-white/5 border border-white/10 rounded-lg text-[#9090b0] px-4 py-2.5 text-[13px] cursor-pointer h-[42px] whitespace-nowrap hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
