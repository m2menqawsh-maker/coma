import {
	Area,
	Bar,
	CartesianGrid,
	ComposedChart,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface Props {
	ledgerEntries: any[];
	customersWithDebt: any[];
	activeLoans: any[];
	fmt: (n: unknown) => string;
	days: string[];
}

export default function FinanceTab({
	ledgerEntries,
	customersWithDebt,
	activeLoans,
	fmt,
	days,
}: Props) {
	// Cash Flow Chart Data
	const cashFlowData = days.map((day) => {
		const dayEntries = ledgerEntries.filter((e) => e.date === day);
		const cashIn = dayEntries
			.filter((e) => e.direction === "in")
			.reduce((s, e) => s + e.amount, 0);
		const cashOut = dayEntries
			.filter((e) => e.direction === "out")
			.reduce((s, e) => s + e.amount, 0);
		const netCash = cashIn - cashOut;

		return {
			date: day.substring(5), // e.g. "10-01"
			cashIn,
			cashOut,
			netCash,
		};
	});

	// Stats
	const totalCashIn = cashFlowData.reduce((s, d) => s + d.cashIn, 0);
	const totalCashOut = cashFlowData.reduce((s, d) => s + d.cashOut, 0);
	const totalNetCash = totalCashIn - totalCashOut;

	const totalCustomerDebts = customersWithDebt.reduce(
		(s, c) => s + Math.abs(c.balance),
		0,
	);

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload?.length) {
			return (
				<div className="bg-[#18181b] border border-white/10 rounded-xl p-3 text-white text-[13px] shadow-xl">
					<p className="mb-2 font-medium text-zinc-300">التاريخ: {label}</p>
					{payload.map((entry: any, index: number) => {
						let color = "#818cf8";
						let labelStr = "صافي النقد";
						if (entry.dataKey === "cashIn") {
							color = "#4ade80";
							labelStr = "مقبوضات";
						}
						if (entry.dataKey === "cashOut") {
							color = "#f87171";
							labelStr = "مدفوعات";
						}
						return (
							<p
								key={index}
								className="font-bold m-0 mb-1"
								style={{ color }}
							>
								{labelStr}: ₪{entry.value.toFixed(2)}
							</p>
						);
					})}
				</div>
			);
		}
		return null;
	};

	return (
		<div className="flex flex-col gap-6">
			{/* High Level Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
				<div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
					<div className="text-[13px] text-[#6b6b8a] mb-2 font-medium">
						إجمالي المقبوضات (Cash In)
					</div>
					<div className="text-2xl font-bold text-green-400">
						₪{fmt(totalCashIn)}
					</div>
				</div>
				<div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
					<div className="text-[13px] text-[#6b6b8a] mb-2 font-medium">
						إجمالي المدفوعات (Cash Out)
					</div>
					<div className="text-2xl font-bold text-red-400">
						₪{fmt(totalCashOut)}
					</div>
				</div>
				<div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
					<div className="text-[13px] text-[#6b6b8a] mb-2 font-medium">
						صافي النقدية
					</div>
					<div
						className={`text-2xl font-bold ${totalNetCash >= 0 ? "text-indigo-400" : "text-red-400"
							}`}
					>
						₪{fmt(totalNetCash)}
					</div>
				</div>
			</div>

			{/* Chart */}
			<div className="bg-[#111118] rounded-2xl p-[20px_24px] border border-white/5">
				<h3 className="m-0 mb-6 text-base text-[#e0e0f0] font-bold">
					التدفق النقدي اللحظي (Cash Flow)
				</h3>
				<div className="w-full h-[300px]" dir="ltr">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart
							data={cashFlowData}
							margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke="rgba(255,255,255,0.05)"
							/>
							<XAxis
								dataKey="date"
								stroke="#6b6b8a"
								fontSize={11}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="#6b6b8a"
								fontSize={11}
								tickLine={false}
								axisLine={false}
								allowDecimals={false}
							/>
							<Tooltip
								content={<CustomTooltip />}
								cursor={{ fill: "rgba(255,255,255,0.05)" }}
							/>
							<Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
							<Bar
								dataKey="cashIn"
								name="مقبوضات"
								fill="#4ade80"
								radius={[4, 4, 0, 0]}
								barSize={12}
							/>
							<Bar
								dataKey="cashOut"
								name="مدفوعات"
								fill="#f87171"
								radius={[4, 4, 0, 0]}
								barSize={12}
							/>
							<Area
								type="monotone"
								dataKey="netCash"
								name="الصافي"
								stroke="#818cf8"
								fill="rgba(129, 140, 248, 0.1)"
								strokeWidth={2}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Debts & Loans Tables */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Customers Debts */}
				<div className="bg-[#111118] rounded-2xl border border-white/10 p-0 overflow-hidden flex flex-col h-full">
					<div className="py-4 px-5 border-b border-white/5 flex justify-between items-center bg-white/5">
						<div className="text-[14px] font-bold text-red-400 flex items-center gap-2">
							<span className="text-lg">⚠️</span> ديون العملاء المتأخرة
						</div>
						<div className="text-[13px] font-bold text-red-400 bg-red-400/10 py-1 px-3 rounded-full">
							إجمالي: ₪{fmt(totalCustomerDebts)}
						</div>
					</div>
					<div className="overflow-y-auto max-h-[300px]">
						{customersWithDebt.length === 0 ? (
							<div className="text-center py-10 text-[#6b6b8a] text-sm">
								لا يوجد ديون على العملاء
							</div>
						) : (
							<table className="w-full border-collapse text-right text-[13px]">
								<tbody>
									{customersWithDebt.map((c, i) => (
										<tr
											key={c.id}
											className={
												i < customersWithDebt.length - 1
													? "border-b border-white/5"
													: ""
											}
										>
											<td className="py-3.5 px-5 font-semibold text-[#e0e0f0]">
												{c.name}
											</td>
											<td className="py-3.5 px-5 text-[#6b6b8a] text-xs">
												{c.phone || "بدون رقم"}
											</td>
											<td className="py-3.5 px-5 font-bold text-red-400 text-left">
												₪{fmt(Math.abs(c.balance))}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>

				{/* Active Loans */}
				<div className="bg-[#111118] rounded-2xl border border-white/10 p-0 overflow-hidden flex flex-col h-full">
					<div className="py-4 px-5 border-b border-white/5 flex justify-between items-center bg-white/5">
						<div className="text-[14px] font-bold text-purple-400 flex items-center gap-2">
							<span className="text-lg">🏦</span> القروض المفتوحة
						</div>
						<div className="text-[13px] font-bold text-purple-400 bg-purple-400/10 py-1 px-3 rounded-full">
							عدد القروض: {activeLoans.length}
						</div>
					</div>
					<div className="overflow-y-auto max-h-[300px]">
						{activeLoans.length === 0 ? (
							<div className="text-center py-10 text-[#6b6b8a] text-sm">
								لا يوجد قروض نشطة
							</div>
						) : (
							<table className="w-full border-collapse text-right text-[13px]">
								<tbody>
									{activeLoans.map((loan, i) => {
										const paid = (loan.loan_payments || []).reduce(
											(s: number, p: any) => s + p.amount,
											0,
										);
										const remaining = loan.principal - paid;
										return (
											<tr
												key={loan.id}
												className={
													i < activeLoans.length - 1
														? "border-b border-white/5"
														: ""
												}
											>
												<td className="py-3.5 px-5">
													<div className="font-semibold text-[#e0e0f0] mb-0.5">
														{loan.lender_name}
													</div>
													<div className="text-[11px] text-[#6b6b8a]">
														{loan.reason}
													</div>
												</td>
												<td className="py-3.5 px-5 text-left">
													<div className="font-bold text-purple-400">
														متبقي: ₪{fmt(remaining)}
													</div>
													<div className="text-[11px] text-[#6b6b8a]">
														من أصل ₪{fmt(loan.principal)}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
