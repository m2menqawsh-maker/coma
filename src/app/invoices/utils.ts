import type { InvoiceStatus } from "./types";

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
	paid: "مدفوع",
	debt: "دين",
	partial: "جزئي",
	cleared: "تمت التصفية",
};

export const STATUS_COLORS: Record<InvoiceStatus, string> = {
	paid: "#4ade80",
	debt: "#f87171",
	partial: "#fbbf24",
	cleared: "#fbbf24",
};

export const DEVICE_LABELS = {
	mobile: "📱 موبايل",
	laptop: "💻 لابتوب",
} as const;

export const fmt = (n: string | number | null | undefined) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n) || 0);

export const fmtDateTime = (d: string) =>
	new Date(d).toLocaleString("ar-IL", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

export const fmtDuration = (mins: number) => {
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	return h > 0 ? `${h}س ${m}د` : `${m}د`;
};

export const inputStyle =
	"bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e8e8f5] w-full outline-none focus:border-indigo-500/50 transition-colors h-[42px] box-border";

export const btnPrimary =
	"bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity h-[42px] whitespace-nowrap";

export const btnSecondary =
	"bg-white/[0.06] border border-white/10 text-[#9090b0] rounded-lg px-4 py-2.5 text-[13px] cursor-pointer hover:bg-white/10 transition-colors h-[42px] whitespace-nowrap";
