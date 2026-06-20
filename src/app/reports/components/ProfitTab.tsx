interface PartnerDist {
	id: string;
	name: string;
	share_percent: number;
	share: number;
	allTimeShare: number;
}

interface Props {
	partners: { id: string }[];
	totalNetProfit: number;
	partnerDist: PartnerDist[];
	fmt: (n: unknown) => string;
}

export default function ProfitTab({
	partners,
	totalNetProfit,
	partnerDist,
	fmt,
}: Props) {
	if (partners.length === 0) {
		return (
			<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5 text-center py-[60px] px-5 text-[#4a4a6a] text-sm">
				لا يوجد شركاء — أضفهم من صفحة الإعدادات
			</div>
		);
	}

	if (totalNetProfit <= 0) {
		return (
			<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5 text-center py-[60px] px-5 text-[#4a4a6a] text-sm">
				لا يوجد أرباح كافية للتوزيع هذا الشهر
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5">
				<div className="text-[13px] font-semibold text-[#e0e0f0] mb-[18px]">
					توزيع صافي ربح الشهر — ₪{fmt(totalNetProfit)}
				</div>

				{/* Stacked bar */}
				<div className="flex h-7 rounded-lg overflow-hidden mb-4">
					{partnerDist.map((p, idx) => {
						const bgColors = ["bg-indigo-400", "bg-green-400", "bg-amber-400"];
						return (
							<div
								key={p.id}
								style={{ width: `${p.share_percent}%` }}
								className={`flex items-center justify-center text-[11px] font-bold text-[#0d0d14] transition-all duration-500 ${bgColors[idx % bgColors.length]}`}
								title={`${p.name}: ₪${fmt(p.share)}`}
							>
								{p.share_percent}%
							</div>
						);
					})}
				</div>

				{/* Legend */}
				<div className="flex gap-5 flex-wrap">
					{partnerDist.map((p, idx) => {
						const bgColors = ["bg-indigo-400", "bg-green-400", "bg-amber-400"];
						const textColors = [
							"text-indigo-400",
							"text-green-400",
							"text-amber-400",
						];
						const bgColor = bgColors[idx % bgColors.length];
						const textColor = textColors[idx % textColors.length];
						return (
							<div key={p.id} className="flex items-center gap-2">
								<div className={`w-3 h-3 rounded-[3px] shrink-0 ${bgColor}`} />
								<span className="text-xs text-[#9090b0]">{p.name}</span>
								<span className={`text-[13px] font-bold ${textColor}`}>
									₪{fmt(p.share)}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
