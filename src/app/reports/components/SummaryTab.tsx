interface ExpByType {
	type: string;
	label: string;
	total: number;
}

interface Props {
	totalRevenue: number;
	totalSessions: number;
	totalGrossProfit: number;
	totalNetProfit: number;
	totalExpenses: number;
	expByType: ExpByType[];
	totalSessionRev: number;
	totalProductRev: number;
	avgInvoice: number;
	avgDuration: number;
	totalCash: number;
	totalBank: number;
	totalDebt: number;
	mobileCount: number;
	laptopCount: number;
	mobileRev: number;
	laptopRev: number;
	totalPlaceCost: number;
	totalProductsCost: number;
	totalCOGS: number;
	fmt: (n: unknown) => string;
	EXPENSE_TYPE_COLORS: Record<
		string,
		{ bg: string; text: string; border?: string }
	>;
	hasInvoices: boolean;
	invoices?: any[];
}

export default function SummaryTab({
	totalRevenue,
	totalSessions,
	totalGrossProfit,
	totalNetProfit,
	totalExpenses,
	expByType,
	totalSessionRev,
	totalProductRev,
	avgInvoice,
	avgDuration,
	totalCash,
	totalBank,
	totalDebt,
	mobileCount,
	laptopCount,
	mobileRev,
	laptopRev,
	totalPlaceCost,
	totalProductsCost,
	totalCOGS,
	fmt,
	EXPENSE_TYPE_COLORS,
	hasInvoices,
	invoices,
}: Props) {
	// --- Device Advanced Stats ---
	const mobileDuration = invoices?.filter(i => i.device === "mobile").reduce((s, i) => s + i.duration_minutes, 0) || 0;
	const laptopDuration = invoices?.filter(i => i.device === "laptop").reduce((s, i) => s + i.duration_minutes, 0) || 0;

	// --- Cross Selling Products ---
	const productSales: Record<string, { qty: number; rev: number; mobileQty: number; laptopQty: number }> = {};
	invoices?.forEach(inv => {
		inv.invoice_items?.forEach((item: any) => {
			if (!productSales[item.product_name]) {
				productSales[item.product_name] = { qty: 0, rev: 0, mobileQty: 0, laptopQty: 0 };
			}
			productSales[item.product_name].qty += item.quantity;
			productSales[item.product_name].rev += Number(item.total_price);
			if (inv.device === "mobile") productSales[item.product_name].mobileQty += item.quantity;
			if (inv.device === "laptop") productSales[item.product_name].laptopQty += item.quantity;
		});
	});
	const topProducts = Object.entries(productSales)
		.map(([name, data]) => ({ name, ...data }))
		.sort((a, b) => b.qty - a.qty)
		.slice(0, 5);

	return (
		<div className="flex flex-col gap-5">
			{/* KPI row */}
			<div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
				{[
					{
						label: "إجمالي الإيراد",
						value: totalRevenue,
						color: "text-indigo-400",
						sub: `${totalSessions} جلسة`,
					},
					{
						label: "الربح الإجمالي",
						value: totalGrossProfit,
						color: "text-green-400",
						sub: `${totalRevenue ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : 0}% من الإيراد`,
					},
					{
						label: "صافي الربح",
						value: totalNetProfit,
						color: "text-emerald-400",
						sub: `بعد خصم حصة المطوّر`,
					},
					{
						label: "إجمالي المصاريف",
						value: totalExpenses,
						color: "text-red-400",
						sub: `${expByType.length} بند`,
					},
				].map((k) => (
					<div
						key={k.label}
						className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5"
					>
						<div className="text-[11px] text-[#6b6b8a] mb-2 uppercase tracking-wide">
							{k.label}
						</div>
						<div className={`text-[26px] font-bold ${k.color}`}>
							₪{fmt(k.value)}
						</div>
						<div className="text-[11px] text-[#4a4a6a] mt-1.5">{k.sub}</div>
					</div>
				))}
			</div>

			{/* Revenue breakdown + Collection method */}
			<div className="grid grid-cols-2 gap-3.5">
				{/* Revenue breakdown */}
				<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5">
					<div className="text-[13px] font-semibold text-[#e0e0f0] mb-4">
						تفصيل الإيراد
					</div>
					{[
						{
							label: "جلسات",
							value: totalSessionRev,
							color: "text-indigo-400",
							bg: "bg-indigo-400",
							pct: totalRevenue ? (totalSessionRev / totalRevenue) * 100 : 0,
						},
						{
							label: "منتجات",
							value: totalProductRev,
							color: "text-amber-400",
							bg: "bg-amber-400",
							pct: totalRevenue ? (totalProductRev / totalRevenue) * 100 : 0,
						},
					].map((r) => (
						<div key={r.label} className="mb-3.5">
							<div className="flex justify-between mb-1.5">
								<span className="text-xs text-[#9090b0]">{r.label}</span>
								<span className={`text-[13px] font-bold ${r.color}`}>
									₪{fmt(r.value)}
								</span>
							</div>
							<div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
								<div
									style={{ width: `${r.pct}%` }}
									className={`h-full ${r.bg} rounded-full transition-all duration-500`}
								/>
							</div>
							<div className="text-[11px] text-[#4a4a6a] mt-1">
								{r.pct.toFixed(1)}%
							</div>
						</div>
					))}
					<div className="border-t border-white/5 pt-3 mt-1">
						<div className="flex justify-between">
							<span className="text-xs text-[#6b6b8a]">متوسط الفاتورة</span>
							<span className="text-[13px] font-bold text-[#c0c0e0]">
								₪{fmt(avgInvoice)}
							</span>
						</div>
						<div className="flex justify-between mt-1.5">
							<span className="text-xs text-[#6b6b8a]">متوسط مدة الجلسة</span>
							<span className="text-[13px] font-bold text-[#c0c0e0]">
								{Math.round(avgDuration)} دقيقة
							</span>
						</div>
					</div>
				</div>

				{/* Collection */}
				<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5">
					<div className="text-[13px] font-semibold text-[#e0e0f0] mb-4">
						طريقة التحصيل
					</div>
					{[
						{
							label: "نقدي",
							value: totalCash,
							color: "text-amber-400",
							bg: "bg-amber-400",
							pct: totalRevenue ? (totalCash / totalRevenue) * 100 : 0,
						},
						{
							label: "بنك",
							value: totalBank,
							color: "text-blue-400",
							bg: "bg-blue-400",
							pct: totalRevenue ? (totalBank / totalRevenue) * 100 : 0,
						},
						{
							label: "ديون",
							value: totalDebt,
							color: "text-red-400",
							bg: "bg-red-400",
							pct: totalRevenue ? (totalDebt / totalRevenue) * 100 : 0,
						},
					].map((r) => (
						<div key={r.label} className="mb-3.5">
							<div className="flex justify-between mb-1.5">
								<span className="text-xs text-[#9090b0]">{r.label}</span>
								<span className={`text-[13px] font-bold ${r.color}`}>
									₪{fmt(r.value)}
								</span>
							</div>
							<div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
								<div
									style={{ width: `${r.pct}%` }}
									className={`h-full ${r.bg} rounded-full transition-all duration-500`}
								/>
							</div>
							<div className="text-[11px] text-[#4a4a6a] mt-1">
								{r.pct.toFixed(1)}%
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Device comparison + Cost breakdown */}
			<div className="grid grid-cols-2 gap-3.5">
				{/* Device */}
				<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5">
					<div className="text-[13px] font-semibold text-[#e0e0f0] mb-4">
						مقارنة الأجهزة
					</div>
					{[
						{
							label: "📱 موبايل",
							count: mobileCount,
							rev: mobileRev,
							duration: mobileDuration,
							color: "text-indigo-400",
						},
						{
							label: "💻 لابتوب",
							count: laptopCount,
							rev: laptopRev,
							duration: laptopDuration,
							color: "text-blue-400",
						},
					].map((d) => (
						<div
							key={d.label}
							className="flex justify-between items-center py-3 px-3.5 rounded-lg bg-white/5 mb-2 border border-white/5"
						>
							<div>
								<div className={`text-[13px] font-semibold ${d.color}`}>
									{d.label}
								</div>
								<div className="text-[11px] text-[#6b6b8a] mt-[3px] flex gap-2">
									<span>{d.count} جلسة</span>
									<span>•</span>
									<span>{Math.round(d.duration / 60)} ساعة</span>
								</div>
							</div>
							<div className="text-left">
								<div className="text-base font-bold text-[#e0e0f0]">
									₪{fmt(d.rev)}
								</div>
								<div className="text-[11px] text-[#4a4a6a] mt-[3px]">
									{totalRevenue ? ((d.rev / totalRevenue) * 100).toFixed(1) : 0}
									% من الدخل
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Cross Selling Products */}
				<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5">
					<div className="text-[13px] font-semibold text-[#e0e0f0] mb-4 flex justify-between items-center">
						<span>المنتجات التكميلية (Cross-Selling)</span>
						<span className="text-[10px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full">الأكثر مبيعاً مع الجلسات</span>
					</div>
					{topProducts.length === 0 ? (
						<div className="text-xs text-[#4a4a6a] text-center mt-6">لا يوجد طلبات منتجات</div>
					) : (
						<div className="flex flex-col gap-2">
							{topProducts.map((p, i) => (
								<div key={p.name} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
									<div className="flex items-center gap-3">
										<div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
											{i + 1}
										</div>
										<div>
											<div className="text-[12px] font-semibold text-zinc-200">{p.name}</div>
											<div className="text-[10px] text-[#6b6b8a] mt-1">
												موبايل: {p.mobileQty} | لابتوب: {p.laptopQty}
											</div>
										</div>
									</div>
									<div className="text-right">
										<div className="text-[13px] font-bold text-amber-400">₪{fmt(p.rev)}</div>
										<div className="text-[10px] text-zinc-500 mt-0.5">{p.qty} طلب</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
				{/* Cost breakdown */}
				<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5">
					<div className="text-[13px] font-semibold text-[#e0e0f0] mb-4">
						تفصيل التكاليف
					</div>

					{/* COGS */}
					<div className="mb-2.5">
						<div className="text-[11px] text-[#6b6b8a] mb-2">
							تكلفة البضاعة (COGS)
						</div>
						{[
							{
								label: "تكلفة المكان",
								value: totalPlaceCost,
								color: "text-orange-400",
							},
							{
								label: "تكلفة المنتجات",
								value: totalProductsCost,
								color: "text-amber-400",
							},
						].map((c) => (
							<div key={c.label} className="flex justify-between mb-1.5">
								<span className="text-xs text-[#9090b0]">{c.label}</span>
								<span className={`text-[13px] font-semibold ${c.color}`}>
									₪{fmt(c.value)}
								</span>
							</div>
						))}
					</div>

					<div className="border-t border-white/5 pt-2.5 mb-2.5">
						<div className="text-[11px] text-[#6b6b8a] mb-2">
							المصاريف التشغيلية
						</div>
						{expByType.length === 0 ? (
							<div className="text-xs text-[#4a4a6a]">لا مصاريف هذا الشهر</div>
						) : (
							expByType.map((e) => (
								<div key={e.type} className="flex justify-between mb-1.5">
									<div className="flex items-center gap-1.5">
										<span
											className={`w-[7px] h-[7px] rounded-full inline-block shrink-0 ${EXPENSE_TYPE_COLORS[e.type]?.bg}`}
										/>
										<span className="text-xs text-[#9090b0]">{e.label}</span>
									</div>
									<span
										className={`text-[13px] font-semibold ${EXPENSE_TYPE_COLORS[e.type]?.text}`}
									>
										₪{fmt(e.total)}
									</span>
								</div>
							))
						)}
					</div>

					<div className="border-t border-white/5 pt-2.5">
						<div className="flex justify-between">
							<span className="text-[13px] font-semibold text-[#9090b0]">
								إجمالي التكاليف
							</span>
							<span className="text-sm font-bold text-red-400">
								₪{fmt(totalCOGS + totalExpenses)}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* No data */}
			{!hasInvoices && (
				<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5 text-center py-[60px] px-5 text-[#4a4a6a] text-sm">
					لا توجد فواتير في هذا الشهر
				</div>
			)}
		</div>
	);
}
