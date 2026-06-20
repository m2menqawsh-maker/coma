import type { Step } from "./types";

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

export const fmtDateTime = (d: string) =>
	new Date(d).toLocaleString("ar-IL", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

export const DAYS_IN_PERIOD: Record<string, number> = {
	monthly: 30,
	weekly: 7,
	daily: 1,
};

export const STEPS: { id: Step; label: string }[] = [
	{ id: "period", label: "الفترة" },
	{ id: "preview", label: "المعاينة" },
	{ id: "deductions", label: "الخصومات" },
	{ id: "partners", label: "الشركاء" },
	{ id: "confirm", label: "التأكيد" },
];

export const card =
	"bg-[#111118] border border-white/5 rounded-2xl p-[18px_22px]";

export const inputStyle =
	"bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] rounded-lg px-3 py-[9px] text-[13px] text-[#e8e8f5] w-full outline-none focus:border-indigo-500/50 transition-colors";

export const btnPrimary =
	"bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-none rounded-lg px-[18px] py-[9px] text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity";

export const btnSecondary =
	"bg-white/[0.06] border border-white/10 text-[#9090b0] rounded-lg px-[18px] py-[9px] text-[13px] cursor-pointer hover:bg-white/10 transition-colors";
