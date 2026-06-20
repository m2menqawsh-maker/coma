import { fmt } from "../utils";

interface Props {
	totalRevenue: number;
	totalPaid: number;
	totalDebt: number;
	totalProfit: number;
	invoicesCount: number;
	role: "admin" | "partner" | "viewer" | null;
}

export default function InvoicesSummaryCards({
	totalRevenue,
	totalPaid,
	totalDebt,
	totalProfit,
	invoicesCount,
	role,
}: Props) {
	const cards = [
		{ label: "إجمالي الإيراد", value: totalRevenue, color: "text-indigo-400" },
		{ label: "المحصّل", value: totalPaid, color: "text-green-400" },
		{ label: "الديون المتبقية", value: totalDebt, color: "text-red-400" },
	];

	if (role !== "viewer") {
		cards.push({
			label: "صافي الربح",
			value: totalProfit,
			color: "text-amber-400",
		});
	}

	return (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3 mb-6">
			{cards.map((card) => (
				<div
					key={card.label}
					className="bg-[#111118] rounded-xl py-4 px-5 border border-white/5"
				>
					<div className="text-[11px] text-[#6b6b8a] mb-1.5">{card.label}</div>
					<div
						className={`text-xl font-bold transition-all duration-300 privacy-blur ${card.color}`}
					>
						₪{fmt(card.value)}
					</div>
					<div className="text-[11px] text-[#4a4a6a] mt-1">
						{invoicesCount} فاتورة
					</div>
				</div>
			))}
		</div>
	);
}
