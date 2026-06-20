import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload?.length) {
		return (
			<div className="bg-[#18181b] border border-white/10 rounded-xl p-3 text-white text-sm shadow-xl">
				<p className="mb-2 font-medium">{label}</p>
				{payload.map((entry: any, index: number) => (
					<p key={index} className="text-blue-400 font-bold m-0">
						{entry.name}: ₪{entry.value}
					</p>
				))}
			</div>
		);
	}
	return null;
};

export default function DashboardChart({
	data,
}: {
	data: { date: string; revenue: number }[];
}) {
	if (!data || data.length === 0) return null;

	return (
		<div className="bg-[#101014] rounded-[20px] p-6 border border-white/15 mt-5 transition-all duration-300 privacy-hide-chart">
			<h3 className="m-0 mb-5 text-base text-[#e0e0f0] font-bold">
				أداء الإيرادات (آخر 7 أيام)
			</h3>
			<div className="w-full h-[300px]" dir="ltr">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={data}
						margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
					>
						<defs>
							<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
								<stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							stroke="rgba(255,255,255,0.05)"
						/>
						<XAxis
							dataKey="date"
							stroke="#6b6b8a"
							fontSize={12}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							stroke="#6b6b8a"
							fontSize={12}
							tickLine={false}
							axisLine={false}
							tickFormatter={(value) => `₪${value}`}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Area
							type="monotone"
							dataKey="revenue"
							name="الإيراد"
							stroke="#60a5fa"
							strokeWidth={3}
							fillOpacity={1}
							fill="url(#colorRevenue)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
