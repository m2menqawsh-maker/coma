interface Props {
	todayCash: number;
	todayBank: number;
	todayDebt: number;
	todayRevenue: number;
	fmt: (n: unknown) => string;
	className?: string;
}

export default function TodayCollection({
	todayCash,
	todayBank,
	todayDebt,
	todayRevenue,
	fmt,
	className = "bg-[#101014] rounded-[20px] border border-white/15",
}: Props) {
	return (
		<div className={className}>
			<div className="px-5 py-4 border-b border-white/15">
				<div className="text-sm font-bold text-white">تحصيل اليوم</div>
			</div>
			<div className="p-5">
				{[
					{
						label: "نقدي",
						value: todayCash,
						colorClass: "text-amber-400",
						bgClass: "bg-amber-400",
						icon: "💵",
					},
					{
						label: "بنك",
						value: todayBank,
						colorClass: "text-blue-400",
						bgClass: "bg-blue-400",
						icon: "🏦",
					},
					{
						label: "ديون",
						value: todayDebt,
						colorClass: "text-red-400",
						bgClass: "bg-red-400",
						icon: "⚠",
					},
				].map((item) => {
					const pct = todayRevenue > 0 ? (item.value / todayRevenue) * 100 : 0;
					return (
						<div key={item.label} className="mb-4">
							<div className="flex justify-between mb-1.5">
								<div className="flex items-center gap-2">
									<span className="text-sm">{item.icon}</span>
									<span className="text-[13px] text-zinc-200 font-medium">
										{item.label}
									</span>
								</div>
								<div>
									<span
										className={`text-sm font-extrabold privacy-blur transition-all duration-300 ${item.colorClass}`}
									>
										₪{fmt(item.value)}
									</span>
									<span className="text-[11px] text-zinc-400 mr-1.5 font-semibold privacy-blur transition-all duration-300">
										{pct.toFixed(0)}%
									</span>
								</div>
							</div>
							<div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
								<div
									className={`h-full rounded-full transition-[width] duration-700 ${item.bgClass}`}
									style={{ width: `${pct}%` }}
								/>
							</div>
						</div>
					);
				})}
				<div className="border-t border-white/15 pt-4 flex justify-between items-center">
					<span className="text-[13px] text-zinc-200 font-semibold">
						الإجمالي
					</span>
					<span className="text-lg font-extrabold text-blue-400 privacy-blur transition-all duration-300">
						₪{fmt(todayRevenue)}
					</span>
				</div>
			</div>
		</div>
	);
}
