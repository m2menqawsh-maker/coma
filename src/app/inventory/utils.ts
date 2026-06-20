export const fmt = (n: unknown) =>
	new Intl.NumberFormat("ar-IL", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 3,
	}).format(Number(n) || 0);

export const inputStyle =
	"bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e8e8f5] w-full outline-none box-border h-[42px] focus:border-indigo-500/50 transition-colors";

export const btnPrimary =
	"bg-gradient-to-br from-indigo-500 to-violet-600 border-none rounded-lg text-white px-4 py-2.5 text-[13px] font-semibold cursor-pointer h-[42px] whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed";

export const btnSecondary =
	"bg-white/5 border border-white/10 rounded-lg text-[#9090b0] px-4 py-2.5 text-[13px] cursor-pointer h-[42px] whitespace-nowrap hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
