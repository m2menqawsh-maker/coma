import BusyHoursChart from "@/components/BusyHoursChart";
import DashboardChart from "@/components/DashboardChart";

interface DailyData {
	day: string;
	label: string;
	revenue: number;
	netProfit: number;
	expenses: number;
	sessions: number;
}

interface BusyHourData {
	hour: string;
	count: number;
	rev: number;
}

interface Props {
	dailyData: DailyData[];
	busyHoursData: BusyHourData[];
	fmt: (n: unknown) => string;
}

export default function DailyTab({ dailyData, busyHoursData, fmt }: Props) {
	if (dailyData.length === 0) {
		return (
			<div className="bg-[#111118] rounded-2xl border border-white/10 text-center py-20 px-5 text-[#4a4a6a] text-sm">
				لا يوجد بيانات للأيام في هذا الشهر
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			<DashboardChart
				data={dailyData.map((d) => ({
					date: d.day.substring(5),
					revenue: d.revenue,
				}))}
			/>
			<BusyHoursChart data={busyHoursData} />

			{/* Daily table */}
			<div className="bg-[#111118] rounded-2xl border border-white/10 p-0 overflow-hidden">
				<div className="py-4 px-[22px] border-b border-white/5 text-[13px] font-semibold text-[#e0e0f0]">
					تفاصيل الأيام
				</div>
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-right text-[13px]">
						<thead>
							<tr className="bg-white/5 text-[#9090b0]">
								<th className="py-3 px-[22px] font-medium">التاريخ</th>
								<th className="py-3 px-[22px] font-medium">الإيرادات</th>
								<th className="py-3 px-[22px] font-medium">المصروفات</th>
								<th className="py-3 px-[22px] font-medium">صافي الربح</th>
							</tr>
						</thead>
						<tbody>
							{dailyData.map((d, i) => {
								const net = d.netProfit - d.expenses;
								return (
									<tr
										key={d.day}
										className={
											i < dailyData.length - 1 ? "border-b border-white/5" : ""
										}
									>
										<td className="py-3 px-[22px] text-[#c0c0d8]">{d.day}</td>
										<td className="py-3 px-[22px] text-green-400 font-semibold">
											{fmt(d.revenue)}
										</td>
										<td className="py-3 px-[22px] text-red-400">
											{fmt(d.expenses)}
										</td>
										<td
											className={`py-3 px-[22px] font-bold ${net >= 0 ? "text-green-400" : "text-red-400"}`}
										>
											{fmt(net)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
