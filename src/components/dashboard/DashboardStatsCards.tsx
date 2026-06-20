import { useRouter } from "next/navigation";

interface Props {
	role: "admin" | "partner" | "viewer" | null;
	activeSessionsCount: number;
	liveRevenue: number;
	todayRevenue: number;
	todayInvoicesCount: number;
	todayProfit: number;
	monthNetProfit: number;
	cashBalance: number;
	totalBankBal: number;
	bankAccountsCount: number;
	fmt: (n: unknown) => string;
}

export default function DashboardStatsCards({
	role,
	activeSessionsCount,
	liveRevenue,
	todayRevenue,
	todayInvoicesCount,
	todayProfit,
	monthNetProfit,
	cashBalance,
	totalBankBal,
	bankAccountsCount,
	fmt,
}: Props) {
	const router = useRouter();

	const baseCardClass =
		"bg-[#101014] rounded-[20px] border border-white/15 px-5 py-[18px]";

	return (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-3.5">
			{[
				{
					label: "جلسات نشطة",
					value: activeSessionsCount,
					colorClass: activeSessionsCount > 0 ? "text-white" : "text-zinc-400",
					subColorClass:
						activeSessionsCount > 0 ? "text-white/85" : "text-[#5a5a7a]",
					sub:
						activeSessionsCount > 0
							? role === "viewer"
								? "نشطة"
								: `₪${fmt(liveRevenue)} لحظياً`
							: "لا يوجد",
					glow: activeSessionsCount > 0,
					solidBgClass:
						activeSessionsCount > 0
							? "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] border-transparent shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
							: undefined,
					onClick: () => router.push("/sessions"),
				},
				{
					label: "إيراد اليوم",
					value: `₪${fmt(todayRevenue)}`,
					colorClass: "text-white",
					subColorClass: "text-white/85",
					sub: `${todayInvoicesCount} فاتورة`,
					solidBgClass:
						"bg-gradient-to-br from-[#3b82f6] to-[#2563eb] border-transparent shadow-[0_8px_20px_rgba(0,0,0,0.3)]",
				},
				...(role !== "viewer"
					? [
							{
								label: "ربح اليوم",
								value: `₪${fmt(todayProfit)}`,
								colorClass: "text-[#4ade80]",
								sub: `${todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(1) : 0}% هامش`,
							},
							{
								label: "ربح الشهر",
								value: `₪${fmt(monthNetProfit)}`,
								colorClass: "text-[#34d399]",
								sub: new Date().toLocaleDateString("ar-IL", {
									month: "long",
								}),
							},
							{
								label: "الخزينة",
								value: `₪${fmt(cashBalance)}`,
								colorClass:
									cashBalance >= 0 ? "text-[#fbbf24]" : "text-[#f87171]",
								sub: "نقدي",
							},
							{
								label: "البنك",
								value: `₪${fmt(totalBankBal)}`,
								colorClass: "text-[#60a5fa]",
								sub: `${bankAccountsCount} حساب`,
							},
						]
					: []),
			].map((k, idx) => (
				<div
					key={idx}
					onClick={k.onClick}
					className={`${baseCardClass} ${
						k.onClick ? "cursor-pointer" : "cursor-default"
					} ${k.solidBgClass || ""}`}
				>
					<div
						className={`text-xs mb-2 font-bold uppercase tracking-wide ${
							k.solidBgClass ? "text-white/90" : "text-zinc-400"
						}`}
					>
						{k.label}
					</div>
					<div
						className={`font-extrabold transition-all duration-300 ${k.colorClass} ${
							typeof k.value === "number" || k.solidBgClass
								? "text-[34px]"
								: "text-[26px]"
						} ${k.label !== "جلسات نشطة" ? "privacy-blur" : ""}`}
					>
						{k.value}
					</div>
					<div
						className={`text-xs mt-1.5 font-semibold transition-all duration-300 ${
							k.subColorClass || "text-[#7a7a9a]"
						} ${k.label !== "جلسات نشطة" ? "privacy-blur" : ""}`}
					>
						{k.sub}
						{k.glow ? " ●" : ""}
					</div>
				</div>
			))}
		</div>
	);
}
